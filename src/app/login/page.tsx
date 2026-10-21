import type { Metadata } from 'next';
import LoginForm from './login-form';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Super-Admin Login',
  description: 'Sign-in interface preview for the Shopademia Super-Admin portal.',
};

export default function LoginPage() {
  return (
    <main id="main-content" className={styles.loginPage}>
      <section className={styles.brandPanel} aria-label="Shopademia Super-Admin portal">
        <a className={styles.brand} href="/" aria-label="Shopademia admin overview">
          <span className={styles.brandMark} aria-hidden="true">S</span>
          <span>Shopademia</span>
        </a>

        <div className={styles.brandMessage}>
          <p className={styles.eyebrow}>SUPER-ADMIN PORTAL</p>
          <h1>Marketplace operations, with care.</h1>
          <p>
            A dedicated workspace for the people responsible for keeping the
            marketplace trusted, thoughtful, and running smoothly.
          </p>
        </div>

        <p className={styles.brandFooter}>A considered approach to marketplace administration.</p>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-heading">
        <div className={styles.formContent}>
          <p className={styles.mobileEyebrow}>SUPER-ADMIN PORTAL</p>
          <p className={styles.sectionEyebrow}>ADMINISTRATOR ACCESS</p>
          <h2 id="login-heading">Welcome back</h2>
          <p className={styles.intro}>
            Sign in to continue to your Shopademia administration workspace.
          </p>

          <div className={styles.securityNotice} role="note">
            <span className={styles.noticeIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span>
              <strong>Extra protection matters</strong>
              <span>Super-admin access is intended to require multi-factor authentication.</span>
            </span>
          </div>

          <LoginForm />

          <p className={styles.securityBoundary}>
            <strong>Preview only.</strong> Authentication is not connected. This page does not
            protect the dashboard or API, and credentials entered here are not sent or stored.
          </p>

          <p className={styles.footer}>Shopademia · Super-Admin Portal</p>
        </div>
      </section>
    </main>
  );
}
