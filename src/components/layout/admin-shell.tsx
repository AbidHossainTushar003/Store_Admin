'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { usesAuth0Admin } from '@/lib/api-base';
import { AdminSessionActions } from './admin-session-actions';

const sections = [
  { label: 'Products', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'Sellers', href: '/sellers' },
  { label: 'Customers', href: '/customers' },
  { label: 'Orders', href: '/orders' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Recent activity', href: '/activity' },
  { label: 'Seller applications', href: '/applications' },
  { label: 'Settings', href: '/settings' },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Shopademia Admin overview">
      <span className="brand-mark" aria-hidden="true">S</span>
      <span>Shopademia</span>
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.2" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="sidebar-nav" aria-label={mobile ? 'Mobile admin navigation' : 'Admin navigation'}>
      <Link className="sidebar-link" href="/" aria-current={pathname === '/' ? 'page' : undefined}>
        <span className="nav-icon"><DashboardIcon /></span>
        <span>Dashboard</span>
      </Link>
      {sections.map((section) => (
        <Link
          aria-current={pathname === section.href ? 'page' : undefined}
          className="sidebar-link"
          href={section.href}
          key={section.href}
        >
          <span className="nav-icon" aria-hidden="true">{section.label.slice(0, 2).toUpperCase()}</span>
          <span>{section.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function WorkspaceControls() {
  return (
    <div className="topbar-actions">
      <Link className="global-search" href="/products">Browse listings</Link>
      <Link className="global-search" href="/activity">Recent activity</Link>
      <Link className="global-search" href="/settings">Preferences</Link>
      <AdminSessionActions />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentSection = sections.find((section) => section.href === pathname);
  const currentPage = currentSection?.label ??
    (pathname === '/login' ? 'Sign in' : pathname === '/bootstrap' ? 'Security setup' : 'Overview');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('shopademia:admin-display-preferences');
      if (!saved) return;
      const value: unknown = JSON.parse(saved);
      if (
        typeof value === 'object' && value !== null &&
        'showNotices' in value && typeof value.showNotices === 'boolean' &&
        'compactTables' in value && typeof value.compactTables === 'boolean'
      ) {
        document.documentElement.dataset.adminCompactTables = String(value.compactTables);
        document.documentElement.dataset.adminShowNotices = String(value.showNotices);
      }
    } catch (cause) {
      console.error('Unable to load local admin display preferences.', cause);
    }
  }, []);

  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Admin sidebar">
        <Brand />
        <p className="sidebar-caption">Workspace</p>
        <DashboardNavigation />
        <p className="sidebar-footnote">
          <strong>{usesAuth0Admin ? 'Super Admin access' : 'Local test only'}</strong>
          {usesAuth0Admin
            ? 'The API verifies the Auth0 identity, MFA claim, and Super Admin role.'
            : 'The order actions use a loopback-only development API.'}
        </p>
      </aside>

      <div className="workspace">
        <div className="mobile-brand-row">
          <Brand />
          <span className="demo-tag">{usesAuth0Admin ? 'ADMIN' : 'DEMO'}</span>
        </div>
        <details className="mobile-sidebar-nav">
          <summary>Menu · {currentPage}</summary>
          <p className="sidebar-caption">Workspace</p>
          <DashboardNavigation mobile />
          <p className="sidebar-footnote">
            <strong>{usesAuth0Admin ? 'Super Admin access' : 'Local test only'}</strong>
            {usesAuth0Admin
              ? 'The API verifies the Auth0 identity, MFA claim, and Super Admin role.'
              : 'The order actions use a loopback-only development API.'}
          </p>
        </details>
        <header className="topbar">
          <div className="topbar-title">
            <p className="breadcrumb">Workspace / {currentPage}</p>
            <p className="topbar-page-title">{currentPage}</p>
          </div>
          <WorkspaceControls />
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
