'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiBaseUrl, usesAuth0Admin } from '@/lib/api-base';

type Row = Record<string, unknown>;
type Column = { key: string; label: string };

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRows(value: unknown, collection: string): Row[] | undefined {
  if (!isRecord(value) || !(collection in value) || !Array.isArray(value[collection])) return undefined;
  const rows = value[collection];
  return rows.every(isRecord) ? rows : undefined;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }
  if (typeof value === 'string') return value.replaceAll('_', ' ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return '—';
}

export function LocalAdminDataPage({
  title,
  description,
  path,
  collection,
  columns,
  notice,
}: {
  title: string;
  description: string;
  path: string;
  collection: string;
  columns: Column[];
  notice: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const loadRows = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/${path}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const parsed = parseRows(await response.json(), collection);
      if (!parsed) throw new Error(`Shopademia API returned an invalid ${collection} response.`);
      setRows(parsed);
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
    }
  }, [collection, path]);

  useEffect(() => {
    let active = true;
    setError('');
    void loadRows().catch((cause: unknown) => {
      console.error(`Unable to load admin ${collection}.`, cause);
      if (active) setError(usesAuth0Admin
        ? 'Could not load this data. Check Super Admin access, API availability, and database schema, then try again.'
        : 'Could not load this data. Check the local admin session, API availability, and database schema, then try again.');
    });
    return () => { active = false; };
  }, [collection, loadRows]);

  async function refreshRows() {
    setError('');
    try {
      await loadRows();
    } catch (cause: unknown) {
      console.error(`Unable to refresh admin ${collection}.`, cause);
      setError(usesAuth0Admin
        ? 'Refresh failed. Check Super Admin access, API availability, and database schema.'
        : 'Refresh failed. Check the local admin session, API availability, and database schema.');
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p>{usesAuth0Admin ? 'Super Admin operations' : 'Local test operations'}</p><h1>{title}</h1><p>{description}</p></div><span className="demo-tag">{usesAuth0Admin ? 'API DATA' : 'LOCAL DATA'}</span></div>
      <aside className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><div><strong>{usesAuth0Admin ? 'CONNECTED API DATA' : 'LOCAL DEVELOPMENT DATA'}</strong><p>{notice}</p></div></aside>
      <section className="panel">
        <div className="panel-header"><div><h2 className="panel-title">{title}</h2><p className="panel-subtitle">        {rows ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : 'Loading records'}</p></div><button aria-busy={refreshing} className="admin-action" disabled={refreshing} onClick={() => void refreshRows()} type="button">{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
        {error ? <p className="admin-feedback" role="alert">{error}</p> : null}
        {rows === null && !error ? <p className="admin-feedback" role="status">Loading {title.toLowerCase()}…</p> : null}
        {rows?.length === 0 ? <p className="admin-feedback">No records are available.</p> : null}
        {rows && rows.length > 0 ? (
          <div aria-label={`${title} table. Scroll horizontally to view all columns.`} className="admin-table-wrap" role="region"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
            {rows.map((row, index) => <tr key={typeof row.id === 'string' ? row.id : `${collection}-${index}`}>
              {columns.map((column) => <td key={column.key}>{formatValue(row[column.key])}</td>)}
            </tr>)}
          </tbody></table></div>
        ) : null}
      </section>
    </div>
  );
}

type Product = {
  id: string;
  title: string;
  category: string;
  sellerId: string | null;
  priceBdt: number | null;
  stockQuantity: number;
  status: string;
  isPublicApproved: boolean;
  sellerEligible: boolean;
  createdAt: string;
};

function parseProducts(value: unknown): Product[] | undefined {
  const rows = parseRows(value, 'products');
  if (!rows) return undefined;
  const products: Product[] = [];
  for (const row of rows) {
    if (
      typeof row.id !== 'string' || typeof row.title !== 'string' ||
      typeof row.category !== 'string' ||
      (row.sellerId !== null && typeof row.sellerId !== 'string') ||
      (row.priceBdt !== null && typeof row.priceBdt !== 'number') ||
      typeof row.stockQuantity !== 'number' || typeof row.status !== 'string' ||
      typeof row.isPublicApproved !== 'boolean' ||
      typeof row.sellerEligible !== 'boolean' ||
      typeof row.createdAt !== 'string'
    ) return undefined;
    products.push({
      id: row.id,
      title: row.title,
      category: row.category,
      sellerId: row.sellerId,
      priceBdt: row.priceBdt,
      stockQuantity: row.stockQuantity,
      status: row.status,
      isPublicApproved: row.isPublicApproved,
      sellerEligible: row.sellerEligible,
      createdAt: row.createdAt,
    });
  }
  return products;
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [publicationReasons, setPublicationReasons] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const loadProducts = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/admin/products`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const parsed = parseProducts(await response.json());
      if (!parsed) throw new Error('Shopademia API returned invalid products.');
      setProducts(parsed);
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadProducts().catch((cause: unknown) => {
      console.error('Unable to load admin products.', cause);
      if (active) setError(usesAuth0Admin
        ? 'Could not load products. Check Super Admin access, API availability, and database schema, then try again.'
        : 'Could not load products. Check the local admin session, API availability, and database schema, then try again.');
    });
    return () => { active = false; };
  }, [loadProducts]);

  async function retryProducts() {
    setError('');
    try {
      await loadProducts();
    } catch (cause: unknown) {
      console.error('Unable to retry admin products.', cause);
      setError(usesAuth0Admin
        ? 'Could not load products. Check Super Admin access, API availability, and database schema.'
        : 'Could not load products. Check the local admin session, API availability, and database schema.');
    }
  }

  async function setStatus(product: Product) {
    const status = product.status === 'active' ? 'inactive' : 'active';
    setPendingId(product.id);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/products/${encodeURIComponent(product.id)}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      await loadProducts();
    } catch (cause) {
      console.error('Unable to moderate local product.', cause);
      setError('Listing status could not be changed. Reactivate only a listing with a valid price and stock.');
    } finally {
      setPendingId(null);
    }
  }

  async function setPublication(product: Product) {
    const approved = !product.isPublicApproved;
    const reason = publicationReasons[product.id]?.trim() ?? '';
    if (reason.length < 3) return;
    setPendingId(product.id);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/products/${encodeURIComponent(product.id)}/publication`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      setPublicationReasons((current) => ({ ...current, [product.id]: '' }));
      await loadProducts();
    } catch (cause) {
      console.error('Unable to update product publication approval.', cause);
      setError('Publication approval could not be changed. Check listing eligibility and the Admin API, then retry.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p>{usesAuth0Admin ? 'Super Admin operations' : 'Local test operations'}</p><h1>Products</h1><p>Review and activate or pause seller listings.</p></div><span className="demo-tag">{usesAuth0Admin ? 'API DATA' : 'LOCAL DATA'}</span></div>
      <aside className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><div><strong>CATALOGUE MODERATION</strong><p>Only active, in-stock listings approved for publication from approved sellers appear in the public catalogue. Listing status alone does not publish a product. Approval and revocation require a reason and are audited.</p></div></aside>
      {error ? <p className="admin-feedback" role="alert">{error}</p> : null}
      {error ? <button aria-busy={refreshing} className="admin-action" disabled={refreshing || pendingId !== null} onClick={() => void retryProducts()} type="button">{refreshing ? 'Retrying…' : 'Retry loading products'}</button> : null}
      {products === null && !error ? <p className="admin-feedback" role="status">Loading listings…</p> : null}
      {products?.length === 0 ? <section className="panel"><p className="admin-feedback">No seller listings are available.</p></section> : null}
      {products && products.length > 0 ? (
        <section className="panel">
          <div aria-label="Admin product moderation table. Scroll horizontally to view all columns." className="admin-table-wrap" role="region"><table className="admin-table"><thead><tr><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Public approval</th><th>Actions</th></tr></thead><tbody>
            {products.map((product) => <tr key={product.id}>
              <td>{product.title}</td><td>{product.sellerId ?? '—'}</td><td>{product.category}</td>
              <td>{product.priceBdt === null ? '—' : `৳${product.priceBdt.toLocaleString()}`}</td><td>{product.stockQuantity}</td><td>{product.status}</td>
              <td>{product.isPublicApproved ? 'Approved' : 'Not approved'}</td>
              <td>
                <div className="admin-actions">
                  <button className="admin-action" disabled={pendingId !== null || (product.status !== 'active' && product.stockQuantity < 1)} onClick={() => void setStatus(product)} type="button">{pendingId === product.id ? 'Saving…' : product.status === 'active' ? 'Pause listing' : 'Activate listing'}</button>
                  <input
                    aria-label={`Reason for ${product.isPublicApproved ? 'revoking' : 'approving'} publication of ${product.title}`}
                    maxLength={1000}
                    minLength={3}
                    onChange={(event) => setPublicationReasons((current) => ({ ...current, [product.id]: event.target.value }))}
                    placeholder="Publication decision reason"
                    value={publicationReasons[product.id] ?? ''}
                  />
                  <button className="admin-action" disabled={pendingId !== null || (publicationReasons[product.id]?.trim().length ?? 0) < 3 || (!product.isPublicApproved && (product.status !== 'active' || product.stockQuantity < 1 || !product.sellerId || product.priceBdt === null || !product.sellerEligible))} onClick={() => void setPublication(product)} type="button">{pendingId === product.id ? 'Saving…' : product.isPublicApproved ? 'Revoke publication' : 'Approve publication'}</button>
                </div>
              </td>
            </tr>)}
          </tbody></table></div>
        </section>
      ) : null}
    </div>
  );
}

type Application = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  shopName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  submittedAt: string;
};

