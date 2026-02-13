import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface CampaignPageProps {
  params: {
    id: string;
  };
}

export default async function CampaignDetailsPage({ params }: CampaignPageProps) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
     console.error("Campaign Fetch Error:", error);
     // Fallback to error boundary or 404
  }

  if (!campaign) {
    notFound();
  }

  // Format Dates
  const formatDate = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
        <p className="text-gray-500 mt-2">Campaign ID: <span className="font-mono text-xs">{campaign.id}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Status</h3>
              <p className="text-2xl font-bold mt-2 capitalize">{campaign.status}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Start Date</h3>
              <p className="text-lg font-semibold mt-2">{formatDate(campaign.start_date)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase">End Date</h3>
              <p className="text-lg font-semibold mt-2">{formatDate(campaign.end_date)}</p>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold mb-4">Campaign Details</h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{campaign.description || 'No description provided.'}</p>
              </div>
              <div>
                   <label className="block text-sm font-medium text-gray-500">Coupon Prefix</label>
                   <p className="mt-1 font-mono bg-gray-50 inline-block px-2 py-1 rounded text-gray-800">
                       {campaign.coupon_prefix || 'N/A'}
                   </p>
              </div>
          </div>
      </div>
    </div>
  );
}
