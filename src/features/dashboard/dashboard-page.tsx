'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiBaseUrl, usesAuth0Admin } from '@/lib/api-base';

type Order = {
  id: string;
  reference: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  totalBdt: number;
  status: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number; lineTotalBdt: number }>;
};

function parseOrders(value: unknown): Order[] | undefined {
  if (typeof value !== 'object' || value === null || !('orders' in value) || !Array.isArray(value.orders)) {
    return undefined;
  }
  const orders: Order[] = [];
  for (const order of value.orders) {
    if (
      typeof order !== 'object' || order === null ||
      !('id' in order) || typeof order.id !== 'string' ||
      !('reference' in order) || typeof order.reference !== 'string' ||
      !('buyerName' in order) || typeof order.buyerName !== 'string' ||
      !('buyerEmail' in order) || typeof order.buyerEmail !== 'string' ||
      !('buyerPhone' in order) || typeof order.buyerPhone !== 'string' ||
      !('deliveryAddress' in order) || typeof order.deliveryAddress !== 'string' ||
      !('totalBdt' in order) || typeof order.totalBdt !== 'number' ||
      !('status' in order) || typeof order.status !== 'string' ||
      !('createdAt' in order) || typeof order.createdAt !== 'string' ||
      !('items' in order) || !Array.isArray(order.items)
    ) {
      return undefined;
    }
    const items: Order['items'] = [];
    for (const item of order.items) {
      if (
        typeof item !== 'object' || item === null ||
        !('title' in item) || typeof item.title !== 'string' ||
        !('quantity' in item) || typeof item.quantity !== 'number' ||
        !('lineTotalBdt' in item) || typeof item.lineTotalBdt !== 'number'
      ) {
        return undefined;
      }
      items.push({
        title: item.title,
        quantity: item.quantity,
        lineTotalBdt: item.lineTotalBdt,
      });
    }
    orders.push({
      id: order.id,
      reference: order.reference,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      deliveryAddress: order.deliveryAddress,
      totalBdt: order.totalBdt,
      status: order.status,
      createdAt: order.createdAt,
      items,
    });
  }
  return orders;
}

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const loadOrders = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const response = await fetch(`${apiBaseUrl}/admin/orders`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }
      const parsed = parseOrders(await response.json());
      if (!parsed) {
        throw new Error('Shopademia API returned an invalid admin order list.');
      }
      setOrders(parsed);
    } finally {
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadOrders().catch((cause: unknown) => {
      console.error('Unable to load admin orders.', cause);
      if (active) {
        setError(usesAuth0Admin
          ? 'Could not load orders. Check Super Admin access, API availability, and database schema, then try again.'
          : 'Could not load orders. Check the local admin session, API availability, and database schema, then try again.');
      }
    });
    return () => {
      active = false;
    };
  }, [loadOrders]);

  async function refreshOrders() {
    if (requestInFlight.current) return;
    setRefreshing(true);
    setError('');
    setFeedback('');
    try {
      await loadOrders();
    } catch (cause) {
      console.error('Unable to refresh admin orders.', cause);
      setError(usesAuth0Admin
        ? 'The order list could not be refreshed. Check your Super Admin session and API.'
        : 'The order list could not be refreshed. Check your admin session and the local API.');
    } finally {
      setRefreshing(false);
    }
  }

  async function confirmOrder(orderId: string) {
    setPendingId(orderId);
    setFeedback('');
    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/orders/${encodeURIComponent(orderId)}/confirm`,
        { method: 'POST', credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }
      await loadOrders();
      setFeedback('Order confirmed by the admin.');
    } catch (cause) {
      console.error('Unable to confirm admin order.', cause);
      setFeedback('The order could not be confirmed. Refresh the order list and try again.');
    } finally {
      setPendingId(null);
    }
  }

  const waitingForSeller = orders?.filter((order) => order.status === 'pending_seller_confirmation').length ?? 0;
  const waitingForAdmin = orders?.filter((order) => order.status === 'pending_admin_confirmation').length ?? 0;

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p>{usesAuth0Admin ? 'Super Admin operations' : 'Local test operations'}</p>
          <h1>Marketplace orders</h1>
        </div>
        <span className="demo-tag">{usesAuth0Admin ? 'COD OPERATIONS' : 'LOCAL COD'}</span>
      </div>

      <aside className="demo-banner" aria-label="Local test data notice">
        <span className="demo-banner-icon" aria-hidden="true">i</span>
        <div>
          <strong>{usesAuth0Admin ? 'PAYMENT AND FULFILMENT NOT CONFIGURED' : 'LOCAL DEVELOPMENT DATABASE'}</strong>
          <p>{usesAuth0Admin
            ? 'These records are operational only. No payment has been taken and no courier dispatch is connected.'
            : 'Only fictional test orders are expected. No payment has been taken and no shipping integration is connected.'}</p>
        </div>
      </aside>

      <section className="kpi-grid" aria-label="Marketplace order counts">
        <article className="kpi-card"><span className="kpi-label">Orders</span><p className="kpi-value">{orders?.length ?? '—'}</p></article>
        <article className="kpi-card"><span className="kpi-label">Awaiting seller</span><p className="kpi-value">{orders === null ? '—' : waitingForSeller}</p></article>
        <article className="kpi-card"><span className="kpi-label">Awaiting admin</span><p className="kpi-value">{orders === null ? '—' : waitingForAdmin}</p></article>
      </section>

      <section className="panel orders-panel" aria-labelledby="orders-heading">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" id="orders-heading">COD orders</h2>
            <p className="panel-subtitle">The seller confirms first; the administrator finalizes the operational record.</p>
          </div>
          <div className="form-actions">
            <button className="admin-action" disabled={refreshing || pendingId !== null} onClick={() => void refreshOrders()} type="button">
              {refreshing ? 'Refreshing…' : 'Refresh orders'}
            </button>
            <Link className="demo-tag" href="/login">Admin access</Link>
          </div>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        {feedback ? <p role="status">{feedback}</p> : null}
        {orders === null && !error ? <p role="status">Loading orders…</p> : null}
        {orders?.length === 0 ? <p>No orders have been placed.</p> : null}
        {orders?.map((order) => (
          <article className="panel" key={order.id}>
            <h3>{order.reference}</h3>
            <p>Status: {order.status.replaceAll('_', ' ')}</p>
            <p>Placed {new Date(order.createdAt).toLocaleString()}</p>
            <p>Buyer: {order.buyerName} · {order.buyerEmail} · {order.buyerPhone}</p>
            <p>Delivery address: {order.deliveryAddress}</p>
            <ul>
              {order.items.map((item) => (
                <li key={`${order.id}-${item.title}`}>
                  {item.quantity} × {item.title} · ৳{item.lineTotalBdt.toLocaleString()}
                </li>
              ))}
            </ul>
            <strong>COD total: ৳{order.totalBdt.toLocaleString()}</strong>
            {order.status === 'pending_admin_confirmation' ? (
              <p>
                <button
                  className="button button-primary"
                  disabled={pendingId !== null}
                  onClick={() => void confirmOrder(order.id)}
                  type="button"
                >
                  {pendingId === order.id ? 'Confirming…' : 'Confirm as admin'}
                </button>
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
