import { NextResponse } from 'next/server';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'pingbase-local-dev-secret-change-me';
const COOKIE_NAME = 'pingbase_session';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

const encodeBase64Url = (value: string) => Buffer.from(value).toString('base64url');
const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

export function createJwt(email: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      email,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    }),
  );

  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

export function verifyJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerBase64, payloadBase64, signature] = parts;
  if (!headerBase64 || !payloadBase64 || !signature) {
    throw new Error('Invalid token parts');
  }

  const signingInput = `${headerBase64}.${payloadBase64}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64url');

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64Url(payloadBase64)) as { email: string; exp: number };
  if (!payload.email) {
    throw new Error('Token missing email');
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const backendResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse.json();
    if (!backendResponse.ok || !data.success) {
      return NextResponse.json({ success: false, message: data.message || 'Login failed' }, { status: backendResponse.status || 400 });
    }

    const token = data.token;
    const response = NextResponse.json({
      success: true,
      user: { email: data.user?.email ?? email },
      token,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Login failed' },
      { status: 400 },
    );
  }
}
