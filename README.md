# Shopademia Admin

Local development operations portal for the Shopademia marketplace.

## Connected local features

- Live marketplace counts from persisted local listings and COD orders.
- Seller-listing review and activate/pause controls.
- Separate public-publication approval and revocation controls with required reasons.
- Categories derived from the persisted seller catalogue.
- Seller identities and guest customer summaries derived from listings and COD orders.
- Daily COD order counts and order values.
- Recent listing and order activity.
- Local seller application status review when Auth0-backed applications and the API schema are configured.
- Seller/admin COD order confirmation workflow.
- Browser-local display preferences.

The default admin identity remains a fixed loopback-only development test role. An
Auth0-backed Admin BFF and API-side Super Admin role boundary are available for
deployment preparation, but are inactive until configured. The portal still does not
provide financial accounting, payment processing, seller account provisioning, an
immutable general-purpose audit log, or category taxonomy management. Seller application
approval records a decision but does not provision an account.

Run `npm run dev` for local development and `npm run build` for a production compilation
check. Local Admin API routes require the API's loopback-only local demo mode.

## Auth0 Super Admin deployment preparation

Set `NEXT_PUBLIC_ADMIN_AUTH_MODE=auth0` at build time only after configuring the
dedicated Admin Auth0 application, API audience, exact `APP_BASE_URL`, `API_BASE_URL`,
Redis session store, and a base64-encoded 32-byte `AUTH0_SESSION_ENCRYPTION_KEY` through
the approved local secret manager. The Admin BFF stores encrypted Auth0 session data
and forwards only allowlisted Admin operations to the API; browser JavaScript never
receives the access token. Keep the existing local mode for loopback development.
Production builds require Auth0 mode, and production Auth0 sessions are unavailable when
`APP_BASE_URL` does not use HTTPS. The other Auth0, Redis, and API settings remain required
at runtime.
Production Auth0 configuration also requires a TLS-enabled `rediss://` Redis URL;
plaintext Redis URLs remain available only for non-production development.

The API's one-time bootstrap additionally requires the unapplied
`004-super-admin-security.sql` schema, a high-entropy one-use bootstrap token supplied
to the authenticated bootstrap page, its SHA-256 hex digest in API secret storage, and
an Auth0 MFA claim configured to be issued only after the approved passkey/TOTP
requirements succeed. Do not commit or send secrets in chat. No migration, provider
call, or deployment has been performed. Until the identity provider policy, MFA claim,
database migration, and bootstrap have been verified, the production Admin workflow is
not operational.

Product publication approval additionally requires API migration
`007-product-publication.sql`; until that migration is separately approved, applied, and
verified on the intended database, publication controls cannot be used against a live
catalogue.

The current Admin app retains `eslint-config-next` 14.2.35 to avoid reintroducing the
audited vulnerable braces chain present in the matching Next lint package. Runtime
Next.js is 15.5.28. Lint passes for the existing Admin source, but the lint-config
version mismatch must be reviewed before adopting Next 15-only lint behavior.
