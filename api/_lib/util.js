/**
 * Signage Basket — API Utilities & Validators
 */

async function parseBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (_) {
        return {};
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 4 * 1024 * 1024) {
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data, customHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, val] of Object.entries(customHeaders)) {
    res.setHeader(key, val);
  }
  res.end(JSON.stringify(data));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{2,80}$/.test(slug);
}

function normalizeIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return '';
}

function isValidIndianPhone(phone) {
  const normalized = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidRating(rating) {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
}

function isValidMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/assets/')) return true;
  if (url.startsWith('https://') && url.includes('.blob.vercel-storage.com/')) return true;
  if (process.env.BLOB_STORE_HOST && url.startsWith(process.env.BLOB_STORE_HOST)) return true;
  return false;
}

async function checkRateLimit(db, key, limit, windowSeconds) {
  try {
    const col = db.collection('rate_limits');
    const now = new Date();
    const expiresAt = new Date(Date.now() + windowSeconds * 1000);

    const record = await col.findOne({ _id: key });
    if (record) {
      if (record.expiresAt > now) {
        if (record.count >= limit) {
          return false;
        }
        await col.updateOne({ _id: key }, { $inc: { count: 1 } });
        return true;
      } else {
        await col.updateOne({ _id: key }, { $set: { count: 1, expiresAt } });
        return true;
      }
    }

    await col.insertOne({ _id: key, count: 1, expiresAt });
    return true;
  } catch (err) {
    console.error('Rate limit error:', err);
    return true; // Fail open if rate limit collection is temporarily unreachable
  }
}

module.exports = {
  parseBody,
  sendJson,
  getClientIp,
  slugify,
  isValidSlug,
  normalizeIndianPhone,
  isValidIndianPhone,
  isValidEmail,
  isValidRating,
  isValidMediaUrl,
  checkRateLimit
};
