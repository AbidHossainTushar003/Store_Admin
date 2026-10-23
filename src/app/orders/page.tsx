import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { DashboardPage } from '@/features/dashboard/dashboard-page';

export const metadata: Metadata = {
  title: 'COD orders',
};

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <DashboardPage />
    </AdminShell>
  );
}
