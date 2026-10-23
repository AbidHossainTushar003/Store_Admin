import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { AdminHomePage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function AdminOverviewPage() {
  return (
    <AdminShell>
      <AdminHomePage />
    </AdminShell>
  );
}
