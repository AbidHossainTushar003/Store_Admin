import { NextRequest, NextResponse } from 'next/server';
import { getAuth0Client, hasAuth0Configuration } from './src/lib/auth0';

export async function middleware(request: NextRequest) {
  if (!hasAuth0Configuration()) {
    return NextResponse.next();
  }
  return getAuth0Client().middleware(request);
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
