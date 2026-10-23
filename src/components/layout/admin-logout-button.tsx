'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiBaseUrl, usesAuth0Admin } from '@/lib/api-base';

export function AdminLogoutButton({ onSignedOut }: { onSignedOut: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (usesAuth0Admin) {
    return <Link className="header-placeholder" href="/auth/logout">Sign out</Link>;
  }

  async function signOut() {
    setPending(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/local-auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }
      onSignedOut();
      router.push('/login');
      router.refresh();
    } catch (cause) {
      console.error('Unable to clear the local admin session.', cause);
      setError('Sign out failed. Check the local API and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button className="header-placeholder" disabled={pending} type="button" onClick={() => void signOut()}>
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
      {error ? <span className="session-status" role="alert">{error}</span> : null}
    </>
  );
}
