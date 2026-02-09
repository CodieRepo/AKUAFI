import { MoreHorizontal, ExternalLink, QrCode, Eye, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';


export interface Campaign {
  id: string; // Supabase IDs are usually UUIDs, but keeping it string is safe
  name: string;
  status: string;
  scans: number | null;
  redeemed: number | null;
  created_at: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
  loading?: boolean;
}


export default function CampaignTable({ campaigns, loading }: CampaignTableProps) {
  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return <div className="p-8 text-center text-text-muted">No campaigns found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-text-muted">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign Name</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Scans</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Redeemed</th>

              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="group hover:bg-surface/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-xs text-text-muted">ID: {campaign.id.slice(0, 8)}</p>

                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      campaign.status === 'Active'
                        ? 'bg-success/10 text-success'
                        : campaign.status === 'Completed'
                        ? 'bg-gray-100 text-gray-800'
                        : campaign.status === 'Paused'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-foreground">{(campaign.scans ?? 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-text-muted">{(campaign.redeemed ?? 0).toLocaleString()}</td>

                <td className="px-6 py-4 text-center">
                   <div className="flex items-center justify-center gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-primary hover:bg-primary/5" title="View Details">
                           <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-yellow-600 hover:bg-yellow-50" title="Pause Campaign">
                           <Pause className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-accent-cyan hover:bg-accent-cyan/10" title="Export Data">
                           <Download className="h-4 w-4" />
                       </Button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
