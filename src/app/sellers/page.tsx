import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { LocalAdminDataPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Sellers' };

export default function SellersPage() {
  return <AdminShell><LocalAdminDataPage
    title="Sellers"
    description="Seller identities inferred from local listings."
    path="admin/sellers"
    collection="sellers"
    columns={[{ key: 'displayName', label: 'Local identity' }, { key: 'id', label: 'Seller ID' }, { key: 'productCount', label: 'Listings' }, { key: 'activeListings', label: 'Active' }, { key: 'orderCount', label: 'Orders' }]}
    notice="These are local seller IDs, not verified business accounts. Seller identity approval, suspension, and payment onboarding are not connected."
  /></AdminShell>;
}
