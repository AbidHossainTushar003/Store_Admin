import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { AdminApplicationsPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Seller applications' };

export default function ApplicationsPage() {
  return <AdminShell><AdminApplicationsPage /></AdminShell>;
}
