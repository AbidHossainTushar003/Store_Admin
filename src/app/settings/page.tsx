import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { AdminSettingsPage } from '@/features/operations/local-admin-pages';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <AdminShell><AdminSettingsPage /></AdminShell>;
}
