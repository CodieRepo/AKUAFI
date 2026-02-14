'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    coupon_type: 'alphanumeric',
    coupon_min_value: '',
    coupon_max_value: '',
    coupon_prefix: '',
    coupon_length: 6,
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error when user changes input
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend Validation
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError("End date cannot be before start date.");
        setLoading(false);
        return;
    }

    try {
      // Authenticate check bypassed for local dev preview if handled by middleware/api
      // Strict auth is handled in the API route calling verifyAdmin

      // Convert to UTC ISO Strings for Storage
      const startUTC = new Date(formData.start_date).toISOString();
      const endUTC = new Date(formData.end_date).toISOString();

      const supabase = createClient(); 
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            start_date: startUTC,
            end_date: endUTC,
            // Coupon values are sent but ignored by API for now as per schema limitations
            coupon_min_value: Number(formData.coupon_min_value),
            coupon_max_value: Number(formData.coupon_max_value),
            // New Customization Fields
            coupon_prefix: formData.coupon_prefix,
            coupon_length: Number(formData.coupon_length),
            coupon_type: formData.coupon_type,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create campaign');
      }

      router.push('/admin/campaigns');
      router.refresh(); // Refresh Client Cache
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            <Link href="/admin/campaigns" className="hover:text-gray-900 dark:hover:text-white transition-colors">Campaigns</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900 dark:text-white">New Campaign</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Campaign</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Define campaign duration and coupon rules.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        {error && (
            <div className="mx-8 mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center">
                <div className="mr-3">⚠️</div>
                <strong>Error:</strong> <span className="ml-1">{error}</span>
            </div>
        )}
        <form onSubmit={handleSubmit}>
            {/* Section 1: Campaign Details */}
            <div className="p-8 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Campaign Name</label>
                    <input 
                        name="name"
                        type="text" 
                        required
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="e.g. Summer Blast 2026"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Description (Optional)</label>
                    <textarea 
                        name="description"
                        className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none transition-all placeholder:text-gray-400"
                        placeholder="Campaign details..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Start Date</label>
                        <input 
                            name="start_date"
                            type="datetime-local" 
                            required
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">End Date</label>
                        <input 
                            name="end_date"
                            type="datetime-local" 
                            required
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Coupon Rules */}
            <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coupon Configuration</h3>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coupon Prefix</label>
                        <input 
                            name="coupon_prefix"
                            type="text" 
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase placeholder:text-gray-400"
                            placeholder="e.g. SUMMER"
                            value={formData.coupon_prefix}
                            onChange={(e) => setFormData({...formData, coupon_prefix: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Length</label>
                        <input 
                            name="coupon_length"
                            type="number" 
                            min="4"
                            max="12"
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.coupon_length}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                        <select 
                            name="coupon_type"
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
                            value={formData.coupon_type}
                            onChange={handleChange}
                        >
                            <option value="alphanumeric">Alphanumeric (A-Z, 0-9)</option>
                            <option value="numeric">Numeric (0-9)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Value</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                            <input 
                                name="coupon_min_value"
                                type="number" 
                                required
                                min="0"
                                className="w-full h-11 pl-8 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="0"
                                value={formData.coupon_min_value}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Value</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                            <input 
                                name="coupon_max_value"
                                type="number" 
                                required
                                min="0"
                                className="w-full h-11 pl-8 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="100"
                                value={formData.coupon_max_value}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    * Defines the range or fixed value of the coupon reward.
                </p>
            </div>

            <div className="p-8 flex items-center justify-end gap-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 rounded-b-xl">
                 <Link href="/admin/campaigns">
                    <Button variant="ghost" type="button" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white h-11">Cancel</Button>
                 </Link>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-lg h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white border-0">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    Create Campaign
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
}
