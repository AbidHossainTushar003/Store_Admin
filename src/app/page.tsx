import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { DashboardPage } from '@/features/dashboard/dashboard-page';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function AdminOverviewPage() {
  return (
    <AdminShell>
      <DashboardPage />
    </AdminShell>
  );
}
