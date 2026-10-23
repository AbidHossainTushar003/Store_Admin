import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/admin-shell';
import { BootstrapSuperAdminForm } from './bootstrap-super-admin-form';

export const metadata: Metadata = {
  title: 'First Super Admin setup',
  description: 'One-time setup for the initial Shopademia Super Admin identity.',
};

export default function BootstrapPage() {
  const auth0Enabled = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE === 'auth0';

  return (
    <AdminShell>
      <div className="dashboard-page">
        <div className="page-heading">
          <div>
            <p>One-time security setup</p>
            <h1>Register the first Super Admin</h1>
            <p>This setup can be consumed only once, by an authenticated identity that has passed the configured MFA policy.</p>
          </div>
        </div>
        {auth0Enabled ? (
          <BootstrapSuperAdminForm />
        ) : (
          <section className="panel">
            <h2>Secure Admin sign-in is not configured</h2>
            <p>Configure the Admin Auth0 application, MFA claim, API, and Redis session store before bootstrapping a production administrator.</p>
            <Link className="admin-action" href="/login">Return to sign-in</Link>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
