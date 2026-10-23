'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminLogoutButton } from './admin-logout-button';
import { apiBaseUrl, usesAuth0Admin } from '@/lib/api-base';

type SessionState = 'checking' | 'signed-in' | 'signed-out' | 'access-denied' | 'unavailable';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function AdminSessionActions() {
  const pathname = usePathname();
  const [state, setState] = useState<SessionState>('checking');
  const [name, setName] = useState(usesAuth0Admin ? 'Super Admin' : 'Local admin');

  useEffect(() => {
    let active = true;
    const sessionPath = usesAuth0Admin
      ? `${apiBaseUrl}/super-admin/me`
      : `${apiBaseUrl}/local-auth/me/admin`;
    void fetch(sessionPath, {
      credentials: 'include',
      cache: 'no-store',
    }).then(async (response) => {
      if (response.status === 401) {
        if (active) setState('signed-out');
        return;
      }
      if (response.status === 503) {
        if (active) setState('unavailable');
        return;
      }
      if (response.status === 403 && usesAuth0Admin) {
        if (active) setState('access-denied');
        return;
      }
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const value: unknown = await response.json();
      if (!isRecord(value) || !isRecord(value.identity)) {
        throw new Error('Shopademia API returned an invalid admin session.');
      }
      const identity = value.identity;
      if (active) {
        if (usesAuth0Admin) {
          if (identity.role !== 'super_admin') {
            throw new Error('Shopademia API returned an invalid Super Admin session.');
          }
          setName('Super Admin');
        } else {
          if (identity.role !== 'admin' || typeof identity.name !== 'string') {
            throw new Error('Shopademia API returned an invalid local admin session.');
          }
          setName(identity.name);
        }
        setState('signed-in');
      }
    }).catch((cause: unknown) => {
      console.error('Unable to check the local admin session.', cause);
      if (active) setState('unavailable');
    });
    return () => { active = false; };
  }, [pathname]);

  if (state === 'signed-in') {
    return (
      <>
        <span className="account-placeholder"><span className="account-label">{name}</span></span>
        <AdminLogoutButton onSignedOut={() => setState('signed-out')} />
      </>
    );
  }

  return (
    <>
      {state === 'unavailable' ? <span className="session-status" role="status">Admin API unavailable</span> : null}
      {state === 'access-denied' ? (
        <Link className="header-placeholder account-placeholder" href="/bootstrap">Complete Admin setup</Link>
      ) : (
        <Link
          className="header-placeholder account-placeholder"
          href={usesAuth0Admin ? '/auth/login?returnTo=%2F' : '/login'}
        >
          Sign in
        </Link>
      )}
    </>
  );
}
