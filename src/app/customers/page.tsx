import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { LocalAdminDataPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return <AdminShell><LocalAdminDataPage
    title="Guest customers"
    description="Customer details are derived from local cash-on-delivery orders."
    path="admin/customers"
    collection="customers"
    columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'orderCount', label: 'Orders' }, { key: 'localOrderValueBdt', label: 'COD order value (BDT)' }, { key: 'lastOrderAt', label: 'Last order' }]}
    notice="This table contains fictional local test data only. It is not a customer account directory; totals are order value, not paid revenue."
  /></AdminShell>;
}
