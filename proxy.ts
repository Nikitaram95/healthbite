import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/feed', '/profile', '/upload'];
const GUEST_ONLY = ['/login'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED.some(
    (p) => path === p || path.startsWith(p + '/')
  );

  const isGuestOnly = GUEST_ONLY.includes(path);

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && token) {
    const from = request.nextUrl.searchParams.get('from') || '/feed';
    const url = request.nextUrl.clone();
    url.pathname = from;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)', '/'],
};