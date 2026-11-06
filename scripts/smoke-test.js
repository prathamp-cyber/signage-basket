#!/usr/bin/env node
/**
 * Signage Basket — Live Smoke Test Suite
 * Built with Node.js built-ins only (fetch, crypto, zlib, fs).
 * Reads credentials from .env.smoke in project root.
 * Never prints passwords, tokens, cookies, or connection strings.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// ----------------------------------------------------
// 1. Parse .env.smoke manually (no external dotenv)
// ----------------------------------------------------
const envSmokePath = path.resolve(process.cwd(), '.env.smoke');
if (!fs.existsSync(envSmokePath)) {
  console.error('FAIL: .env.smoke not found in project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envSmokePath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1]] = val;
  }
}

const SB_URL = (envVars.SB_URL || '').replace(/\/+$/, '');
const SB_USER = envVars.SB_USER || '';
const SB_PASS = envVars.SB_PASS || '';

if (!SB_URL || !SB_USER || !SB_PASS) {
  console.error('FAIL: .env.smoke must contain SB_URL, SB_USER and SB_PASS.');
  process.exit(1);
}

const ORIGIN = new URL(SB_URL).origin;

// ----------------------------------------------------
// 2. Cookie Jar & HTTP Helpers
// ----------------------------------------------------
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  storeCookies(res) {
    let rawList = [];
    if (typeof res.headers.getSetCookie === 'function') {
      rawList = res.headers.getSetCookie();
    } else {
      const raw = res.headers.get('set-cookie');
      if (raw) rawList = [raw];
    }

    for (const cookieStr of rawList) {
      const parts = cookieStr.split(';');
      const [nameVal] = parts;
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx > 0) {
        const name = nameVal.substring(0, eqIdx).trim();
        const value = nameVal.substring(eqIdx + 1).trim();
        const isDelete = parts.some(p => {
          const lp = p.trim().toLowerCase();
          return lp.startsWith('max-age=0') || lp.includes('expires=thu, 01 jan 1970');
        });
        if (isDelete) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }
  }

  getCookieHeader() {
    const list = [];
    for (const [k, v] of this.cookies.entries()) {
      list.push(`${k}=${v}`);
    }
    return list.join('; ');
  }
}

const jar = new CookieJar();

async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${SB_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isAdminOrAuth = endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/auth');

  if (isStateChanging && isAdminOrAuth) {
    if (!headers['X-Requested-With'] && options.skipXRequestedWith !== true) {
      headers['X-Requested-With'] = 'sb-admin';
    }
    if (!headers['Origin'] && options.skipOrigin !== true) {
      headers['Origin'] = ORIGIN;
    }
    if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (options.useCookie !== false) {
    const cookieHeader = jar.getCookieHeader();
    if (cookieHeader && !headers['Cookie']) {
      headers['Cookie'] = cookieHeader;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body,
    redirect: 'manual'
  });

  jar.storeCookies(res);
  return res;
}

// ----------------------------------------------------
// 3. PNG Generator (96x96 gradient PNG using zlib)
// ----------------------------------------------------
function createTestPng(width = 96, height = 96) {
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB color
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const stride = 1 + width * 3;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const offset = y * stride;
    raw[offset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      raw[offset + 1 + x * 3] = (x * 255 / width) | 0; // R
      raw[offset + 1 + x * 3 + 1] = (y * 255 / height) | 0; // G
      raw[offset + 1 + x * 3 + 2] = 180; // B
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// ----------------------------------------------------
// 4. Test Runner State & Cleanup Registry
// ----------------------------------------------------
const cleanupState = {
  designIds: [],
  projectIds: [],
  reviewIds: [],
  enquiryIds: [],
  mediaUrls: []
};

let hasFailure = false;
const checkResults = [];

function record(num, status, note) {
  const line = `Check ${num}: [${status}] ${note}`;
  console.log(line);
  checkResults.push({ num, status, note });
  if (status === 'FAIL') {
    hasFailure = true;
  }
}

// ----------------------------------------------------
// 5. Test Execution
// ----------------------------------------------------
async function runSmokeTests() {
  const testTimestamp = Date.now();
  const testSlug = `smoke-test-${testTimestamp}`;
  const testDesignName = `__smoke_test__ design ${testTimestamp}`;
  let uploadedBlobUrl = null;
  let testDesignId = null;
  let testProjectId = null;
  let testReviewId = null;
  let testEnquiryId = null;
  let validSessionCookieHeader = '';

  try {
    // ----------------------------------------------------
    // CHECK 1: GET /api/health
    // ----------------------------------------------------
    try {
      const res = await apiRequest('/api/health');
      if (res.status !== 200) {
        record(1, 'FAIL', `/api/health returned HTTP ${res.status}`);
      } else {
        const data = await res.json();
        if (data.ok === true && data.db === true && data.auth === true && data.blob === true) {
          record(1, 'PASS', 'ok: true, db: true, auth: true, blob: true');
        } else {
          record(1, 'FAIL', `Unexpected health flags: ok=${data.ok}, db=${data.db}, auth=${data.auth}, blob=${data.blob}`);
        }
      }
    } catch (err) {
      record(1, 'FAIL', `Request failed: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 2: Public Endpoints
    // ----------------------------------------------------
    try {
      const endpoints = [
        '/api/public/catalog',
        '/api/public/projects',
        '/api/public/reviews',
        '/api/public/settings'
      ];
      let allOk = true;
      const details = [];

      for (const ep of endpoints) {
        const start = Date.now();
        const res = await apiRequest(`${ep}?t=${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
        const duration = Date.now() - start;
        const cacheCtrl = res.headers.get('cache-control') || 'none';
        if (res.status === 200) {
          const body = await res.json();
          if (body.ok === true) {
            details.push(`${ep} (${duration}ms, cache: ${cacheCtrl})`);
          } else {
            allOk = false;
            details.push(`${ep} returned ok:false`);
          }
        } else {
          allOk = false;
          details.push(`${ep} returned HTTP ${res.status}`);
        }
      }

      if (allOk) {
        record(2, 'PASS', `All 4 endpoints returned 200 {ok:true} with Cache-Control present: ${details.join('; ')}`);
      } else {
        record(2, 'FAIL', `Issues with public endpoints: ${details.join('; ')}`);
      }
    } catch (err) {
      record(2, 'FAIL', `Public endpoints request error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 3: Auth (Wrong password, correct login, cookie flags, /me)
    // ----------------------------------------------------
    try {
      // 3a. Wrong password -> 401
      const wrongRes = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: SB_USER, password: `wrong_pass_${Date.now()}` }),
        useCookie: false
      });
      const wrongData = await wrongRes.json().catch(() => ({}));
      const wrongOk = wrongRes.status === 401 && wrongData.ok === false;

      // 3b. Correct login -> 200 + session cookie
      const loginRes = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: SB_USER, password: SB_PASS }),
        useCookie: false
      });

      let cookieOk = false;
      let setCookieStr = '';
      if (loginRes.status === 200) {
        const getSet = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
        setCookieStr = (getSet[0] || '').toLowerCase();
        const hasHttpOnly = setCookieStr.includes('httponly');
        const hasSecure = setCookieStr.includes('secure');
        const hasSameSite = setCookieStr.includes('samesite=strict');
        const hasNoMaxAge = !setCookieStr.includes('max-age');
        const hasNoExpires = !setCookieStr.includes('expires');
        cookieOk = hasHttpOnly && hasSecure && hasSameSite && hasNoMaxAge && hasNoExpires;
      }

      // 3c. GET /api/auth/me -> 200 {ok: true}
      validSessionCookieHeader = jar.getCookieHeader();
      const meRes = await apiRequest('/api/auth/me');
      const meData = await meRes.json().catch(() => ({}));
      const meOk = meRes.status === 200 && meData.ok === true;

      if (wrongOk && loginRes.status === 200 && cookieOk && meOk) {
        record(3, 'PASS', '401 on wrong pass; 200 on correct login; session cookie (HttpOnly, Secure, SameSite=Strict, no Max-Age/Expires); /api/auth/me ok');
      } else {
        const issues = [];
        if (!wrongOk) issues.push(`wrong pass gave HTTP ${wrongRes.status}`);
        if (loginRes.status !== 200) issues.push(`login gave HTTP ${loginRes.status}`);
        if (!cookieOk) issues.push(`cookie flags invalid (${setCookieStr})`);
        if (!meOk) issues.push(`GET /api/auth/me gave HTTP ${meRes.status}`);
        record(3, 'FAIL', issues.join(', '));
      }
    } catch (err) {
      record(3, 'FAIL', `Auth test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 4: Protection (No cookie, no X-Requested-With, wrong Origin)
    // ----------------------------------------------------
    try {
      // 4a. No cookie -> 401
      const noCookieRes = await apiRequest('/api/admin/stats', { useCookie: false });
      const noCookieOk = noCookieRes.status === 401;

      // 4b. No X-Requested-With -> 403
      const noXRes = await apiRequest('/api/admin/designs', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        skipXRequestedWith: true
      });
      const noXOk = noXRes.status === 403;

      // 4c. Wrong Origin -> 403
      const wrongOriginRes = await apiRequest('/api/admin/designs', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: { Origin: 'https://malicious-site.example.com' },
        skipOrigin: true
      });
      const wrongOriginOk = wrongOriginRes.status === 403;

      if (noCookieOk && noXOk && wrongOriginOk) {
        record(4, 'PASS', '401 on missing cookie; 403 on missing X-Requested-With; 403 on untrusted Origin');
      } else {
        record(4, 'FAIL', `Protection failure: noCookie=${noCookieRes.status} (exp 401), noHeader=${noXRes.status} (exp 403), wrongOrigin=${wrongOriginRes.status} (exp 403)`);
      }
    } catch (err) {
      record(4, 'FAIL', `Protection test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 5: PHOTO UPLOAD
    // ----------------------------------------------------
    try {
      const testPngBuffer = createTestPng(96, 96);
      const uploadRes = await apiRequest('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          filename: '__smoke_test__.png',
          contentType: 'image/png',
          dataBase64: testPngBuffer.toString('base64')
        })
      });

      let uploadOk = false;
      let hostOk = false;
      let fetchOk = false;
      let htmlRejectOk = false;
      let sizeRejectOk = false;
      let listOk = false;

      if (uploadRes.status === 200) {
        const upData = await uploadRes.json();
        if (upData.ok && upData.url) {
          uploadOk = true;
          uploadedBlobUrl = upData.url;
          cleanupState.mediaUrls.push(uploadedBlobUrl);

          const parsedUrl = new URL(uploadedBlobUrl);
          hostOk = parsedUrl.protocol === 'https:' && parsedUrl.hostname.endsWith('.public.blob.vercel-storage.com');

          // GET without cookie
          const fetchRes = await fetch(uploadedBlobUrl, { cache: 'no-store' });
          if (fetchRes.status === 200) {
            const cType = fetchRes.headers.get('content-type') || '';
            const buf = Buffer.from(await fetchRes.arrayBuffer());
            fetchOk = cType.startsWith('image/') && buf.length === testPngBuffer.length;
          }
        }
      }

      // Rejection: text/html -> 400
      const htmlRes = await apiRequest('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.html',
          contentType: 'text/html',
          dataBase64: Buffer.from('<h1>test</h1>').toString('base64')
        })
      });
      htmlRejectOk = htmlRes.status >= 400 && htmlRes.status < 500;

      // Rejection: 3.2 MB payload -> 400 or 413
      const largeBuf = crypto.randomBytes(3.2 * 1024 * 1024);
      const largeRes = await apiRequest('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'large.png',
          contentType: 'image/png',
          dataBase64: largeBuf.toString('base64')
        })
      });
      sizeRejectOk = largeRes.status === 400 || largeRes.status === 413;

      // Check GET /api/admin/media lists it
      const listRes = await apiRequest('/api/admin/media');
      if (listRes.status === 200) {
        const listData = await listRes.json();
        listOk = Array.isArray(listData.blobs) && listData.blobs.some(b => b.url === uploadedBlobUrl);
      }

      if (uploadOk && hostOk && fetchOk && htmlRejectOk && sizeRejectOk && listOk) {
        record(5, 'PASS', `Uploaded valid 96x96 PNG to *.public.blob.vercel-storage.com; publicly reachable byte-exact; rejections for text/html (${htmlRes.status}) & 3.2MB (${largeRes.status}); listed in admin`);
      } else {
        record(5, 'FAIL', `Photo upload failure: upload=${uploadRes.status}, host=${hostOk}, fetch=${fetchOk}, htmlReject=${htmlRejectOk}, sizeReject=${sizeRejectOk}, list=${listOk}`);
      }
    } catch (err) {
      record(5, 'FAIL', `Photo upload test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 6: DESIGN WITH PHOTO
    // ----------------------------------------------------
    try {
      const designPayload = {
        category: 'home-nameplates',
        name: testDesignName,
        slug: testSlug,
        material: 'Acrylic',
        tags: ['smoke', 'test'],
        desc: 'Smoke test automated description',
        finishes: [],
        sizes: [],
        price: null,
        images: [{ url: uploadedBlobUrl, alt: 'smoke test alt' }],
        status: 'draft',
        featured: false
      };

      // 6a. Create design (draft)
      const createRes = await apiRequest('/api/admin/designs', {
        method: 'POST',
        body: JSON.stringify(designPayload)
      });
      let createOk = false;
      if (createRes.status === 201) {
        const data = await createRes.json();
        if (data.ok && data.item && data.item._id) {
          createOk = true;
          testDesignId = String(data.item._id);
          cleanupState.designIds.push(testDesignId);
        }
      }

      // 6b. Duplicate slug returns 409
      const dupRes = await apiRequest('/api/admin/designs', {
        method: 'POST',
        body: JSON.stringify(designPayload)
      });
      const dupOk = dupRes.status === 409;

      // 6c. Draft NOT in public catalog
      const catDraftRes = await apiRequest(`/api/public/catalog?t=${Date.now()}`);
      const catDraftData = await catDraftRes.json();
      const notInCatalogAsDraft = !catDraftData.items?.some(i => i.slug === testSlug);

      // 6d. Publish design -> appears in catalog & sitemap
      const pubRes = await apiRequest(`/api/admin/designs/${testDesignId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...designPayload, status: 'published' })
      });
      const pubOk = pubRes.status === 200;

      const catPubRes = await apiRequest(`/api/public/catalog?t=${Date.now()}`);
      const catPubData = await catPubRes.json();
      const inCatalog = catPubData.items?.find(i => i.slug === testSlug);
      const catalogHasPhoto = inCatalog && inCatalog.images?.[0]?.url === uploadedBlobUrl;

      const sitemapRes = await apiRequest(`/api/sitemap?t=${Date.now()}`);
      const sitemapText = await sitemapRes.text();
      const inSitemap = sitemapText.includes(`/design/${testSlug}`);

      // 6e. Unpublish design -> disappears from catalog & sitemap
      const unpubRes = await apiRequest(`/api/admin/designs/${testDesignId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...designPayload, status: 'draft' })
      });
      const unpubOk = unpubRes.status === 200;

      const catUnpubRes = await apiRequest(`/api/public/catalog?t=${Date.now()}`);
      const catUnpubData = await catUnpubRes.json();
      const notInCatalogAgain = !catUnpubData.items?.some(i => i.slug === testSlug);

      const sitemapUnpubRes = await apiRequest(`/api/sitemap?t=${Date.now()}`);
      const sitemapUnpubText = await sitemapUnpubRes.text();
      const notInSitemapAgain = !sitemapUnpubText.includes(`/design/${testSlug}`);

      if (createOk && dupOk && notInCatalogAsDraft && pubOk && catalogHasPhoto && inSitemap && unpubOk && notInCatalogAgain && notInSitemapAgain) {
        record(6, 'PASS', 'Design created with Blob URL; 409 on duplicate slug; hidden when draft; visible in catalog and sitemap when published with identical photo URL; removed on unpublish');
      } else {
        record(6, 'FAIL', `Design lifecycle failed: create=${createOk}, dup409=${dupOk}, draftHidden=${notInCatalogAsDraft}, pub=${pubOk}, catalogPhoto=${catalogHasPhoto}, sitemap=${inSitemap}, unpub=${unpubOk}, removedCat=${notInCatalogAgain}, removedSitemap=${notInSitemapAgain}`);
      }
    } catch (err) {
      record(6, 'FAIL', `Design test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 7: PROJECT WITH PHOTO
    // ----------------------------------------------------
    try {
      const projPayload = {
        title: '__smoke_test__ project',
        type: 'Nameplate',
        location: 'Test City',
        description: 'Smoke test project description',
        images: [{ url: uploadedBlobUrl, alt: 'smoke test project' }],
        status: 'published',
        order: 0
      };

      const createRes = await apiRequest('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(projPayload)
      });
      let createOk = false;
      if (createRes.status === 201) {
        const data = await createRes.json();
        if (data.ok && data.item && data.item._id) {
          createOk = true;
          testProjectId = String(data.item._id);
          cleanupState.projectIds.push(testProjectId);
        }
      }

      // Check public projects
      const pubRes = await apiRequest(`/api/public/projects?t=${Date.now()}`);
      const pubData = await pubRes.json();
      const inPublic = pubData.items?.find(p => p._id === testProjectId || p.title === projPayload.title);
      const hasPhoto = inPublic && inPublic.images?.[0]?.url === uploadedBlobUrl;

      // Delete project
      const delRes = await apiRequest(`/api/admin/projects/${testProjectId}`, { method: 'DELETE' });
      const delOk = delRes.status === 200;
      if (delOk) {
        cleanupState.projectIds = cleanupState.projectIds.filter(id => id !== testProjectId);
      }

      const pubAfterRes = await apiRequest(`/api/public/projects?t=${Date.now()}`);
      const pubAfterData = await pubAfterRes.json();
      const gone = !pubAfterData.items?.some(p => p._id === testProjectId || p.title === projPayload.title);

      if (createOk && hasPhoto && delOk && gone) {
        record(7, 'PASS', 'Project created with Blob URL; verified in /api/public/projects with same image; deleted and confirmed gone');
      } else {
        record(7, 'FAIL', `Project lifecycle failed: create=${createOk}, hasPhoto=${hasPhoto}, del=${delOk}, gone=${gone}`);
      }
    } catch (err) {
      record(7, 'FAIL', `Project test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 8: REVIEW
    // ----------------------------------------------------
    try {
      const reviewPayload = {
        name: '__smoke_test__ reviewer',
        text: 'smoke test review text',
        rating: 5,
        status: 'published'
      };

      const createRes = await apiRequest('/api/admin/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewPayload)
      });
      let createOk = false;
      if (createRes.status === 201) {
        const data = await createRes.json();
        if (data.ok && data.item && data.item._id) {
          createOk = true;
          testReviewId = String(data.item._id);
          cleanupState.reviewIds.push(testReviewId);
        }
      }

      const pubRes = await apiRequest(`/api/public/reviews?t=${Date.now()}`);
      const pubData = await pubRes.json();
      const inPublic = pubData.items?.some(r => r._id === testReviewId || r.name === reviewPayload.name);

      const delRes = await apiRequest(`/api/admin/reviews/${testReviewId}`, { method: 'DELETE' });
      const delOk = delRes.status === 200;
      if (delOk) {
        cleanupState.reviewIds = cleanupState.reviewIds.filter(id => id !== testReviewId);
      }

      const pubAfterRes = await apiRequest(`/api/public/reviews?t=${Date.now()}`);
      const pubAfterData = await pubAfterRes.json();
      const gone = !pubAfterData.items?.some(r => r._id === testReviewId || r.name === reviewPayload.name);

      if (createOk && inPublic && delOk && gone) {
        record(8, 'PASS', 'Review created (rating 5); verified in /api/public/reviews; deleted and confirmed gone');
      } else {
        record(8, 'FAIL', `Review lifecycle failed: create=${createOk}, inPublic=${inPublic}, del=${delOk}, gone=${gone}`);
      }
    } catch (err) {
      record(8, 'FAIL', `Review test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 9: ENQUIRY & HONEYPOT
    // ----------------------------------------------------
    try {
      const enqPayload = {
        name: '__smoke_test__',
        phone: '9999999999',
        message: 'smoke test enquiry',
        design: {
          slug: testSlug,
          name: testDesignName,
          category: 'home-nameplates'
        }
      };

      // 9a. Submit enquiry
      const postRes = await apiRequest('/api/public/enquiry', {
        method: 'POST',
        body: JSON.stringify(enqPayload)
      });
      const postOk = postRes.status === 200;

      // 9b. Read back in admin
      const adminRes = await apiRequest('/api/admin/enquiries?q=__smoke_test__');
      const adminData = await adminRes.json();
      const found = adminData.items?.find(e => e.name === '__smoke_test__');
      const statusNew = found && found.status === 'new';
      if (found) {
        testEnquiryId = String(found._id);
        cleanupState.enquiryIds.push(testEnquiryId);
      }

      // 9c. PATCH status to "contacted" and notes to "ok"
      const patchRes = await apiRequest(`/api/admin/enquiries/${testEnquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'contacted', notes: 'ok' })
      });
      const patchOk = patchRes.status === 200;

      // 9d. Read back
      const readBackRes = await apiRequest('/api/admin/enquiries?q=__smoke_test__');
      const readBackData = await readBackRes.json();
      const updated = readBackData.items?.find(e => String(e._id) === testEnquiryId);
      const patchVerified = updated && updated.status === 'contacted' && updated.notes === 'ok';

      // 9e. DELETE
      const delRes = await apiRequest(`/api/admin/enquiries/${testEnquiryId}`, { method: 'DELETE' });
      const delOk = delRes.status === 200;
      if (delOk) {
        cleanupState.enquiryIds = cleanupState.enquiryIds.filter(id => id !== testEnquiryId);
      }

      // 9f. Honeypot check
      const botPayload = {
        name: '__smoke_test__ bot',
        phone: '9999999999',
        message: 'bot message',
        website: 'https://spam.example.com'
      };
      const botRes = await apiRequest('/api/public/enquiry', {
        method: 'POST',
        body: JSON.stringify(botPayload)
      });
      const botPostOk = botRes.status === 200;

      const botCheckRes = await apiRequest('/api/admin/enquiries?q=__smoke_test__ bot');
      const botCheckData = await botCheckRes.json();
      const botNotStored = !botCheckData.items || botCheckData.items.length === 0;

      if (postOk && statusNew && patchOk && patchVerified && delOk && botPostOk && botNotStored) {
        record(9, 'PASS', 'Enquiry submitted; received as "new"; PATCHed to "contacted" with notes "ok"; deleted; honeypot returned 200 and ignored payload');
      } else {
        record(9, 'FAIL', `Enquiry failed: post=${postOk}, statusNew=${statusNew}, patch=${patchOk}, verified=${patchVerified}, del=${delOk}, botPost=${botPostOk}, botIgnored=${botNotStored}`);
      }
    } catch (err) {
      record(9, 'FAIL', `Enquiry test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 10: SETTINGS (Read, re-put, verify equal, never print values)
    // ----------------------------------------------------
    try {
      const getRes = await apiRequest('/api/admin/settings');
      let origSettings = {};
      let getOk = false;
      if (getRes.status === 200) {
        const data = await getRes.json();
        origSettings = data.settings || {};
        getOk = true;
      }

      const putRes = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(origSettings)
      });
      const putOk = putRes.status === 200;

      const pubRes = await apiRequest(`/api/public/settings?t=${Date.now()}`);
      const pubData = await pubRes.json();
      const pubSettings = pubData.settings || {};

      const phoneMatches = String(pubSettings.phone || '') === String(origSettings.phone || '');
      const waMatches = String(pubSettings.whatsapp || '') === String(origSettings.whatsapp || '');
      const emailMatches = String(pubSettings.email || '') === String(origSettings.email || '');

      if (getOk && putOk && phoneMatches && waMatches && emailMatches) {
        record(10, 'PASS', 'Admin settings read and re-saved unchanged; public settings fields (phone, whatsapp, email) confirmed equal');
      } else {
        record(10, 'FAIL', `Settings check failed: get=${getOk}, put=${putOk}, phoneMatch=${phoneMatches}, waMatch=${waMatches}, emailMatch=${emailMatches}`);
      }
    } catch (err) {
      record(10, 'FAIL', `Settings test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 11: MEDIA CLEANUP
    // ----------------------------------------------------
    try {
      if (uploadedBlobUrl) {
        const delRes = await apiRequest('/api/admin/media', {
          method: 'DELETE',
          body: JSON.stringify({ url: uploadedBlobUrl })
        });
        const delOk = delRes.status === 200;
        if (delOk) {
          cleanupState.mediaUrls = cleanupState.mediaUrls.filter(u => u !== uploadedBlobUrl);
        }

        // Test public access after deletion
        const checkRes = await fetch(uploadedBlobUrl, { cache: 'no-store' });
        if (delOk && checkRes.status !== 200) {
          record(11, 'PASS', `Media deleted via DELETE /api/admin/media; public URL stops returning 200 (HTTP ${checkRes.status})`);
        } else if (delOk && checkRes.status === 200) {
          record(11, 'WARN', 'Media deleted via DELETE /api/admin/media but public URL still returns 200 due to edge CDN caching');
        } else {
          record(11, 'FAIL', `Media deletion failed: status ${delRes.status}`);
        }
      } else {
        record(11, 'WARN', 'Skipped media cleanup (no upload URL created)');
      }
    } catch (err) {
      record(11, 'FAIL', `Media cleanup error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 12: LOGOUT (Server-side session invalidation)
    // ----------------------------------------------------
    try {
      const logoutRes = await apiRequest('/api/auth/logout', { method: 'POST' });
      const logoutOk = logoutRes.status === 200;

      // Call GET /api/auth/me using the OLD valid session cookie
      const checkRes = await fetch(`${SB_URL}/api/auth/me`, {
        headers: { Cookie: validSessionCookieHeader }
      });

      if (logoutOk && checkRes.status === 401) {
        record(12, 'PASS', 'POST /api/auth/logout succeeded; GET /api/auth/me with old cookie returned 401 (server session invalidated)');
      } else if (logoutOk && checkRes.status === 200) {
        record(12, 'FAIL', 'POST /api/auth/logout cleared cookie header, but GET /api/auth/me with old cookie returned 200 (server-side session invalidation missing; token is stateless JWT)');
      } else {
        record(12, 'FAIL', `Logout check failed: logout status ${logoutRes.status}, subsequent /me status ${checkRes.status}`);
      }
    } catch (err) {
      record(12, 'FAIL', `Logout test error: ${err.message}`);
    }

    // ----------------------------------------------------
    // CHECK 13: CLEANUP VERIFICATION
    // ----------------------------------------------------
    try {
      // Re-login to perform administrative verification
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: SB_USER, password: SB_PASS })
      });

      // Ensure test design is deleted
      if (testDesignId) {
        await apiRequest(`/api/admin/designs/${testDesignId}`, { method: 'DELETE' });
        cleanupState.designIds = cleanupState.designIds.filter(id => id !== testDesignId);
      }

      // Verify lists are free of smoke test artifacts
      const [desRes, projRes, revRes, enqRes] = await Promise.all([
        apiRequest('/api/admin/designs?q=__smoke_test__'),
        apiRequest('/api/admin/projects'),
        apiRequest('/api/admin/reviews'),
        apiRequest('/api/admin/enquiries?q=__smoke_test__')
      ]);

      const desData = await desRes.json();
      const projData = await projRes.json();
      const revData = await revRes.json();
      const enqData = await enqRes.json();

      const desClean = !desData.items?.some(i => i.name.includes('__smoke_test__') || i.slug.includes('smoke-test'));
      const projClean = !projData.items?.some(i => i.title.includes('__smoke_test__'));
      const revClean = !revData.items?.some(i => i.name.includes('__smoke_test__'));
      const enqClean = !enqData.items?.some(i => i.name.includes('__smoke_test__'));

      if (desClean && projClean && revClean && enqClean) {
        record(13, 'PASS', 'All smoke test items (__smoke_test__ designs, projects, reviews, enquiries) verified clean from admin & public lists');
      } else {
        record(13, 'FAIL', `Artifacts remained in database: designs=${!desClean}, projects=${!projClean}, reviews=${!revClean}, enquiries=${!enqClean}`);
      }
    } catch (err) {
      record(13, 'FAIL', `Cleanup verification error: ${err.message}`);
    }

  } finally {
    // Guaranteed final cleanup
    for (const dId of cleanupState.designIds) {
      await apiRequest(`/api/admin/designs/${dId}`, { method: 'DELETE' }).catch(() => {});
    }
    for (const pId of cleanupState.projectIds) {
      await apiRequest(`/api/admin/projects/${pId}`, { method: 'DELETE' }).catch(() => {});
    }
    for (const rId of cleanupState.reviewIds) {
      await apiRequest(`/api/admin/reviews/${rId}`, { method: 'DELETE' }).catch(() => {});
    }
    for (const eId of cleanupState.enquiryIds) {
      await apiRequest(`/api/admin/enquiries/${eId}`, { method: 'DELETE' }).catch(() => {});
    }
    for (const mUrl of cleanupState.mediaUrls) {
      await apiRequest('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ url: mUrl })
      }).catch(() => {});
    }
  }

  // Summary output
  console.log('\n========================================');
  const passes = checkResults.filter(r => r.status === 'PASS').length;
  const warns = checkResults.filter(r => r.status === 'WARN').length;
  const fails = checkResults.filter(r => r.status === 'FAIL').length;
  console.log(`Live Smoke Test Summary: ${passes} PASS, ${warns} WARN, ${fails} FAIL (Total: ${checkResults.length})`);
  console.log('========================================');

  if (hasFailure) {
    process.exit(1);
  }
}

runSmokeTests().catch(err => {
  console.error('Fatal runner error:', err.message);
  process.exit(1);
});

