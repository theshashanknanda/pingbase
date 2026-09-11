import assert from 'node:assert/strict';
import { generateJwt, verifyJwt } from './auth';

const token = generateJwt({ email: 'demo@pingbase.dev' });
const payload = verifyJwt(token);

assert.equal(payload.email, 'demo@pingbase.dev');
console.log('auth jwt ok');
