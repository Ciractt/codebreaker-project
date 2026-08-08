import ScanForm from './scan-form';
import CampaignNotice from '@/app/components/campaign-notice';

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md">
      <CampaignNotice />
      <ScanForm slug={slug} />
    </main>
  );
}
