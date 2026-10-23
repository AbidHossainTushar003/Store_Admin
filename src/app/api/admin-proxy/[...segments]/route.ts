import { NextRequest, NextResponse } from 'next/server';
import { getAuth0Client, hasAuth0Configuration } from '@/lib/auth0';
import { isAllowedAdminProxyPath } from '@/lib/admin-proxy-policy';

export const dynamic = 'force-dynamic';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
  method: 'GET' | 'POST' | 'PATCH',
) {
  if (!hasAuth0Configuration()) {
    return NextResponse.json({ message: 'Admin Auth0 access is not configured.' }, { status: 503 });
  }

  const { segments } = await context.params;
  if (!isAllowedAdminProxyPath(method, segments)) {
    return NextResponse.json({ message: 'This Admin API operation is not available.' }, { status: 404 });
  }

  if (method !== 'GET') {
    const appBaseUrl = process.env.APP_BASE_URL;
    let expectedOrigin: string;
    try {
      if (!appBaseUrl) throw new Error('APP_BASE_URL is missing.');
      expectedOrigin = new URL(appBaseUrl).origin;
    } catch {
      return NextResponse.json({ message: 'Admin Auth0 access is misconfigured.' }, { status: 503 });
    }
    if (request.headers.get('origin') !== expectedOrigin) {
      return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
    }
  }

  let body: string | undefined;
  if (method !== 'GET') {
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (!Number.isFinite(contentLength) || contentLength > 8192) {
      return NextResponse.json({ message: 'Request body is too large.' }, { status: 413 });
    }
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 8192) {
      return NextResponse.json({ message: 'Request body is too large.' }, { status: 413 });
    }
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      return NextResponse.json({ message: 'A JSON request body is required.' }, { status: 415 });
    }
  }

  let apiUrl: URL;
  try {
    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) throw new Error('API_BASE_URL is missing.');
    const parsedBaseUrl = new URL(baseUrl);
    const basePath = parsedBaseUrl.pathname.replace(/\/+$/, '');
    const apiPath = basePath.endsWith('/api/v1') ? basePath : `${basePath}/api/v1`;
    apiUrl = new URL(
      `${apiPath}/${segments.map(encodeURIComponent).join('/')}`,
      parsedBaseUrl.origin,
    );
  } catch {
    return NextResponse.json({ message: 'The Admin API is misconfigured.' }, { status: 503 });
  }

  const auth0 = getAuth0Client();
  let session;
  try {
    session = await auth0.getSession();
  } catch {
    console.error('Unable to read the Admin Auth0 session.');
    return NextResponse.json({ message: 'Admin authentication is temporarily unavailable.' }, { status: 503 });
  }
  if (!session) {
    return NextResponse.json({ message: 'Sign in with Auth0 to continue.' }, { status: 401 });
  }

  let token: string;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    return NextResponse.json({ message: 'A valid Admin access token is required.' }, { status: 401 });
  }

  try {
    const response = await fetch(apiUrl, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Shopademia-Auth0-Sid': session.internal.sid,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body } : {}),
    });
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    console.error('The Admin API is unavailable.');
    return NextResponse.json({ message: 'The Admin API is temporarily unavailable.' }, { status: 503 });
  }
}

type RouteContext = { params: Promise<{ segments: string[] }> };

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'GET');
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'POST');
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'PATCH');
}
