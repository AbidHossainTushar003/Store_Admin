'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl } from '@/lib/api-base';
import styles from './login.module.css';

export default function LoginForm({ auth0Enabled }: { auth0Enabled: boolean }) {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    const values = new FormData(form);
    setPending(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/local-auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.get('email'),
          password: values.get('password'),
          role: 'admin',
        }),
      });
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }
      router.push('/');
      router.refresh();
    } catch (cause) {
      console.error('Local admin sign-in failed.', cause);
      setError('Local admin sign-in is unavailable. Check the local API and demo mode.');
    } finally {
      setPending(false);
    }
  }

  if (auth0Enabled) {
    return (
      <div className={styles.formSection}>
        <a className={styles.submitButton} href="/auth/login?returnTo=%2F">
          Continue with secure sign-in
          <span aria-hidden="true">→</span>
        </a>
        <p className={styles.securityBoundary}>
          Production access requires the configured Auth0 MFA policy and an approved
          Super Admin identity.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.formSection} aria-label="Local admin sign-in" onSubmit={(event) => void signIn(event)}>
      <div className={styles.field}>
        <label htmlFor="work-email">Test admin email</label>
        <input
          id="work-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@example.test"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Test admin password</label>
        <div className={styles.passwordControl}>
          <input
            id="password"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter the local test password"
            required
          />
          <button
            className={styles.visibilityButton}
            type="button"
            aria-controls="password"
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? 'Hide password' : 'Show password'}
          </button>
        </div>
      </div>

      {error ? <p className={styles.formStatus} role="alert">{error}</p> : null}
      <button className={styles.submitButton} type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in as local test admin'}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
