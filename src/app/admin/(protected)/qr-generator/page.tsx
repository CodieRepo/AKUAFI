'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, QrCode, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QRGeneratorPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);

  const [formData, setFormData] = useState({
    campaign_id: '',
    quantity: '1000'
  });

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/admin/campaigns');
        
        if (!res.ok) throw new Error('Failed to load campaigns');

        const data = await res.json();
        setCampaigns(data || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      } finally {
        setFetching(false);
      }
    }
    fetchCampaigns();
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campaign_id) {
        alert("Please select a campaign");
        return;
    }
    setLoading(true);
    setProgress(null);

    const totalQuantity = Number(formData.quantity);
    const BATCH_SIZE = 2000;
    const batches = Math.ceil(totalQuantity / BATCH_SIZE);

    try {
        for (let i = 0; i < batches; i++) {
            const currentBatchNum = i + 1;
            const remaining = totalQuantity - (i * BATCH_SIZE);
            const batchQty = remaining > BATCH_SIZE ? BATCH_SIZE : remaining;

            setProgress({
                current: currentBatchNum,
                total: batches,
                status: `Generating batch ${currentBatchNum} of ${batches} (${batchQty} QRs)...`
            });
            
            const response = await fetch('/api/admin/qr/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaign_id: formData.campaign_id,
                    quantity: batchQty
                }),
                credentials: 'include' // CRITICAL for cookies
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errData.error || `Failed batch ${currentBatchNum}`);
            }

            const blob = await response.blob();
            const filename = `campaign_${formData.campaign_id}_batch_${currentBatchNum}.zip`;
            downloadBlob(blob, filename);
            await new Promise(r => setTimeout(r, 1000));
        }

        setProgress({
            current: batches,
            total: batches,
            status: "All batches completed successfully!"
        });
        // alert("Generation Complete! Please check your downloads folder."); // Using UI feedback instead

    } catch (error: any) {
        alert(`Error: ${error.message}`);
        setProgress(prev => prev ? { ...prev, status: `Failed: ${error.message}` } : null);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate QR Codes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Create bulk QR codes for your campaign securely.</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
            <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">1. Select Campaign <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select 
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white appearance-none"
                        value={formData.campaign_id}
                        onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                        disabled={fetching || loading}
                        required
                    >
                        <option value="">-- Choose Campaign --</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200">2. Quantity</label>
                    <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                        {Number(formData.quantity).toLocaleString()} units
                    </span>
                </div>
                
                <div className="px-1 py-4">
                    <input 
                        type="range" min="100" max="10000" step="100"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                        disabled={loading}
                    />
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-4">
                     <div className="relative">
                        <input 
                            type="number" 
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm dark:text-white"
                            value={formData.quantity}
                            onChange={(e) => {
                                // Enforce max 10000
                                let val = parseInt(e.target.value);
                                if (val > 10000) val = 10000;
                                setFormData({...formData, quantity: val.toString()})
                            }}
                            min="1" max="10000" required disabled={loading}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">manual</span>
                     </div>
                     <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <AlertCircle className="h-3 w-3 mr-1" /> Max 10,000 per run.
                     </div>
                </div>
            </div>

            <AnimatePresence>
                {progress && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-lg text-center overflow-hidden ${progress.status.includes('Failed') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'}`}
                    >
                        <div className="flex flex-col items-center justify-center">
                            {progress.status.includes('completed') ? (
                                <CheckCircle className="h-6 w-6 mb-2 text-green-500" />
                            ) : (
                                <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                            )}
                            <div className="font-bold text-lg mb-1">Batch {progress.current} / {progress.total}</div>
                            <p className="text-sm">{progress.status}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button 
                type="submit" 
                disabled={loading || fetching} 
                className="w-full h-12 text-base font-semibold shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 dark:text-white transition-all transform hover:scale-[1.01]"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Generating...
                    </> 
                ) : (
                    <>
                        <QrCode className="h-5 w-5 mr-2" />
                        Generate & Download
                    </>
                )}
            </Button>
        </form>
      </div>
    </div>
  );
}
