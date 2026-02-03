'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseclient';
import { Button } from '@/components/ui/Button';
import { Download, Loader2, QrCode } from 'lucide-react';

import QRCode from 'qrcode';
import JSZip from 'jszip';

export default function QRGeneratorPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [zipping, setZipping] = useState(false);
  
  const [formData, setFormData] = useState({
    campaign_id: '',
    quantity: '1000'
  });

  const [generated, setGenerated] = useState<{ count: number, tokens: string[] } | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/admin/campaigns', {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCampaigns(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchCampaigns();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campaign_id) {
        alert("Please select a campaign");
        return;
    }
    setLoading(true);
    setGenerated(null);

    // Logging (MANDATORY)
    console.log("SENDING QR GENERATION REQUEST", { campaign_id: formData.campaign_id, quantity: Number(formData.quantity) });

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/qr/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            campaign_id: formData.campaign_id,
            quantity: Number(formData.quantity)
        })
      });

      const data = await res.json();
      console.log("QR GENERATION RESPONSE:", data);

      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setGenerated({ count: data.count, tokens: data.tokens });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!generated || !generated.tokens) return;
    
    // Create CSV content
    // Format: qr_token, url
    const headers = "qr_token,url\n";
    const rows = generated.tokens.map(t => `${t},https://akuafi.com/scan/${t}`).join("\n");
    const csvContent = headers + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `akuafi_qrs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadZip = async () => {
      if (!generated || !generated.tokens) return;
      setZipping(true);

      try {
          const zip = new JSZip();
          const campaignName = campaigns.find(c => c.id === formData.campaign_id)?.name || 'Campaign';
          const sanitizedCampName = campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          // Generate QR images
          const promises = generated.tokens.map(async (token, index) => {
              const url = `https://akuafi.com/scan/${token}`;
              // Generate Data URL (PNG)
              const dataUrl = await QRCode.toDataURL(url, {
                  width: 512,
                  margin: 2,
                  errorCorrectionLevel: 'H'
              });
              
              // Remove "data:image/png;base64," prefix
              const base64Data = dataUrl.split(',')[1];
              
              const filename = `QR_${String(index + 1).padStart(4, '0')}.png`;
              zip.file(filename, base64Data, { base64: true });
          });

          await Promise.all(promises);

          // Generate Zip Blob
          const content = await zip.generateAsync({ type: 'blob' });
          
          // Download
          const url = URL.createObjectURL(content);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${sanitizedCampName}_qr_codes.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

      } catch (err) {
          console.error("Failed to zip QRs", err);
          alert("Failed to generate ZIP file.");
      } finally {
          setZipping(false);
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
            {/* Step 1: Select Campaign */}
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">1. Select Campaign <span className="text-red-500">*</span></label>
                <select 
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-base"
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                    disabled={fetching}
                    required
                >
                    <option value="">-- Choose Campaign --</option>
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">QRs will be linked to this campaign's rules.</p>
            </div>

            {/* Step 2: Quantity */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-900">2. Quantity</label>
                    <span className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{formData.quantity}</span>
                </div>
                
                <input 
                    type="range"
                    min="1"
                    max="5000"
                    step="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                
                <div className="mt-4">
                    <input 
                        type="number" 
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        min="1"
                        max="5000"
                        required
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">Max 5000 per batch.</p>
                </div>
            </div>

            <Button type="submit" disabled={loading || fetching} className="w-full h-12 text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <QrCode className="h-5 w-5 mr-2" />}
                Generate QR Codes
            </Button>
        </form>

        {generated && (
            <div className="mt-8 p-6 bg-green-50 text-green-800 rounded-xl border border-green-200 text-center animate-in fade-in slide-in-from-top-4 shadow-sm">
                <div className="font-bold text-xl mb-2 flex items-center justify-center gap-2">
                    <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center text-green-700">✓</div>
                    Success!
                </div>
                <p className="mb-6 opacity-80">Generated {generated.count} unique QR codes for {campaigns.find(c => c.id === formData.campaign_id)?.name}.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={downloadCSV} variant="outline" className="w-full bg-white hover:bg-green-100 border-2 border-green-200 text-green-700 font-bold h-12">
                        <Download className="h-5 w-5 mr-2" />
                        Download CSV
                    </Button>
                    <Button onClick={downloadZip} disabled={zipping} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-md">
                        {zipping ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
                        {zipping ? 'Zipping...' : 'Download QR ZIP'}
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
