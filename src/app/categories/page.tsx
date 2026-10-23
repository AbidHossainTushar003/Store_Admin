import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { LocalAdminDataPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return <AdminShell><LocalAdminDataPage
    title="Categories"
    description="Browse categories derived from persisted seller listings."
    path="admin/categories"
    collection="categories"
    columns={[{ key: 'name', label: 'Category' }, { key: 'productCount', label: 'Listings' }, { key: 'activeListings', label: 'Active' }]}
    notice="Categories are derived from seller listing text. Category creation, renaming, and taxonomy governance are not implemented."
  /></AdminShell>;
}
