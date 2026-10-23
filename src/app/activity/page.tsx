import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { LocalAdminDataPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Recent activity' };

export default function ActivityPage() {
  return <AdminShell><LocalAdminDataPage
    title="Recent activity"
    description="Recent listing creation and order placement events."
    path="admin/activity"
    collection="activity"
    columns={[{ key: 'occurredAt', label: 'Time' }, { key: 'kind', label: 'Type' }, { key: 'label', label: 'Record' }]}
    notice="This is a derived activity feed, not an audit log. It does not capture sign-ins, edits, decisions, or immutable actor attribution."
  /></AdminShell>;
}
