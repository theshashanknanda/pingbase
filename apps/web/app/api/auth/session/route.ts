import { NextResponse } from 'next/server';
import { verifyJwt } from '../login/route';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('pingbase_session='));

  const token = cookieValue ? decodeURIComponent(cookieValue.split('=')[1]) : null;

  if (!token) {
    return NextResponse.json({ user: null, token: null });
  }

  try {
    const payload = verifyJwt(token);
    return NextResponse.json({ user: { email: payload.email }, token });
  } catch (error) {
    const response = NextResponse.json({ user: null, token: null });
    response.cookies.set('pingbase_session', '', { maxAge: 0, path: '/' });
    return response;
  }
}
