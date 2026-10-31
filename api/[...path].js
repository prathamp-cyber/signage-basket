/**
 * Signage Basket — Consolidated Serverless API Router
 * Single catch-all function handling Public, Auth, and Admin routes.
 */
const { ObjectId } = require('mongodb');
const { getDb } = require('./_lib/db');
const {
  parseBody,
  sendJson,
  getClientIp,
  slugify,
  isValidSlug,
  normalizeIndianPhone,
  isValidIndianPhone,
  isValidEmail,
  isValidRating,
  isValidImageUrl,
  checkRateLimit
} = require('./_lib/util');
const {
  signToken,
  createAuthCookie,
  createClearAuthCookie,
  hashPassword,
  verifyPassword,
  getStoredPasswordHash,
  checkCsrf,
  requireAuth
} = require('./_lib/auth');

function toIdQuery(id) {
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  }
  return { _id: id };
}

module.exports = async function handler(req, res) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const method = (req.method || 'GET').toUpperCase();
  const searchParams = parsedUrl.searchParams;

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return res.end();
  }

  const isPublicGet = method === 'GET' && (pathname.startsWith('/api/public') || pathname === '/api/sitemap' || pathname === '/api/sitemap.xml');
  if (isPublicGet) {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  try {
    const db = await getDb();

    // ==========================================
    // 1. PUBLIC ROUTES
    // ==========================================

    // GET /api/public/catalog
    if (pathname === '/api/public/catalog' && method === 'GET') {
      const items = await db.collection('designs')
        .find({ status: 'published' })
        .sort({ category: 1, order: 1, name: 1 })
        .toArray();
      return sendJson(res, 200, { ok: true, items });
    }

    // GET /api/public/projects
    if (pathname === '/api/public/projects' && method === 'GET') {
      const items = await db.collection('projects')
        .find({ status: 'published' })
        .sort({ order: 1, createdAt: -1 })
        .toArray();
      return sendJson(res, 200, { ok: true, items });
    }

    // GET /api/public/reviews
    if (pathname === '/api/public/reviews' && method === 'GET') {
      const items = await db.collection('reviews')
        .find({ status: 'published' })
        .sort({ createdAt: -1 })
        .toArray();
      return sendJson(res, 200, { ok: true, items });
    }

    // GET /api/public/settings
    if (pathname === '/api/public/settings' && method === 'GET') {
      const settingsDoc = await db.collection('settings').findOne({ _id: 'global' });
      const publicSettings = {
        phone: settingsDoc?.phone || '+91 98250 00000',
        whatsapp: settingsDoc?.whatsapp || '919825000000',
        email: settingsDoc?.email || 'hello@signagebasket.in',
        address: settingsDoc?.address || 'Gandhidham, Kutch, Gujarat, India',
        hours: settingsDoc?.hours || 'Mon – Sat: 9:30 AM – 7:30 PM',
        instagram: settingsDoc?.instagram || 'https://instagram.com/signagebasket',
        facebook: settingsDoc?.facebook || 'https://facebook.com/signagebasket',
        youtube: settingsDoc?.youtube || 'https://youtube.com/@signagebasket'
      };
      return sendJson(res, 200, { ok: true, settings: publicSettings });
    }

    // POST /api/public/enquiry
    if (pathname === '/api/public/enquiry' && method === 'POST') {
      const ip = getClientIp(req);
      const allowed = await checkRateLimit(db, `enquiry:${ip}`, 6, 3600);
      if (!allowed) {
        return sendJson(res, 429, { ok: false, error: 'Too many enquiry requests. Please try again after some time.' });
      }

      const body = await parseBody(req);

      // Honeypot check
      if (body.website && String(body.website).trim() !== '') {
        return sendJson(res, 200, { ok: true });
      }

      const name = String(body.name || '').trim();
      const rawPhone = String(body.phone || '').trim();
      const email = String(body.email || '').trim();
      const city = String(body.city || '').trim().slice(0, 100);
      const message = String(body.message || '').trim().slice(0, 1000);

      if (name.length < 2 || name.length > 80) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid name (2 to 80 characters).' });
      }

      if (!isValidIndianPhone(rawPhone)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid 10-digit Indian phone number.' });
      }

      if (email && !isValidEmail(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }

      const enquiryDoc = {
        source: String(body.source || 'website').slice(0, 50),
        name,
        phone: normalizeIndianPhone(rawPhone),
        email: email.slice(0, 100),
        city,
        message,
        design: body.design && typeof body.design === 'object' ? {
          slug: String(body.design.slug || '').slice(0, 80),
          name: String(body.design.name || '').slice(0, 120),
          category: String(body.design.category || '').slice(0, 60)
        } : null,
        details: body.details && typeof body.details === 'object' ? body.details : {},
        status: 'new',
        seen: false,
        notes: '',
        createdAt: new Date()
      };

      await db.collection('enquiries').insertOne(enquiryDoc);
      return sendJson(res, 200, { ok: true });
    }

    // GET /api/sitemap or /api/sitemap.xml
    if ((pathname === '/api/sitemap' || pathname === '/api/sitemap.xml') && method === 'GET') {
      const baseUrl = (process.env.SITE_URL || 'https://www.signagebasket.in').replace(/\/+$/, '');
      const staticPages = [
        '/',
        '/collection',
        '/our-work',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms',
        '/shipping-installation'
      ];
      const categoryPages = [
        '/house-nameplates',
        '/led-glow-signs',
        '/3d-letter-signs',
        '/acrylic-office-boards',
        '/wall-branding'
      ];

      const designs = await db.collection('designs')
        .find({ status: 'published' }, { projection: { slug: 1, updatedAt: 1, createdAt: 1 } })
        .toArray();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      const nowIso = new Date().toISOString().split('T')[0];

      for (const p of staticPages) {
        xml += `  <url><loc>${baseUrl}${p}</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      }
      for (const c of categoryPages) {
        xml += `  <url><loc>${baseUrl}${c}</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
      }
      for (const d of designs) {
        const lastmodDate = d.updatedAt || d.createdAt || new Date();
        const iso = new Date(lastmodDate).toISOString().split('T')[0];
        xml += `  <url><loc>${baseUrl}/design/${d.slug}</loc><lastmod>${iso}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
      }
      xml += '</urlset>';

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.end(xml);
    }

    // ==========================================
    // 2. AUTHENTICATION ROUTES
    // ==========================================

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      if (!checkCsrf(req)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden request.' });
      }

      const ip = getClientIp(req);
      const allowed = await checkRateLimit(db, `login:${ip}`, 5, 900); // 5 attempts per 15 min
      if (!allowed) {
        return sendJson(res, 429, { ok: false, error: 'Too many login attempts. Please try again in 15 minutes.' });
      }

      const body = await parseBody(req);
      const usernameInput = String(body.username || '').trim();
      const passwordInput = String(body.password || '');

      const expectedUser = process.env.ADMIN_USERNAME || 'admin';
      const expectedHash = await getStoredPasswordHash(db);

      const isUserMatch = usernameInput.length === expectedUser.length && usernameInput === expectedUser;
      const isPassMatch = verifyPassword(passwordInput, expectedHash);

      if (!isUserMatch || !isPassMatch) {
        return sendJson(res, 401, { ok: false, error: 'Incorrect username or password' });
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const token = signToken({
        sub: expectedUser,
        iat: nowSec,
        exp: nowSec + 43200 // 12 hours
      });

      res.setHeader('Set-Cookie', createAuthCookie(token));
      return sendJson(res, 200, { ok: true, user: { username: expectedUser } });
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      if (!checkCsrf(req)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden request.' });
      }
      res.setHeader('Set-Cookie', createClearAuthCookie());
      return sendJson(res, 200, { ok: true });
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      try {
        const payload = requireAuth(req);
        return sendJson(res, 200, { ok: true, user: { username: payload.sub } });
      } catch (err) {
        return sendJson(res, 401, { ok: false, error: err.message || 'Unauthorized' });
      }
    }

    // POST /api/auth/change-password
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      if (!checkCsrf(req)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden request.' });
      }
      let payload;
      try {
        payload = requireAuth(req);
      } catch (err) {
        return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const currentPass = String(body.current || '');
      const nextPass = String(body.next || '');

      if (nextPass.length < 10) {
        return sendJson(res, 400, { ok: false, error: 'New password must be at least 10 characters long.' });
      }

      const currentHash = await getStoredPasswordHash(db);
      if (!verifyPassword(currentPass, currentHash)) {
        return sendJson(res, 400, { ok: false, error: 'Current password is incorrect.' });
      }

      const newHash = hashPassword(nextPass);
      await db.collection('admin').updateOne(
        { _id: 'credentials' },
        { $set: { passwordHash: newHash, updatedAt: new Date(), updatedBy: payload.sub } },
        { upsert: true }
      );

      return sendJson(res, 200, { ok: true });
    }

    // ==========================================
    // 3. ADMIN ROUTES (All require Auth & CSRF)
    // ==========================================
    if (pathname.startsWith('/api/admin')) {
      if (!checkCsrf(req)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden request: invalid CSRF origin or header.' });
      }

      try {
        requireAuth(req);
      } catch (err) {
        return sendJson(res, 401, { ok: false, error: 'Authentication required.' });
      }

      // ------------------------------------------
      // DESIGNS
      // ------------------------------------------
      if (pathname === '/api/admin/designs' && method === 'GET') {
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const q = (searchParams.get('q') || '').trim();

        const filter = {};
        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;
        if (q) {
          filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { slug: { $regex: q, $options: 'i' } },
            { material: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } }
          ];
        }

        const items = await db.collection('designs')
          .find(filter)
          .sort({ order: 1, createdAt: -1 })
          .toArray();
        return sendJson(res, 200, { ok: true, items });
      }

      if (pathname === '/api/admin/designs' && method === 'POST') {
        const body = await parseBody(req);
        const name = String(body.name || '').trim();
        let slug = String(body.slug || '').trim();
        if (!slug) slug = slugify(name);

        if (!isValidSlug(slug)) {
          return sendJson(res, 400, { ok: false, error: 'Slug must be 2-80 characters and contain only lowercase letters, numbers, and hyphens.' });
        }

        const validCategories = ['home-nameplates', 'glow-signs', '3d-letters', 'office-boards', 'wall-branding'];
        if (!validCategories.includes(body.category)) {
          return sendJson(res, 400, { ok: false, error: 'Please select a valid category.' });
        }

        const existing = await db.collection('designs').findOne({ slug });
        if (existing) {
          return sendJson(res, 409, { ok: false, error: `A design with the slug "${slug}" already exists.` });
        }

        const doc = {
          slug,
          category: body.category,
          name: name.slice(0, 150),
          material: String(body.material || '').slice(0, 100),
          tags: Array.isArray(body.tags) ? body.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : [],
          desc: String(body.desc || '').slice(0, 400),
          finishes: Array.isArray(body.finishes) ? body.finishes.map(f => String(f).trim()).filter(Boolean) : [],
          sizes: Array.isArray(body.sizes) ? body.sizes.map(s => String(s).trim()).filter(Boolean) : [],
          price: body.price !== null && body.price !== '' && !isNaN(Number(body.price)) ? Number(body.price) : null,
          images: Array.isArray(body.images) ? body.images.map(img => ({
            url: String(img.url || ''),
            alt: String(img.alt || '').slice(0, 150)
          })) : [],
          plate: body.plate && typeof body.plate === 'object' ? body.plate : null,
          status: body.status === 'published' ? 'published' : 'draft',
          featured: Boolean(body.featured),
          order: Number.isInteger(Number(body.order)) ? Number(body.order) : 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('designs').insertOne(doc);
        return sendJson(res, 201, { ok: true, item: { ...doc, _id: result.insertedId } });
      }

      if (pathname === '/api/admin/designs/import' && method === 'POST') {
        const body = await parseBody(req);
        const rawItems = Array.isArray(body.items) ? body.items : [];
        if (rawItems.length === 0) {
          return sendJson(res, 200, { ok: true, imported: 0, skipped: 0 });
        }

        const slugs = rawItems.map(i => i.slug).filter(Boolean);
        const existingDocs = await db.collection('designs').find({ slug: { $in: slugs } }, { projection: { slug: 1 } }).toArray();
        const existingSet = new Set(existingDocs.map(d => d.slug));

        const toInsert = [];
        let skipped = 0;

        for (const it of rawItems) {
          if (!it.slug || existingSet.has(it.slug)) {
            skipped++;
            continue;
          }
          toInsert.push({
            slug: it.slug,
            category: it.category || 'home-nameplates',
            name: it.name || it.slug,
            material: it.material || '',
            tags: Array.isArray(it.tags) ? it.tags : [],
            desc: String(it.desc || '').slice(0, 400),
            finishes: Array.isArray(it.finishes) ? it.finishes : [],
            sizes: Array.isArray(it.sizes) ? it.sizes : [],
            price: it.price !== null && it.price !== '' && !isNaN(Number(it.price)) ? Number(it.price) : null,
            images: Array.isArray(it.images) ? it.images : [],
            plate: it.plate || null,
            status: it.status || 'published',
            featured: Boolean(it.featured),
            order: Number.isInteger(it.order) ? it.order : 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        if (toInsert.length > 0) {
          await db.collection('designs').insertMany(toInsert);
        }

        return sendJson(res, 200, { ok: true, imported: toInsert.length, skipped });
      }

      const designMatch = pathname.match(/^\/api\/admin\/designs\/([a-zA-Z0-9_-]+)(?:\/duplicate)?$/);
      if (designMatch) {
        const designId = designMatch[1];
        const isDuplicate = pathname.endsWith('/duplicate');

        if (isDuplicate && method === 'POST') {
          const original = await db.collection('designs').findOne(toIdQuery(designId));
          if (!original) {
            return sendJson(res, 404, { ok: false, error: 'Original design not found.' });
          }

          let newSlug = `${original.slug}-copy`;
          let counter = 1;
          while (await db.collection('designs').findOne({ slug: newSlug })) {
            counter++;
            newSlug = `${original.slug}-copy-${counter}`;
          }

          const copyDoc = {
            ...original,
            _id: undefined,
            name: `${original.name} (Copy)`,
            slug: newSlug,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          delete copyDoc._id;

          const result = await db.collection('designs').insertOne(copyDoc);
          return sendJson(res, 201, { ok: true, item: { ...copyDoc, _id: result.insertedId } });
        }

        if (method === 'GET') {
          const item = await db.collection('designs').findOne(toIdQuery(designId));
          if (!item) return sendJson(res, 404, { ok: false, error: 'Design not found.' });
          return sendJson(res, 200, { ok: true, item });
        }

        if (method === 'PUT') {
          const body = await parseBody(req);
          const name = String(body.name || '').trim();
          let slug = String(body.slug || '').trim();
          if (!slug) slug = slugify(name);

          if (!isValidSlug(slug)) {
            return sendJson(res, 400, { ok: false, error: 'Slug must be 2-80 characters and contain only lowercase letters, numbers, and hyphens.' });
          }

          const existingWithSlug = await db.collection('designs').findOne({
            slug,
            _id: { $ne: ObjectId.isValid(designId) ? new ObjectId(designId) : designId }
          });
          if (existingWithSlug) {
            return sendJson(res, 409, { ok: false, error: `Slug "${slug}" is already in use by another design.` });
          }

          const updateFields = {
            slug,
            category: body.category,
            name: name.slice(0, 150),
            material: String(body.material || '').slice(0, 100),
            tags: Array.isArray(body.tags) ? body.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : [],
            desc: String(body.desc || '').slice(0, 400),
            finishes: Array.isArray(body.finishes) ? body.finishes.map(f => String(f).trim()).filter(Boolean) : [],
            sizes: Array.isArray(body.sizes) ? body.sizes.map(s => String(s).trim()).filter(Boolean) : [],
            price: body.price !== null && body.price !== '' && !isNaN(Number(body.price)) ? Number(body.price) : null,
            images: Array.isArray(body.images) ? body.images.map(img => ({
              url: String(img.url || ''),
              alt: String(img.alt || '').slice(0, 150)
            })) : [],
            plate: body.plate && typeof body.plate === 'object' ? body.plate : null,
            status: body.status === 'published' ? 'published' : 'draft',
            featured: Boolean(body.featured),
            order: Number.isInteger(Number(body.order)) ? Number(body.order) : 0,
            updatedAt: new Date()
          };

          const result = await db.collection('designs').updateOne(
            toIdQuery(designId),
            { $set: updateFields }
          );

          if (result.matchedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Design not found to update.' });
          }
          return sendJson(res, 200, { ok: true, item: { _id: designId, ...updateFields } });
        }

        if (method === 'DELETE') {
          const result = await db.collection('designs').deleteOne(toIdQuery(designId));
          if (result.deletedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Design not found.' });
          }
          return sendJson(res, 200, { ok: true });
        }
      }

      // ------------------------------------------
      // PROJECTS
      // ------------------------------------------
      if (pathname === '/api/admin/projects' && method === 'GET') {
        const items = await db.collection('projects')
          .find({})
          .sort({ order: 1, createdAt: -1 })
          .toArray();
        return sendJson(res, 200, { ok: true, items });
      }

      if (pathname === '/api/admin/projects' && method === 'POST') {
        const body = await parseBody(req);
        const title = String(body.title || '').trim();
        if (!title) {
          return sendJson(res, 400, { ok: false, error: 'Title is required for project.' });
        }

        const validTypes = ['Glow Sign', 'Nameplate', 'Office & Interiors', 'Board', 'Other'];
        const projectDoc = {
          title: title.slice(0, 150),
          type: validTypes.includes(body.type) ? body.type : 'Other',
          location: String(body.location || '').slice(0, 100),
          description: String(body.description || '').slice(0, 1000),
          images: Array.isArray(body.images) ? body.images.map(img => ({
            url: String(img.url || ''),
            alt: String(img.alt || '').slice(0, 150)
          })) : [],
          status: body.status === 'published' ? 'published' : 'draft',
          order: Number.isInteger(Number(body.order)) ? Number(body.order) : 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('projects').insertOne(projectDoc);
        return sendJson(res, 201, { ok: true, item: { ...projectDoc, _id: result.insertedId } });
      }

      if (pathname === '/api/admin/projects/reorder' && method === 'PUT') {
        const body = await parseBody(req);
        const ids = Array.isArray(body.ids) ? body.ids : [];
        const bulkOps = ids.map((id, index) => ({
          updateOne: {
            filter: toIdQuery(id),
            update: { $set: { order: index, updatedAt: new Date() } }
          }
        }));

        if (bulkOps.length > 0) {
          await db.collection('projects').bulkWrite(bulkOps);
        }
        return sendJson(res, 200, { ok: true });
      }

      const projectMatch = pathname.match(/^\/api\/admin\/projects\/([a-zA-Z0-9_-]+)$/);
      if (projectMatch) {
        const projectId = projectMatch[1];

        if (method === 'PUT') {
          const body = await parseBody(req);
          const title = String(body.title || '').trim();
          if (!title) {
            return sendJson(res, 400, { ok: false, error: 'Title is required.' });
          }

          const validTypes = ['Glow Sign', 'Nameplate', 'Office & Interiors', 'Board', 'Other'];
          const updateFields = {
            title: title.slice(0, 150),
            type: validTypes.includes(body.type) ? body.type : 'Other',
            location: String(body.location || '').slice(0, 100),
            description: String(body.description || '').slice(0, 1000),
            images: Array.isArray(body.images) ? body.images.map(img => ({
              url: String(img.url || ''),
              alt: String(img.alt || '').slice(0, 150)
            })) : [],
            status: body.status === 'published' ? 'published' : 'draft',
            order: Number.isInteger(Number(body.order)) ? Number(body.order) : 0,
            updatedAt: new Date()
          };

          const result = await db.collection('projects').updateOne(toIdQuery(projectId), { $set: updateFields });
          if (result.matchedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Project not found.' });
          }
          return sendJson(res, 200, { ok: true, item: { _id: projectId, ...updateFields } });
        }

        if (method === 'DELETE') {
          const result = await db.collection('projects').deleteOne(toIdQuery(projectId));
          if (result.deletedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Project not found.' });
          }
          return sendJson(res, 200, { ok: true });
        }
      }

      // ------------------------------------------
      // REVIEWS
      // ------------------------------------------
      if (pathname === '/api/admin/reviews' && method === 'GET') {
        const items = await db.collection('reviews').find({}).sort({ createdAt: -1 }).toArray();
        return sendJson(res, 200, { ok: true, items });
      }

      if (pathname === '/api/admin/reviews' && method === 'POST') {
        const body = await parseBody(req);
        const name = String(body.name || '').trim();
        const text = String(body.text || '').trim();

        if (!name || name.length > 100) {
          return sendJson(res, 400, { ok: false, error: 'Please enter a reviewer name.' });
        }
        if (!text || text.length > 600) {
          return sendJson(res, 400, { ok: false, error: 'Review text is required (max 600 characters).' });
        }
        if (!isValidRating(body.rating)) {
          return sendJson(res, 400, { ok: false, error: 'Rating must be an integer between 1 and 5.' });
        }

        const reviewDoc = {
          name,
          text,
          rating: Number(body.rating),
          project: String(body.project || '').slice(0, 120),
          designSlug: String(body.designSlug || '').slice(0, 80),
          status: body.status === 'published' ? 'published' : 'draft',
          createdAt: new Date()
        };

        const result = await db.collection('reviews').insertOne(reviewDoc);
        return sendJson(res, 201, { ok: true, item: { ...reviewDoc, _id: result.insertedId } });
      }

      const reviewMatch = pathname.match(/^\/api\/admin\/reviews\/([a-zA-Z0-9_-]+)$/);
      if (reviewMatch) {
        const reviewId = reviewMatch[1];

        if (method === 'PUT') {
          const body = await parseBody(req);
          const name = String(body.name || '').trim();
          const text = String(body.text || '').trim();

          if (!name || name.length > 100) {
            return sendJson(res, 400, { ok: false, error: 'Please enter a reviewer name.' });
          }
          if (!text || text.length > 600) {
            return sendJson(res, 400, { ok: false, error: 'Review text is required (max 600 characters).' });
          }
          if (!isValidRating(body.rating)) {
            return sendJson(res, 400, { ok: false, error: 'Rating must be an integer between 1 and 5.' });
          }

          const updateFields = {
            name,
            text,
            rating: Number(body.rating),
            project: String(body.project || '').slice(0, 120),
            designSlug: String(body.designSlug || '').slice(0, 80),
            status: body.status === 'published' ? 'published' : 'draft',
            updatedAt: new Date()
          };

          const result = await db.collection('reviews').updateOne(toIdQuery(reviewId), { $set: updateFields });
          if (result.matchedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Review not found.' });
          }
          return sendJson(res, 200, { ok: true, item: { _id: reviewId, ...updateFields } });
        }

        if (method === 'DELETE') {
          const result = await db.collection('reviews').deleteOne(toIdQuery(reviewId));
          if (result.deletedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Review not found.' });
          }
          return sendJson(res, 200, { ok: true });
        }
      }

      // ------------------------------------------
      // ENQUIRIES
      // ------------------------------------------
      if (pathname === '/api/admin/enquiries' && method === 'GET') {
        const status = searchParams.get('status');
        const q = (searchParams.get('q') || '').trim();
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = 100;

        const filter = {};
        if (status && status !== 'all') {
          filter.status = status;
        }
        if (q) {
          filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } },
            { 'design.name': { $regex: q, $options: 'i' } },
            { 'design.slug': { $regex: q, $options: 'i' } }
          ];
        }

        const [items, countsArray] = await Promise.all([
          db.collection('enquiries')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray(),
          db.collection('enquiries').aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]).toArray()
        ]);

        const counts = { all: 0, new: 0, contacted: 0, quoted: 0, won: 0, closed: 0 };
        for (const c of countsArray) {
          if (counts[c._id] !== undefined) {
            counts[c._id] = c.count;
          }
          counts.all += c.count;
        }

        return sendJson(res, 200, { ok: true, items, counts, page, limit });
      }

      if (pathname === '/api/admin/enquiries' && method === 'PATCH') {
        // Bulk update
        const body = await parseBody(req);
        const ids = Array.isArray(body.ids) ? body.ids : [];
        const newStatus = String(body.status || '').trim();
        const validStatuses = ['new', 'contacted', 'quoted', 'won', 'closed'];

        if (!validStatuses.includes(newStatus)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid enquiry status.' });
        }

        const objectIds = ids.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
        const result = await db.collection('enquiries').updateMany(
          { _id: { $in: objectIds } },
          { $set: { status: newStatus, updatedAt: new Date() } }
        );

        return sendJson(res, 200, { ok: true, modifiedCount: result.modifiedCount });
      }

      if (pathname === '/api/admin/enquiries' && method === 'DELETE') {
        // Bulk delete
        const body = await parseBody(req);
        const ids = Array.isArray(body.ids) ? body.ids : [];
        const objectIds = ids.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
        const result = await db.collection('enquiries').deleteMany({ _id: { $in: objectIds } });
        return sendJson(res, 200, { ok: true, deletedCount: result.deletedCount });
      }

      const enquiryMatch = pathname.match(/^\/api\/admin\/enquiries\/([a-zA-Z0-9_-]+)$/);
      if (enquiryMatch) {
        const enquiryId = enquiryMatch[1];

        if (method === 'PATCH') {
          const body = await parseBody(req);
          const update = { updatedAt: new Date() };

          if (body.status !== undefined) {
            const validStatuses = ['new', 'contacted', 'quoted', 'won', 'closed'];
            if (!validStatuses.includes(body.status)) {
              return sendJson(res, 400, { ok: false, error: 'Invalid status.' });
            }
            update.status = body.status;
          }

          if (body.notes !== undefined) {
            update.notes = String(body.notes || '').slice(0, 2000);
          }

          if (body.seen !== undefined) {
            update.seen = Boolean(body.seen);
          }

          const result = await db.collection('enquiries').updateOne(toIdQuery(enquiryId), { $set: update });
          if (result.matchedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Enquiry not found.' });
          }
          return sendJson(res, 200, { ok: true });
        }

        if (method === 'DELETE') {
          const result = await db.collection('enquiries').deleteOne(toIdQuery(enquiryId));
          if (result.deletedCount === 0) {
            return sendJson(res, 404, { ok: false, error: 'Enquiry not found.' });
          }
          return sendJson(res, 200, { ok: true });
        }
      }

      // ------------------------------------------
      // SETTINGS
      // ------------------------------------------
      if (pathname === '/api/admin/settings' && method === 'GET') {
        const doc = await db.collection('settings').findOne({ _id: 'global' });
        return sendJson(res, 200, { ok: true, settings: doc || {} });
      }

      if (pathname === '/api/admin/settings' && method === 'PUT') {
        const body = await parseBody(req);

        const phone = String(body.phone || '').trim();
        const whatsapp = String(body.whatsapp || '').replace(/\D/g, '');
        const email = String(body.email || '').trim();
        const address = String(body.address || '').trim().slice(0, 300);
        const hours = String(body.hours || '').trim().slice(0, 150);
        const instagram = String(body.instagram || '').trim().slice(0, 200);
        const facebook = String(body.facebook || '').trim().slice(0, 200);
        const youtube = String(body.youtube || '').trim().slice(0, 200);

        if (phone && !isValidIndianPhone(phone)) {
          return sendJson(res, 400, { ok: false, error: 'Phone must be a valid 10-digit Indian number.' });
        }
        if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) {
          return sendJson(res, 400, { ok: false, error: 'WhatsApp number must be digits with country code (e.g. 919825000000).' });
        }
        if (email && !isValidEmail(email)) {
          return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
        }

        const settingsDoc = {
          phone,
          whatsapp,
          email,
          address,
          hours,
          instagram,
          facebook,
          youtube,
          updatedAt: new Date()
        };

        await db.collection('settings').updateOne(
          { _id: 'global' },
          { $set: settingsDoc },
          { upsert: true }
        );

        return sendJson(res, 200, { ok: true, settings: settingsDoc });
      }

      // ------------------------------------------
      // MEDIA (Vercel Blob)
      // ------------------------------------------
      if (pathname === '/api/admin/media' && method === 'POST') {
        const body = await parseBody(req);
        const { filename, contentType, dataBase64 } = body;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(contentType)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
        }

        if (!dataBase64 || typeof dataBase64 !== 'string') {
          return sendJson(res, 400, { ok: false, error: 'Missing image data.' });
        }

        const buffer = Buffer.from(dataBase64, 'base64');
        if (buffer.length > 3 * 1024 * 1024) {
          return sendJson(res, 400, { ok: false, error: 'Image file size exceeds 3 MB limit.' });
        }

        const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
        const ext = extMap[contentType] || '.jpg';
        const rand = Math.random().toString(36).substring(2, 9);
        const blobPath = `uploads/${Date.now()}-${rand}${ext}`;

        const { put } = await import('@vercel/blob');
        const blob = await put(blobPath, buffer, {
          access: 'public',
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        return sendJson(res, 200, { ok: true, url: blob.url });
      }

      if (pathname === '/api/admin/media' && method === 'GET') {
        const { list } = await import('@vercel/blob');
        const result = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
        const blobs = (result.blobs || [])
          .map(b => ({ url: b.url, size: b.size, uploadedAt: b.uploadedAt, pathname: b.pathname }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        return sendJson(res, 200, { ok: true, blobs });
      }

      if (pathname === '/api/admin/media' && method === 'DELETE') {
        const body = await parseBody(req);
        const { url } = body;
        if (!url || typeof url !== 'string' || !isValidImageUrl(url)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid Blob URL.' });
        }

        const { del } = await import('@vercel/blob');
        await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        return sendJson(res, 200, { ok: true });
      }

      // ------------------------------------------
      // STATS
      // ------------------------------------------
      if (pathname === '/api/admin/stats' && method === 'GET') {
        const [
          newEnquiries,
          totalEnquiries,
          designsPublished,
          designsDraft,
          projects,
          reviews,
          byCategoryArray
        ] = await Promise.all([
          db.collection('enquiries').countDocuments({ status: 'new' }),
          db.collection('enquiries').countDocuments({}),
          db.collection('designs').countDocuments({ status: 'published' }),
          db.collection('designs').countDocuments({ status: 'draft' }),
          db.collection('projects').countDocuments({}),
          db.collection('reviews').countDocuments({}),
          db.collection('designs').aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ]).toArray()
        ]);

        const byCategory = {};
        for (const c of byCategoryArray) {
          if (c._id) byCategory[c._id] = c.count;
        }

        return sendJson(res, 200, {
          ok: true,
          stats: {
            newEnquiries,
            totalEnquiries,
            designsPublished,
            designsDraft,
            projects,
            reviews,
            byCategory
          }
        });
      }

      // ------------------------------------------
      // BACKUP EXPORT
      // ------------------------------------------
      if (pathname === '/api/admin/export' && method === 'GET') {
        const [designs, projects, reviews, enquiries, settings] = await Promise.all([
          db.collection('designs').find({}).toArray(),
          db.collection('projects').find({}).toArray(),
          db.collection('reviews').find({}).toArray(),
          db.collection('enquiries').find({}).toArray(),
          db.collection('settings').find({ _id: { $ne: 'credentials' } }).toArray()
        ]);

        const exportData = {
          exportedAt: new Date().toISOString(),
          site: 'Signage Basket',
          counts: {
            designs: designs.length,
            projects: projects.length,
            reviews: reviews.length,
            enquiries: enquiries.length
          },
          designs,
          projects,
          reviews,
          enquiries,
          settings
        };

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="signage-basket-backup-${new Date().toISOString().slice(0, 10)}.json"`);
        return res.end(JSON.stringify(exportData, null, 2));
      }
    }

    // 404 handler
    return sendJson(res, 404, { ok: false, error: 'Endpoint not found.' });
  } catch (err) {
    console.error('Unhandled server error:', err);
    return sendJson(res, err.status || 500, {
      ok: false,
      error: err.message && err.status ? err.message : 'Internal Server Error'
    });
  }
};
