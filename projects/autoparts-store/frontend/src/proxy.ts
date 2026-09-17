import { NextRequest, NextResponse } from 'next/server';
import { locales } from './lib/i18n';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/_next') || path.includes('.')) return NextResponse.next();
  const hasLocale = locales.some((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();
  request.nextUrl.pathname = `/en${path}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = { matcher: ['/((?!api).*)'] };
