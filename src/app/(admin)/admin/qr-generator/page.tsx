'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, QrCode } from 'lucide-react';

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
        alert("Generation Complete! Please check your downloads folder.");

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
          <h1 className="text-3xl font-bold text-gray-900">Generate QR Codes</h1>
          <p className="text-gray-500 mt-2">Create bulk QR codes for your campaign securely.</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <form onSubmit={handleGenerate} className="space-y-8">
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">1. Select Campaign <span className="text-red-500">*</span></label>
                <select 
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-base"
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                    disabled={fetching || loading}
                    required
                >
                    <option value="">-- Choose Campaign --</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">2. Quantity</label>
                <input 
                    type="range" min="1" max="10000" step="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    disabled={loading}
                />
                <div className="mt-4">
                    <input 
                        type="number" className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        min="1" max="10000" required disabled={loading}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">Max 10,000. Large requests split into 2,000-unit downloads.</p>
                </div>
            </div>
            {progress && (
                <div className={`p-4 rounded-lg text-center ${progress.status.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    <div className="font-bold text-lg mb-1">Batch {progress.current} / {progress.total}</div>
                    <p className="text-sm">{progress.status}</p>
                </div>
            )}
            <Button type="submit" disabled={loading || fetching} className="w-full h-12 text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <QrCode className="h-5 w-5 mr-2" />}
                {loading ? 'Generating...' : 'Generate QR Codes'}
            </Button>
        </form>
      </div>
    </div>
  );
}
