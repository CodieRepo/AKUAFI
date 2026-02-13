import { redirect } from 'next/navigation';

export default function CampaignRedirect() {
  redirect('/admin/campaigns');
}
