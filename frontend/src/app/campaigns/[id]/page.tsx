// This file has been deprecated.
// Campaign functionality has been split into:
// - /vote/page.tsx for voting
// - /results/page.tsx for results
// Please use those pages instead.

import { redirect } from 'next/navigation';

export default function CampaignDetailsPage() {
  redirect('/dashboard');
}