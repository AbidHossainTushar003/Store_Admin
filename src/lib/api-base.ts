export const usesAuth0Admin = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE === 'auth0';
if (process.env.NODE_ENV === 'production' && !usesAuth0Admin) {
  throw new Error('Production Admin Portal requires NEXT_PUBLIC_ADMIN_AUTH_MODE=auth0.');
}

export const apiBaseUrl = usesAuth0Admin
  ? '/api/admin-proxy'
  : process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';
