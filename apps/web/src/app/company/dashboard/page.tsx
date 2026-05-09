import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { PageTransition } from '@/components/ui/page-transition';

export default async function CompanyDashboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/login');

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base text-text-primary p-8">
        <h1 className="font-display text-3xl font-bold">Company Dashboard</h1>
        <p className="text-text-secondary mt-2">Manage your hiring pipeline and AI projects.</p>
      </div>
    </PageTransition>
  );
}
