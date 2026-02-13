'use client';

import { useState } from 'react';
import { MoreHorizontal, ExternalLink, QrCode, Eye, Pause, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  scans: number | null;
  redeemed: number | null;
  created_at: string;
  start_date: string;
  end_date: string;
}

// FORMATTER: UTC -> IST Display Only
function formatIST(dateString: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
}


interface CampaignTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function CampaignTable({ campaigns, loading, onRefresh }: CampaignTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{ id: string, status: string, name: string } | null>(null);

  // Status Change Handler
  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
        const res = await fetch('/api/admin/campaigns/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: id, status: newStatus })
        });
        
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to update status');
        } else {
            // Success
            if (onRefresh) onRefresh();
        }
    } catch (error) {
        console.error("Status update failed", error);
        alert("Network error. Please try again.");
    } finally {
        setUpdatingId(null);
        setConfirmData(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return <div className="p-8 text-center text-gray-500">No campaigns found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm relative">
      
      {/* Simple Confirmation Modal Overlay */}
      {confirmData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200">
                  <div className="mb-4">
                      <div className="h-10 w-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                          <AlertTriangle className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
                      <p className="text-sm text-gray-500 mt-1">
                          Are you sure you want to change <strong>{confirmData.name}</strong> to <span className="uppercase font-semibold">{confirmData.status}</span>?
                      </p>
                  </div>
                  <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setConfirmData(null)} disabled={!!updatingId}>
                          Cancel
                      </Button>
                      <Button 
                        onClick={() => handleStatusChange(confirmData.id, confirmData.status)} 
                        disabled={!!updatingId}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                          {updatingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Confirm
                      </Button>
                  </div>
              </div>
          </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign Name</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Start Date (IST)</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">End Date (IST)</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Scans</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Redeemed</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((campaign) => {
                const status = campaign.status || 'draft';
                const isUpdating = updatingId === campaign.id;

                let BadgeColor = 'bg-slate-100 text-slate-500';
                if (status === 'active') BadgeColor = 'bg-green-100 text-green-700 border-green-200';
                if (status === 'paused') BadgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                if (status === 'draft') BadgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                if (status === 'completed') BadgeColor = 'bg-gray-100 text-gray-800 border-gray-200';

                return (
                  <tr key={campaign.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {campaign.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatIST(campaign.start_date)}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatIST(campaign.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border capitalize ${BadgeColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{(campaign.scans ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-text-muted">{(campaign.redeemed ?? 0).toLocaleString()}</td>

                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                           
                           {/* Action Buttons based on Status */}
                           
                           {status === 'draft' && (
                               <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-8 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    onClick={() => setConfirmData({ id: campaign.id, status: 'active', name: campaign.name })}
                                    disabled={isUpdating}
                               >
                                   Activate
                               </Button>
                           )}

                           {status === 'active' && (
                               <>
                                   <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                                        title="Pause Campaign"
                                        onClick={() => setConfirmData({ id: campaign.id, status: 'paused', name: campaign.name })}
                                        disabled={isUpdating}
                                   >
                                       <Pause className="h-4 w-4" />
                                   </Button>
                                   <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                        title="Mark Completed"
                                        onClick={() => setConfirmData({ id: campaign.id, status: 'completed', name: campaign.name })}
                                        disabled={isUpdating}
                                   >
                                       <CheckCircle className="h-4 w-4" />
                                   </Button>
                               </>
                           )}

                           {status === 'paused' && (
                               <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-8 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    onClick={() => setConfirmData({ id: campaign.id, status: 'active', name: campaign.name })}
                                    disabled={isUpdating}
                               >
                                   Resume
                               </Button>
                           )}

                           {status === 'completed' && (
                               <span className="text-xs text-gray-400 italic">No actions</span>
                           )}

                       </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
