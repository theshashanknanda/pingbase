import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'pingbase-local-dev-secret-change-me';

export type JwtPayload = {
  email: string;
  iat: number;
  exp: number;
};

const encodeBase64Url = (value: string) => Buffer.from(value).toString('base64url');
const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

export function generateJwt(payload: { email: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = encodeBase64Url(
    JSON.stringify({
      email: payload.email,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    }),
  );

  const signingInput = `${header}.${claims}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing token');
  }

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

  const payload = JSON.parse(decodeBase64Url(payloadBase64)) as JwtPayload;

  if (!payload.email) {
    throw new Error('Token missing email');
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = verifyJwt(token);
    (req as Request & { user?: JwtPayload }).user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid or expired token',
    });
  }
}

export function getAuthEmail(req: Request): string | null {
  const user = (req as Request & { user?: JwtPayload }).user;
  return user?.email ?? null;
}
