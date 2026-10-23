import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { AdminProductsPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return <AdminShell><AdminProductsPage /></AdminShell>;
}
