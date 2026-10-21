import Link from 'next/link';
import type { ReactNode } from 'react';

const placeholderSections = [
  'Products',
  'Categories',
  'Sellers',
  'Customers',
  'Orders',
  'Analytics',
  'Audit logs',
  'Settings',
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Shopademia Admin demo overview">
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
  return (
    <nav className="sidebar-nav" aria-label={mobile ? 'Mobile admin navigation' : 'Admin navigation'}>
      <Link className="sidebar-link" href="/" aria-current="page">
        <span className="nav-icon"><DashboardIcon /></span>
        <span>Dashboard</span>
      </Link>
      {placeholderSections.map((section) => (
        <span
          className="sidebar-placeholder"
          aria-disabled="true"
          key={section}
          title={`${section} is not connected in this demo`}
        >
          <span className="nav-icon" aria-hidden="true">·</span>
          <span>{section}</span>
        </span>
      ))}
    </nav>
  );
}

function PlaceholderControls() {
  return (
    <div className="topbar-actions">
      <div className="global-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m15.5 15.5 4.2 4.2" />
        </svg>
        <span>Search is not connected</span>
      </div>
      <button className="header-placeholder" type="button" disabled aria-label="Notifications unavailable in demo">
        <span className="header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9" />
            <path d="M10 21h4" />
          </svg>
        </span>
      </button>
      <button
        className="header-placeholder account-placeholder"
        type="button"
        disabled
        aria-label="Account controls unavailable; authentication is not implemented"
      >
        <span className="header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20c.5-3.5 2.7-5.3 6.5-5.3s6 1.8 6.5 5.3" />
          </svg>
        </span>
        <span className="account-label">Account</span>
      </button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Admin sidebar">
        <Brand />
        <p className="sidebar-caption">Workspace</p>
        <DashboardNavigation />
        <p className="sidebar-footnote">
          <strong>Frontend demo only</strong>
          No live platform access or administrative actions are connected.
        </p>
      </aside>

      <div className="workspace">
        <div className="mobile-brand-row">
          <Brand />
          <span className="demo-tag">DEMO</span>
        </div>
        <details className="mobile-sidebar-nav">
          <summary>Menu · Dashboard</summary>
          <p className="sidebar-caption">Workspace</p>
          <DashboardNavigation mobile />
          <p className="sidebar-footnote">
            <strong>Frontend demo only</strong>
            No live platform access or administrative actions are connected.
          </p>
        </details>
        <header className="topbar">
          <div className="topbar-title">
            <p className="breadcrumb">Workspace / Overview</p>
            <p className="topbar-page-title">Dashboard overview</p>
          </div>
          <PlaceholderControls />
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
