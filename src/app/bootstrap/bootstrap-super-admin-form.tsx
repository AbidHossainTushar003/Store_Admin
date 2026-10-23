'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl } from '@/lib/api-base';

export function BootstrapSuperAdminForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const token = values.get('bootstrapToken');
    if (typeof token !== 'string') {
      setError('Enter the one-time bootstrap token.');
      return;
    }

    setPending(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/super-admin/bootstrap`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      form.reset();
      if (response.status === 401) {
        setError('Sign in again and provide the valid one-time bootstrap token.');
      } else if (response.status === 403) {
        setError('The required multi-factor authentication policy was not verified.');
      } else if (response.status === 409) {
        setError('Bootstrap has already been consumed or this identity is already registered.');
      } else if (response.status === 503) {
        setError('Super Admin bootstrap is not configured. Contact the system operator.');
      } else if (!response.ok) {
        setError('The first Super Admin could not be registered. Try again or contact the system operator.');
      } else {
        setMessage('The first Super Admin identity is registered.');
        router.push('/');
        router.refresh();
      }
    } catch (cause) {
      console.error('Super Admin bootstrap request failed.', cause);
      setError('The Admin API could not be reached. The one-time token was cleared from the form.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel">
      <h2>One-time bootstrap token</h2>
      <p>Sign in through Auth0 first. The token is sent only to the same-origin Admin API proxy, is not saved in browser storage, and is never returned by the API.</p>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <div className="field field-full">
          <label htmlFor="bootstrap-token">Single-use token</label>
          <input
            autoComplete="off"
            autoCapitalize="none"
            id="bootstrap-token"
            maxLength={128}
            minLength={43}
            name="bootstrapToken"
            required
            spellCheck={false}
            type="password"
          />
        </div>
        {error ? <p className="admin-feedback" role="alert">{error}</p> : null}
        {message ? <p className="admin-feedback" role="status">{message}</p> : null}
        <div className="form-actions">
          <button className="admin-action" disabled={pending} type="submit">
            {pending ? 'Registering…' : 'Register first Super Admin'}
          </button>
          <a className="admin-action" href="/auth/login?returnTo=%2Fbootstrap">Sign in with Auth0</a>
        </div>
      </form>
    </section>
  );
}
