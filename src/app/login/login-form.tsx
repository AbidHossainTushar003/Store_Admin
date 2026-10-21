'use client';

import { useState } from 'react';
import styles from './login.module.css';

export default function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form
      className={styles.formSection}
      aria-label="Sign-in form preview"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.field}>
        <label htmlFor="work-email">Work email</label>
        <input
          id="work-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-describedby="email-help"
        />
        <span className={styles.fieldHelp} id="email-help">
          Use your organization email address.
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <div className={styles.passwordControl}>
          <input
            id="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-describedby="password-help"
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
        <span className={styles.fieldHelp} id="password-help">
          Password visibility is controlled locally for this preview.
        </span>
      </div>

      <p className={styles.formStatus} role="status" aria-live="polite">
        Sign-in is not connected yet. No credentials are submitted.
      </p>
      <button className={styles.submitButton} type="button" disabled>
        Continue securely
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
