'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Pause, Play, CheckCircle, AlertTriangle, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  total_scans: number; // New Counter
  redeemed_count: number; // New Counter
  created_at: string;
  start_date: string;
  end_date: string;
  location: string | null;
  campaign_date: string | null;
  client_id?: string;
}

// FORMATTER: UTC -> IST Display Only
function formatIST(dateString: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
    //   timeStyle: "short" // Keeping it minimal as per "Clean SaaS"
    });
}

function formatDateTag(dateString: string | null) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString("en-IN", { month: 'short', year: 'numeric' });
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
    return (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600 dark:text-blue-400" />
            <p>Loading campaigns...</p>
        </div>
    );
  }

  if (campaigns.length === 0) {
    return <div className="p-12 text-center text-gray-500 dark:text-gray-400">No campaigns found.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      
      {/* Simple Confirmation Modal Overlay */}
      <AnimatePresence>
      {confirmData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                  <div className="mb-4">
                      <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-2">
                          <AlertTriangle className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Action</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Are you sure you want to change <strong>{confirmData.name}</strong> to <span className="uppercase font-semibold">{confirmData.status}</span>?
                      </p>
                  </div>
                  <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setConfirmData(null)} disabled={!!updatingId} className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                          Cancel
                      </Button>
                      <Button 
                        onClick={() => handleStatusChange(confirmData.id, confirmData.status)} 
                        disabled={!!updatingId}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                      >
                          {updatingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Confirm
                      </Button>
                  </div>
              </div>
          </motion.div>
      )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign Name</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Location / Tag</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Total Scans</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Redeemed</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Progress</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {campaigns.map((campaign, idx) => {
                const status = campaign.status || 'draft';
                const isUpdating = updatingId === campaign.id;
                
                // Use new counters with fallback
                const scans = campaign.total_scans ?? 0;
                const redeemed = campaign.redeemed_count ?? 0;
                const progress = scans > 0 ? Math.round((redeemed / scans) * 100) : 0;

                // Tag Logic: Location + Date
                const tag = campaign.location || 'Global';
                const dateTag = formatDateTag(campaign.campaign_date);

                return (
                  <motion.tr 
                    key={campaign.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-200">{campaign.name}</p>
                          <p className="text-xs text-gray-400 font-mono hidden group-hover:block transition-all">{campaign.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-200">{tag}</span>
                            {dateTag && <span className="text-xs text-gray-500">{dateTag}</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-200">{scans.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{redeemed.toLocaleString()}</td>
                    
                    {/* Progress Bar */}
                    <td className="px-6 py-4 align-middle">
                        <div className="w-full max-w-[140px]">
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                           
                           <Link href={`/admin/campaign/${campaign.id}`}>
                               <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                    title="View Details"
                               >
                                   <Eye className="h-4 w-4" />
                               </Button>
                           </Link>

                           {/* Action Buttons based on Status */}
                           
                           {status === 'draft' && (
                               <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-8 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
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
                                        className="h-8 w-8 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                        title="Pause Campaign"
                                        onClick={() => setConfirmData({ id: campaign.id, status: 'paused', name: campaign.name })}
                                        disabled={isUpdating}
                                   >
                                       <Pause className="h-4 w-4" />
                                   </Button>
                                   <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
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
                                    className="h-8 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                                    onClick={() => setConfirmData({ id: campaign.id, status: 'active', name: campaign.name })}
                                    disabled={isUpdating}
                               >
                                   Resume
                               </Button>
                           )}

                           {status === 'completed' && (
                               <span className="text-xs text-gray-400 dark:text-gray-600 italic">No actions</span>
                           )}

                       </div>
                    </td>
                  </motion.tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
