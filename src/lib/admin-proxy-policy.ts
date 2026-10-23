const readablePaths = new Set([
  'admin/activity',
  'admin/analytics',
  'admin/categories',
  'admin/customers',
  'admin/orders',
  'admin/products',
  'admin/seller-applications',
  'admin/sellers',
  'admin/summary',
  'super-admin/me',
]);

export function isAllowedAdminProxyPath(method: string, segments: string[]): boolean {
  if (segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    return false;
  }
  const path = segments.join('/');
  if (method === 'GET') {
    return readablePaths.has(path);
  }
  if (method === 'POST') {
    return path === 'super-admin/bootstrap';
  }
  return method === 'PATCH' && (
    /^admin\/products\/[A-Za-z0-9_-]+\/status$/.test(path) ||
    /^admin\/products\/[A-Za-z0-9_-]+\/publication$/.test(path) ||
    /^admin\/seller-applications\/[A-Za-z0-9_-]+\/status$/.test(path) ||
    /^admin\/orders\/[A-Za-z0-9_-]+\/confirm$/.test(path)
  );
}
