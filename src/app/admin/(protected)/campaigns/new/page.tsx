'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  client_name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    client_id: '', 
    location: '', // New Field
    campaign_date: '', // New Field
    coupon_type: 'alphanumeric',
    coupon_min_value: '',
    coupon_max_value: '',
    coupon_prefix: '',
    coupon_length: 6,
    discount_type: 'fixed',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1️⃣ Fetch Clients on Mount
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/admin/clients');
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 3️⃣ Validation
    if (!formData.client_id) {
        setError("Please assign a client to this campaign.");
        setLoading(false);
        return;
    }

    if (!formData.location) {
        setError("Please specify a Location Tag (e.g. City Name).");
        setLoading(false);
        return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError("End date cannot be before start date.");
        setLoading(false);
        return;
    }

    if (formData.discount_type === 'percentage') {
        if (Number(formData.coupon_max_value) > 100) {
            setError("Max value cannot exceed 100% for percentage discounts.");
            setLoading(false);
            return;
        }
    }

    try {
      const startUTC = new Date(formData.start_date).toISOString();
      const endUTC = new Date(formData.end_date).toISOString();

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            start_date: startUTC,
            end_date: endUTC,
            client_id: formData.client_id, // 4️⃣ Send client_id
            location: formData.location.trim(),
            campaign_date: formData.campaign_date || null,
            coupon_min_value: Number(formData.coupon_min_value),
            coupon_max_value: Number(formData.coupon_max_value),
            coupon_prefix: formData.coupon_prefix,
            coupon_length: Number(formData.coupon_length),
            coupon_type: formData.coupon_type,
            discount_type: formData.discount_type,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create campaign');
      }

      router.push('/admin/campaigns');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
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
                
                {/* 2️⃣ Add Client Dropdown */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Assign to Client</label>
                    <div className="relative">
                        <select
                            name="client_id"
                            required
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all disabled:opacity-50"
                            value={formData.client_id}
                            onChange={handleChange}
                            disabled={loadingClients}
                        >
                            <option value="">Select a Client</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.client_name}
                                </option>
                            ))}
                        </select>
                         {/* Dropdown Icon */}
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                         </div>
                    </div>
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
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Location Tag</label>
                        <input 
                            name="location"
                            type="text" 
                            required
                            placeholder="e.g. Mumbai South"
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.location}
                            onChange={handleChange}
                        />
                         <p className="text-[10px] text-gray-500 mt-1">Shown in admin list for filtering.</p>
                    </div>
                    <div>
                         <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Campaign Month/Date (Optional)</label>
                        <input 
                            name="campaign_date"
                            type="date"
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.campaign_date}
                            onChange={handleChange}
                        />
                    </div>
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

            <div className="p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 space-y-6">
                {/* Coupon Config Code Remains Same... (Skipping some redundant lines for brevity if unchanged logic, but including for completeness) */}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount Type</label>
                        <select 
                            name="discount_type"
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
                            value={formData.discount_type}
                            onChange={handleChange}
                        >
                            <option value="fixed">Fixed Amount (₹)</option>
                            <option value="percentage">Percentage (%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Value</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                {formData.discount_type === 'fixed' ? '₹' : '%'}
                            </span>
                            <input 
                                name="coupon_min_value"
                                type="number" 
                                required
                                min="0"
                                max={formData.discount_type === 'percentage' ? "100" : undefined}
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                {formData.discount_type === 'fixed' ? '₹' : '%'}
                            </span>
                            <input 
                                name="coupon_max_value"
                                type="number" 
                                required
                                min="0"
                                max={formData.discount_type === 'percentage' ? "100" : undefined}
                                className="w-full h-11 pl-8 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="100"
                                value={formData.coupon_max_value}
                                onChange={handleChange}
                            />
                        </div>
                        {formData.discount_type === 'percentage' && (
                             <p className="text-[10px] text-gray-400 mt-1 text-right">Max 100%</p>
                        )}
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
