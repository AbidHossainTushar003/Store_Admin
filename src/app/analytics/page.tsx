import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { LocalAdminDataPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return <AdminShell><LocalAdminDataPage
    title="Local order analytics"
    description="Daily COD order counts and order values over the previous 30 days."
    path="admin/analytics"
    collection="days"
    columns={[{ key: 'date', label: 'Date' }, { key: 'orders', label: 'Orders' }, { key: 'confirmedOrders', label: 'Confirmed' }, { key: 'localOrderValueBdt', label: 'COD order value (BDT)' }]}
    notice="This is a local COD activity report. It does not represent paid sales, recognized revenue, refunds, fees, or production analytics."
  /></AdminShell>;
}
