'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

interface DeleteCampaignButtonProps {
  campaignId: string;
  campaignName: string;
}

export default function DeleteCampaignButton({ campaignId, campaignName }: DeleteCampaignButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/campaign/${campaignId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete campaign');
      }

      router.push('/admin/campaigns');
      router.refresh(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete campaign. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Campaign
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Campaign?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Are you sure you want to delete <strong>{campaignName}</strong>? This action cannot be undone and will remove all associated data (QRs, coupons, redemptions).
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
