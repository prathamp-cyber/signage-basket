/**
 * Signage Basket — Authentication & Security Utilities
 */
const crypto = require('crypto');

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function getJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || 'signage_basket_default_secret_key_change_in_production';
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(message).digest('base64url');
  return `${message}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const message = `${headerB64}.${payloadB64}`;
  const expectedSignature = crypto.createHmac('sha256', getJwtSecret()).update(message).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    if (!name) return;
    const val = parts.slice(1).join('=').trim();
    list[name] = decodeURIComponent(val);
  });
  return list;
}

function createAuthCookie(token) {
  return `sb_admin=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;
}

function createClearAuthCookie() {
  return `sb_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;

  try {
    const expectedKey = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (derivedKey.length !== expectedKey.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch (_) {
    return false;
  }
}

async function getStoredPasswordHash(db) {
  try {
    const doc = await db.collection('admin').findOne({ _id: 'credentials' });
    if (doc && doc.passwordHash) {
      return doc.passwordHash;
    }
  } catch (err) {
    console.warn('Could not query admin collection:', err.message);
  }
  return process.env.ADMIN_PASSWORD_HASH || '';
}

function checkCsrf(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }

  const xRequestedWith = req.headers['x-requested-with'];
  if (xRequestedWith !== 'sb-admin') {
    return false;
  }

  const host = (req.headers.host || '').toLowerCase().trim();
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;

  try {
    const parsedOrigin = new URL(origin);
    const originHost = parsedOrigin.host.toLowerCase().trim();
    return originHost === host;
  } catch (_) {
    return false;
  }
}

function requireAuth(req) {
  const cookies = parseCookies(req);
  let token = cookies['sb_admin'];

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }

  const payload = verifyToken(token);
  if (!payload) {
    const err = new Error('Session expired or invalid');
    err.status = 401;
    throw err;
  }

  return payload;
}

module.exports = {
  signToken,
  verifyToken,
  parseCookies,
  createAuthCookie,
  createClearAuthCookie,
  hashPassword,
  verifyPassword,
  getStoredPasswordHash,
  checkCsrf,
  requireAuth
};