function parseApplications(value: unknown): Application[] | undefined {
  const rows = parseRows(value, 'applications');
  if (!rows) return undefined;
  const applications: Application[] = [];
  for (const row of rows) {
    if (
      typeof row.id !== 'string' || typeof row.applicantName !== 'string' ||
      typeof row.applicantEmail !== 'string' || typeof row.shopName !== 'string' ||
      typeof row.description !== 'string' ||
      (row.status !== 'pending' && row.status !== 'approved' &&
        row.status !== 'rejected' && row.status !== 'suspended') ||
      typeof row.submittedAt !== 'string'
    ) return undefined;
    applications.push({
      id: row.id,
      applicantName: row.applicantName,
      applicantEmail: row.applicantEmail,
      shopName: row.shopName,
      description: row.description,
      status: row.status,
      submittedAt: row.submittedAt,
    });
  }
  return applications;
}

export function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const loadApplications = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/admin/seller-applications`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const parsed = parseApplications(await response.json());
      if (!parsed) throw new Error('Shopademia API returned invalid seller applications.');
      setApplications(parsed);
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadApplications().catch((cause: unknown) => {
      console.error('Unable to load seller applications.', cause);
      if (active) setError(usesAuth0Admin
        ? 'Could not load applications. Check Super Admin access, API availability, and database schema, then try again.'
        : 'Could not load applications. Check the local admin session, API availability, and database schema, then try again.');
    });
    return () => { active = false; };
  }, [loadApplications]);

  async function retryApplications() {
    setError('');
    try {
      await loadApplications();
    } catch (cause: unknown) {
      console.error('Unable to retry seller applications.', cause);
      setError(usesAuth0Admin
        ? 'Could not load applications. Check Super Admin access, API availability, and database schema.'
        : 'Could not load applications. Check the local admin session, API availability, and database schema.');
    }
  }

  async function review(
    application: Application,
    status: 'approved' | 'rejected' | 'suspended',
  ) {
    const reason = window.prompt('Enter the reason for this seller application decision.')?.trim();
    if (reason === undefined) return;
    if (reason.length < 3 || reason.length > 1000) {
      setError('Enter a decision reason between 3 and 1000 characters.');
      return;
    }
    setPendingId(application.id);
    setError('');
    setFeedback('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/seller-applications/${encodeURIComponent(application.id)}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      await loadApplications();
      setFeedback(status === 'approved' && application.status === 'suspended'
        ? 'Seller eligibility restored. Product publication approvals remain suspended until separately reviewed.'
        : status === 'suspended'
          ? 'Seller suspended and existing product publication approvals revoked.'
          : `Application ${status}.`);
    } catch (cause) {
      console.error('Unable to review seller application.', cause);
      setError('The application decision could not be saved. It may already have been reviewed.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p>{usesAuth0Admin ? 'Super Admin operations' : 'Local test operations'}</p><h1>Seller applications</h1><p>Review Auth0-verified applications stored by the API.</p></div><span className="demo-tag">{usesAuth0Admin ? 'API DATA' : 'LOCAL DATA'}</span></div>
      <aside className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><div><strong>APPLICATION ACCESS DECISION</strong><p>{usesAuth0Admin ? 'Approval enables the Auth0 subject to use seller-owned API routes; it does not create a separate shop entity. Suspending a seller revokes its product publication approvals; restoring seller eligibility does not republish products.' : 'In local demo mode, approval records a decision but does not change the fixed local seller identity.'}</p></div></aside>
      {error ? <p className="admin-feedback" role="alert">{error}</p> : null}
      {error ? <button aria-busy={refreshing} className="admin-action" disabled={refreshing || pendingId !== null} onClick={() => void retryApplications()} type="button">{refreshing ? 'Retrying…' : 'Retry loading applications'}</button> : null}
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      {applications === null && !error ? <p className="admin-feedback" role="status">Loading applications…</p> : null}
      {applications?.length === 0 ? <section className="panel"><p className="admin-feedback">No persisted applications are available.</p></section> : null}
      {applications?.map((application) => (
        <article className="panel admin-application" key={application.id}>
          <div className="panel-header"><div><h2 className="panel-title">{application.shopName}</h2><p className="panel-subtitle">{application.applicantName} · {application.applicantEmail}</p></div><span className="demo-tag">{application.status}</span></div>
          <p>{application.description}</p><p className="panel-subtitle">Submitted {new Date(application.submittedAt).toLocaleString()}</p>
          {application.status === 'pending' ? <div className="admin-actions">
            <button className="admin-action" disabled={pendingId !== null} onClick={() => void review(application, 'approved')} type="button">{pendingId === application.id ? 'Saving…' : 'Approve application'}</button>
            <button className="admin-action admin-action-danger" disabled={pendingId !== null} onClick={() => void review(application, 'rejected')} type="button">Reject application</button>
          </div> : null}
          {application.status === 'approved' ? <div className="admin-actions">
            <button className="admin-action admin-action-danger" disabled={pendingId !== null} onClick={() => void review(application, 'suspended')} type="button">{pendingId === application.id ? 'Saving…' : 'Suspend seller'}</button>
          </div> : null}
          {application.status === 'suspended' ? <div className="admin-actions">
            <button className="admin-action" disabled={pendingId !== null} onClick={() => void review(application, 'approved')} type="button">{pendingId === application.id ? 'Saving…' : 'Restore seller eligibility'}</button>
          </div> : null}
        </article>
      ))}
    </div>
  );
}

export function AdminHomePage() {
  const [summary, setSummary] = useState<Row | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);
  const requestInFlight = useRef(false);

  const loadSummary = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (mounted.current) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await fetch(`${apiBaseUrl}/admin/summary`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const value: unknown = await response.json();
      if (!isRecord(value) || !['orders', 'awaitingSeller', 'awaitingAdmin', 'localOrderValueBdt', 'sellerListings', 'activeListings', 'localSellerIdentities', 'guestCustomers'].every((key) => typeof value[key] === 'number')) {
        throw new Error('Shopademia API returned invalid dashboard metrics.');
      }
      if (mounted.current) setSummary(value);
    } finally {
      requestInFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadSummary().catch((cause: unknown) => {
      console.error('Unable to load admin summary.', cause);
      if (mounted.current) {
        setSummary(null);
        setError(usesAuth0Admin
          ? 'Could not load marketplace metrics. Check Super Admin access, API availability, and database schema.'
          : 'Could not load marketplace metrics. Check the local admin session, API availability, and database schema.');
      }
    });
    return () => { mounted.current = false; };
  }, [loadSummary]);

  async function retrySummary() {
    try {
      await loadSummary();
    } catch (cause: unknown) {
      console.error('Unable to retry admin summary.', cause);
      setSummary(null);
      setError(usesAuth0Admin
        ? 'Could not load marketplace metrics. Check Super Admin access, API availability, and database schema.'
        : 'Could not load marketplace metrics. Check the local admin session, API availability, and database schema.');
    }
  }

  const metrics = [
    ['COD orders', 'orders', 'Operational cash-on-delivery orders'],
    ['Awaiting seller', 'awaitingSeller', 'Orders not yet confirmed by the seller'],
    ['Awaiting admin', 'awaitingAdmin', 'Orders ready for admin confirmation'],
    ['Guest customers', 'guestCustomers', 'Distinct customer emails in local orders'],
    ['Seller listings', 'sellerListings', 'Non-demo products'],
    ['Active listings', 'activeListings', 'Active non-demo listings'],
    ['Seller identities', 'localSellerIdentities', 'Identities represented by listings'],
    ['COD order value', 'localOrderValueBdt', 'Not revenue; no payment is processed'],
  ] as const;

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p>{usesAuth0Admin ? 'Super Admin operations' : 'Local test operations'}</p><h1>Marketplace overview</h1><p>Live counts from the API and database.</p></div><span className="demo-tag">{usesAuth0Admin ? 'API DATA' : 'LOCAL COD'}</span></div>
      <aside className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><div><strong>{usesAuth0Admin ? 'PAYMENT AND FULFILMENT NOT CONFIGURED' : 'LOCAL DEVELOPMENT DATABASE'}</strong><p>{usesAuth0Admin ? 'These metrics are operational only. No payment, courier service, or real financial reporting is connected.' : 'Fictional test data only. No payment, shipping, production identity, or real financial reporting is connected.'}</p></div></aside>
      {error ? <p className="admin-feedback" role="alert">{error}</p> : null}
      {error ? <button aria-busy={loading} className="admin-action" disabled={loading} onClick={() => void retrySummary()} type="button">{loading ? 'Retrying…' : 'Retry loading summary'}</button> : null}
      <section className="kpi-grid" aria-label="Marketplace metrics">
        {metrics.map(([label, key, note]) => <article className="kpi-card" key={key}><span className="kpi-label">{label}</span><p className="kpi-value">{summary ? (key === 'localOrderValueBdt' ? `৳${Number(summary[key]).toLocaleString()}` : Number(summary[key]).toLocaleString()) : '—'}</p><p className="kpi-note">{note}</p></article>)}
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2 className="panel-title">Quick actions</h2><p className="panel-subtitle">Operational workflows</p></div></div>
        <div className="admin-quick-actions"><Link className="admin-action" href="/orders">Review COD orders</Link><Link className="admin-action" href="/products">Moderate listings</Link><Link className="admin-action" href="/applications">Review seller applications</Link><Link className="admin-action" href="/analytics">View COD analytics</Link></div>
      </section>
    </div>
  );
}

export function AdminSettingsPage() {
  const [showNotices, setShowNotices] = useState(true);
  const [compactTables, setCompactTables] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('shopademia:admin-display-preferences');
      if (!saved) return;
      const value: unknown = JSON.parse(saved);
      if (
        isRecord(value) &&
        typeof value.showNotices === 'boolean' &&
        typeof value.compactTables === 'boolean'
      ) {
        setShowNotices(value.showNotices);
        setCompactTables(value.compactTables);
      }
    } catch (cause) {
      console.error('Unable to read local admin settings.', cause);
      setMessage('Saved browser settings could not be loaded.');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.adminCompactTables = String(compactTables);
    document.documentElement.dataset.adminShowNotices = String(showNotices);
  }, [compactTables, showNotices]);

  function save() {
    try {
      window.localStorage.setItem('shopademia:admin-display-preferences', JSON.stringify({ showNotices, compactTables }));
      setMessage('Display preferences saved in this browser.');
    } catch (cause) {
      console.error('Unable to save local admin settings.', cause);
      setMessage('Display preferences could not be saved in this browser.');
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p>Local test operations</p><h1>Settings</h1><p>Manage browser-local admin display preferences.</p></div></div>
      <aside className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><div><strong>LOCAL BROWSER PREFERENCES</strong><p>These settings are not account, access-control, marketplace-policy, or server configuration.</p></div></aside>
      <section className="panel admin-settings">
        <label><input checked={showNotices} onChange={(event) => setShowNotices(event.target.checked)} type="checkbox" /> Show local-test notices</label>
        <label><input checked={compactTables} onChange={(event) => setCompactTables(event.target.checked)} type="checkbox" /> Use compact tables on this browser</label>
        <button className="admin-action" onClick={save} type="button">Save preferences</button>
        {message ? <p role="status">{message}</p> : null}
      </section>
    </div>
  );
}
