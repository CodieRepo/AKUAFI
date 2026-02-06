'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseclient';
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
    coupon_type: 'flat',
    coupon_min_value: '',
    coupon_max_value: ''
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

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            // Coupon values are sent but ignored by API for now as per schema limitations
            coupon_min_value: Number(formData.coupon_min_value),
            coupon_max_value: Number(formData.coupon_max_value)
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
    <div className="max-w-2xl mx-auto py-6">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <nav className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/admin/campaigns" className="hover:text-gray-900">Campaigns</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">New Campaign</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-sm text-gray-500 mt-1">Define campaign duration and coupon rules.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <strong>Error:</strong> {error}
            </div>
        )}
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {/* Section 1: Campaign Details */}
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Campaign Name</label>
                    <input 
                        name="name"
                        type="text" 
                        required
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="e.g. Summer Blast 2026"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Description (Optional)</label>
                    <textarea 
                        name="description"
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
                        placeholder="Campaign details..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Start Date</label>
                        <input 
                            name="start_date"
                            type="datetime-local" 
                            required
                            className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">End Date</label>
                        <input 
                            name="end_date"
                            type="datetime-local" 
                            required
                            className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={formData.end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Coupon Rules */}
            <div className="p-6 bg-gray-50/50 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Coupon Configuration</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select 
                        name="coupon_type"
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                        value={formData.coupon_type}
                        onChange={handleChange}
                    >
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                        <input 
                            name="coupon_min_value"
                            type="number" 
                            required
                            min="0"
                            className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Min"
                            value={formData.coupon_min_value}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                        <input 
                            name="coupon_max_value"
                            type="number" 
                            required
                            min="0"
                            className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Max"
                            value={formData.coupon_max_value}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500">
                    Defines the range or fixed value of the coupon reward.
                </p>
            </div>

            <div className="p-6 flex items-center justify-end gap-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                 <Link href="/admin/campaigns">
                    <Button variant="ghost" type="button" className="text-gray-500 hover:text-gray-900">Cancel</Button>
                 </Link>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-md">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Create Campaign
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
}
