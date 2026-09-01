import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '../../../../lib/session';

export async function POST() {
  const reponse = NextResponse.json({ success: true });
  reponse.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return reponse;
}
