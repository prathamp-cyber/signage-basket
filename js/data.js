/**
 * Signage Basket — Central Data Layer & API Connector
 * Exposes window.SBData and window.SB
 * High-reliability SWR (Stale-While-Revalidate), real-time BroadcastChannel sync,
 * schema normalization, and cold-start fallback recovery.
 */
(function () {
  const CACHE_KEY = "sb_cache_public_v1";
  const CACHE_TTL = 60 * 1000; // 60 seconds

  let _catalogItems = null;
  let _projects = null;
  let _reviews = null;
  let _settings = null;
  let _lastDataSignature = "";

  const isFreshParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fresh") === "1";

  // Category canonical names and aliases
  const CATEGORY_ALIASES = {
    "house-nameplates": "home-nameplates",
    "nameplates": "home-nameplates",
    "nameplate": "home-nameplates",
    "led-glow-signs": "glow-signs",
    "glow-sign": "glow-signs",
    "glow-signs": "glow-signs",
    "3d-letter-signs": "3d-letters",
    "3d-letter": "3d-letters",
    "acrylic-office-boards": "office-boards",
    "office-board": "office-boards",
    "office-boards": "office-boards",
    "interior-wall-branding": "wall-branding",
    "wall-branding": "wall-branding"
  };

  function normalizeCategoryKey(key) {
    if (!key) return "home-nameplates";
    const cleaned = String(key).trim().toLowerCase();
    return CATEGORY_ALIASES[cleaned] || cleaned;
  }

  function normalizeImages(rawImages, singleImage, defaultAlt) {
    let images = [];
    if (Array.isArray(rawImages)) {
      images = rawImages.map(img => {
        if (!img) return null;
        if (typeof img === "string") return { url: img, alt: defaultAlt || "" };
        if (typeof img === "object" && img.url) {
          return { url: String(img.url), alt: String(img.alt || defaultAlt || "") };
        }
        return null;
      }).filter(Boolean);
    } else if (typeof rawImages === "string" && rawImages.trim()) {
      images = [{ url: rawImages.trim(), alt: defaultAlt || "" }];
    } else if (singleImage) {
      if (typeof singleImage === "string" && singleImage.trim()) {
        images = [{ url: singleImage.trim(), alt: defaultAlt || "" }];
      } else if (typeof singleImage === "object" && singleImage.url) {
        images = [{ url: String(singleImage.url), alt: String(singleImage.alt || defaultAlt || "") }];
      }
    }
    return images;
  }

  function computeSignature(cat, proj, rev, set) {
    try {
      return JSON.stringify({
        c: cat ? cat.map(x => [x._id, x.slug, x.name, x.order, x.status, x.featured, x.price, (x.images && x.images.length)]) : null,
        p: proj ? proj.map(x => [x._id, x.title, x.order, x.status, (x.images && x.images.length)]) : null,
        r: rev ? rev.map(x => [x._id, x.rating, x.name, x.text, x.status]) : null,
        s: set ? [set.phone, set.whatsapp, set.email, set.address, set.updatedAt] : null
      });
    } catch (_) {
      return "";
    }
  }

  // Fetch with timeout and automatic retry
  async function fetchWithRetry(url, timeoutMs = 8000, retries = 1, backoffMs = 1000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
      try {
        const res = await fetch(url, controller ? { signal: controller.signal } : {});
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
      } catch (err) {
        if (timer) clearTimeout(timer);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
    return null;
  }

  function readCache() {
    if (isFreshParam) return null;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && typeof data.ts === "number" && (Date.now() - data.ts) < CACHE_TTL) {
        return data;
      }
    } catch (_) {}
    return null;
  }

  function writeCache(data) {
    if (isFreshParam) return;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        catalog: data.catalog || null,
        projects: data.projects || null,
        reviews: data.reviews || null,
        settings: data.settings || null
      }));
    } catch (_) {}
  }

  // Active page re-renderer
  function triggerRerender() {
    try {
      if (window.SB && typeof window.SB.applySettings === "function") {
        window.SB.applySettings();
      }
      if (typeof window.initBrowse === "function" && document.getElementById("catalogGrid")) {
        window.initBrowse();
      }
      if (typeof window.renderProductPage === "function" && (document.getElementById("productTitle") || document.getElementById("productApp") || document.querySelector(".product-gallery-wrap"))) {
        window.renderProductPage();
      }
      if (typeof window.renderWorkPage === "function" && document.getElementById("galleryGrid")) {
        window.renderWorkPage();
      }
      if (typeof window.renderPopularDesigns === "function" && document.getElementById("popularDesignsGrid")) {
        window.renderPopularDesigns();
      }
      if (typeof window.populateInstallationsStrip === "function" && document.getElementById("installationsStrip")) {
        window.populateInstallationsStrip();
      }
      if (typeof window.populateAboutWorkStrip === "function" && document.querySelector(".about-work-strip")) {
        window.populateAboutWorkStrip();
      }
      if (typeof window.renderReviews === "function" && document.getElementById("reviewsSection")) {
        window.renderReviews();
      }
      window.dispatchEvent(new CustomEvent("sb:datasync", { detail: { source: SBData.source } }));
    } catch (err) {
      console.warn("[SBData] Re-render error:", err);
    }
  }

  // Core fetch routine
  async function fetchPublicData({ forceFresh = false, timeoutMs = 8000, retries = 1 } = {}) {
    const freshQuery = (forceFresh || isFreshParam) ? `?fresh=1&t=${Date.now()}` : "";
    const [catRes, projRes, revRes, setRes] = await Promise.all([
      fetchWithRetry(`/api/public/catalog${freshQuery}`, timeoutMs, retries, 1000),
      fetchWithRetry(`/api/public/projects${freshQuery}`, timeoutMs, retries, 1000),
      fetchWithRetry(`/api/public/reviews${freshQuery}`, timeoutMs, retries, 1000),
      fetchWithRetry(`/api/public/settings${freshQuery}`, timeoutMs, retries, 1000)
    ]);

    const hasAny = Boolean(
      (catRes && catRes.ok) ||
      (projRes && projRes.ok) ||
      (revRes && revRes.ok) ||
      (setRes && setRes.ok)
    );

    if (!hasAny) {
      return { success: false, changed: false };
    }

    const nextCatalog = (catRes && catRes.ok && Array.isArray(catRes.items)) ? catRes.items : _catalogItems;
    const nextProjects = (projRes && projRes.ok && Array.isArray(projRes.items)) ? projRes.items : _projects;
    const nextReviews = (revRes && revRes.ok && Array.isArray(revRes.items)) ? revRes.items : _reviews;
    const nextSettings = (setRes && setRes.ok && setRes.settings) ? setRes.settings : _settings;

    const newSignature = computeSignature(nextCatalog, nextProjects, nextReviews, nextSettings);
    const changed = Boolean(newSignature && newSignature !== _lastDataSignature);

    _catalogItems = nextCatalog;
    _projects = nextProjects;
    _reviews = nextReviews;
    _settings = nextSettings;
    _lastDataSignature = newSignature;

    writeCache({
      catalog: _catalogItems,
      projects: _projects,
      reviews: _reviews,
      settings: _settings
    });

    return { success: true, changed };
  }

  // Background cold-start recovery polling
  let _recoveryTimer = null;
  function startColdStartRecovery() {
    if (_recoveryTimer) return;
    let attempts = 0;
    const maxAttempts = 6;
    _recoveryTimer = setInterval(async () => {
      attempts++;
      try {
        const { success } = await fetchPublicData({ forceFresh: true, timeoutMs: 5000, retries: 0 });
        if (success) {
          clearInterval(_recoveryTimer);
          _recoveryTimer = null;
          SBData.source = "live";
          console.info("[SBData] Live connection established; DOM hot-swapped.");
          triggerRerender();
        }
      } catch (_) {}
      if (attempts >= maxAttempts) {
        clearInterval(_recoveryTimer);
        _recoveryTimer = null;
      }
    }, 3500);
  }

  // Initial loader
  const readyPromise = (async function initData() {
    const cached = readCache();
    if (cached) {
      if (Array.isArray(cached.catalog)) _catalogItems = cached.catalog;
      if (Array.isArray(cached.projects)) _projects = cached.projects;
      if (Array.isArray(cached.reviews))  _reviews = cached.reviews;
      if (cached.settings && typeof cached.settings === "object") _settings = cached.settings;
      _lastDataSignature = computeSignature(_catalogItems, _projects, _reviews, _settings);
      SBData.source = "live";

      // SWR: Trigger non-blocking background revalidation
      setTimeout(async () => {
        try {
          const { success, changed } = await fetchPublicData({ forceFresh: false, timeoutMs: 6000, retries: 1 });
          if (success) {
            SBData.source = "live";
            if (changed) {
              triggerRerender();
            }
          }
        } catch (_) {}
      }, 50);
      return;
    }

    // No cache: fetch live with 8000ms timeout and 1 retry
    try {
      const { success } = await fetchPublicData({ forceFresh: isFreshParam, timeoutMs: 8000, retries: 1 });
      if (success) {
        SBData.source = "live";
      } else {
        console.warn("[SBData] Live API timeout, serving static fallback");
        SBData.source = "fallback";
        startColdStartRecovery();
      }
    } catch (err) {
      console.warn("[SBData] Live API timeout, serving static fallback");
      SBData.source = "fallback";
      startColdStartRecovery();
    }
  })();

  const SBData = {
    ready: readyPromise,
    source: "fallback", // 'live' | 'fallback'

    catalog() {
      const staticCatalog = window.CATALOG || {};
      if (!_catalogItems || !_catalogItems.length) {
        return staticCatalog;
      }

      // Group published API items by normalized category
      const apiByCat = {};
      for (const it of _catalogItems) {
        if (it.status && it.status !== "published") continue;
        const catKey = normalizeCategoryKey(it.category);
        if (!apiByCat[catKey]) apiByCat[catKey] = [];
        apiByCat[catKey].push(it);
      }

      const out = {};
      for (const catKey in staticCatalog) {
        const staticCat = staticCatalog[catKey];
        out[catKey] = Object.assign({}, staticCat);

        const apiItems = apiByCat[catKey] || [];
        if (apiItems.length > 0) {
          const staticMap = {};
          if (Array.isArray(staticCat.items)) {
            for (const s of staticCat.items) {
              if (s.slug) staticMap[s.slug] = s;
            }
          }

          out[catKey].items = apiItems.map((apiIt) => {
            const item = Object.assign({}, apiIt);
            const staticItem = staticMap[item.slug];

            // Normalize fields
            item.category = catKey;
            item.name = item.name || (staticItem ? staticItem.name : "Custom Sign");
            item.material = String(item.material || (staticItem ? staticItem.material : ""));
            item.desc = item.desc || (staticItem ? staticItem.desc : "");
            item.featured = Boolean(item.featured);
            item.status = item.status || "published";
            item.price = (item.price !== null && item.price !== undefined && !isNaN(Number(item.price))) ? Number(item.price) : null;
            item.tags = Array.isArray(item.tags) ? item.tags : (staticItem && staticItem.tags ? staticItem.tags : []);
            item.finishes = Array.isArray(item.finishes) ? item.finishes : (staticItem && staticItem.finishes ? staticItem.finishes : []);
            item.sizes = Array.isArray(item.sizes) ? item.sizes : (staticItem && staticItem.sizes ? staticItem.sizes : []);

            // Normalize images
            const imgs = normalizeImages(item.images, item.image, item.name);
            if (imgs.length > 0) {
              item.images = imgs;
              item.image = imgs[0].url;
            } else if (staticItem && staticItem.images) {
              item.images = normalizeImages(staticItem.images, null, item.name);
              item.image = item.images[0]?.url || "";
            } else {
              item.images = [];
              item.image = "";
            }

            // Plate fallback
            if (!item.plate && staticItem && staticItem.plate) {
              item.plate = staticItem.plate;
            }

            return item;
          });
        } else {
          out[catKey].items = staticCat.items || [];
        }
      }

      // Add alias lookups so catalog['house-nameplates'] resolves to catalog['home-nameplates']
      for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
        if (out[canonical] && !out[alias]) {
          out[alias] = out[canonical];
        }
      }

      return out;
    },

    findDesign(slug) {
      if (!slug) return null;
      const clean = String(slug).trim().toLowerCase();
      const cat = this.catalog();
      for (const catKey in cat) {
        const c = cat[catKey];
        if (c && Array.isArray(c.items)) {
          const found = c.items.find((it) => it.slug && it.slug.toLowerCase() === clean);
          if (found) return { item: found, category: c, categoryKey: catKey };
        }
      }
      return null;
    },

    projects() {
      if (_projects && _projects.length > 0) {
        return _projects
          .filter(p => !p.status || p.status === "published")
          .map((p) => {
            const imgs = normalizeImages(p.images, p.image, p.title);
            return {
              ...p,
              title: p.title || "Custom Signage Project",
              type: p.type || "Custom Work",
              location: p.location || "Gandhidham, Gujarat",
              description: p.description || "",
              images: imgs,
              img: imgs[0]?.url || "",
              alt: imgs[0]?.alt || p.title || "",
              status: p.status || "published"
            };
          });
      }
      return window.SIGNAGE_PROJECTS || window.WORK_PROJECTS || [];
    },

    reviews() {
      if (_reviews && _reviews.length > 0) {
        return _reviews
          .filter(r => !r.status || r.status === "published")
          .map((r) => ({
            ...r,
            name: r.name || "Verified Client",
            text: r.text || "",
            rating: Number(r.rating) || 5,
            project: r.project || "",
            location: r.location || "",
            status: r.status || "published"
          }));
      }
      return window.SIGNAGE_REVIEWS || window.REVIEWS || [];
    },

    settings() {
      const base = Object.assign({}, window.SIGNAGE_CONFIG || window.SITE_CONFIG || {});
      if (_settings && typeof _settings === "object") {
        if (_settings.phone) {
          base.phone = _settings.phone;
          base.phoneRaw = String(_settings.phone).replace(/\D/g, "");
        }
        if (_settings.whatsapp) {
          base.whatsapp = _settings.whatsapp;
          base.whatsappRaw = String(_settings.whatsapp).replace(/\D/g, "");
        }
        if (_settings.email) base.email = _settings.email;
        if (_settings.address) base.address = _settings.address;
        if (_settings.hours) base.hours = _settings.hours;
        if (_settings.instagram !== undefined) base.instagram = _settings.instagram;
        if (_settings.facebook !== undefined) base.facebook = _settings.facebook;
        if (_settings.youtube !== undefined) base.youtube = _settings.youtube;
      }
      return base;
    }
  };

  const SB = {
    async sendEnquiry(payload) {
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
        const opts = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
          signal: controller ? controller.signal : undefined
        };
        const res = await fetch("/api/public/enquiry", opts);
        if (timer) clearTimeout(timer);
        return await res.json().catch(() => ({ ok: false }));
      } catch (err) {
        console.warn("SB.sendEnquiry error:", err);
        return { ok: false };
      }
    },

    applySettings() {
      const cfg = SBData.settings();

      document.querySelectorAll("[data-sb]").forEach((el) => {
        const key = el.getAttribute("data-sb");
        if (!key) return;
        if (key === "phone" && cfg.phone) el.textContent = cfg.phone;
        else if (key === "whatsapp" && (cfg.whatsapp || cfg.whatsappRaw)) el.textContent = cfg.whatsapp || cfg.whatsappRaw;
        else if (key === "email" && cfg.email) el.textContent = cfg.email;
        else if (key === "address" && cfg.address) el.textContent = cfg.address;
        else if (key === "hours" && cfg.hours) el.textContent = cfg.hours;
        else if (key === "instagram" && cfg.instagram) el.textContent = cfg.instagram;
        else if (key === "facebook" && cfg.facebook) el.textContent = cfg.facebook;
        else if (key === "youtube" && cfg.youtube) el.textContent = cfg.youtube;
      });

      document.querySelectorAll("[data-sb-href]").forEach((el) => {
        const scheme = el.getAttribute("data-sb-href");
        if (!scheme) return;

        if (scheme === "tel") {
          const raw = cfg.phoneRaw || (cfg.phone ? String(cfg.phone).replace(/\D/g, "") : "");
          if (raw) el.href = `tel:+${raw}`;
        } else if (scheme === "whatsapp") {
          const raw = cfg.whatsappRaw || (cfg.whatsapp ? String(cfg.whatsapp).replace(/\D/g, "") : "919999999999");
          let textParam = "";
          try {
            const curHref = el.getAttribute("href") || "";
            if (curHref.includes("text=")) {
              const u = new URL(curHref, "https://wa.me");
              textParam = u.searchParams.get("text") || "";
            }
          } catch (_) {}
          if (!textParam && cfg.whatsappDefaultMsg) {
            textParam = cfg.whatsappDefaultMsg;
          }
          el.href = textParam ? `https://wa.me/${raw}?text=${encodeURIComponent(textParam)}` : `https://wa.me/${raw}`;
        } else if (scheme === "mailto") {
          if (cfg.email) el.href = `mailto:${cfg.email}`;
        } else if (scheme === "instagram") {
          if (cfg.instagram && cfg.instagram.trim()) {
            el.href = cfg.instagram.trim();
            el.style.display = "";
          } else {
            el.style.display = "none";
          }
        } else if (scheme === "facebook") {
          if (cfg.facebook && cfg.facebook.trim()) {
            el.href = cfg.facebook.trim();
            el.style.display = "";
          } else {
            el.style.display = "none";
          }
        } else if (scheme === "youtube") {
          if (cfg.youtube && cfg.youtube.trim()) {
            el.href = cfg.youtube.trim();
            el.style.display = "";
          } else {
            el.style.display = "none";
          }
        }
      });

      // Synchronize floating WhatsApp button
      const floatingWa = document.querySelector(".floating-whatsapp");
      if (floatingWa) {
        const raw = cfg.whatsappRaw || (cfg.whatsapp ? String(cfg.whatsapp).replace(/\D/g, "") : "919825000000");
        const msg = encodeURIComponent(cfg.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote.");
        floatingWa.href = `https://wa.me/${raw}?text=${msg}`;
      }

      // Synchronize header WhatsApp action button
      const headerWaBtn = document.querySelector(".header-wa-btn");
      if (headerWaBtn) {
        const raw = cfg.whatsappRaw || (cfg.whatsapp ? String(cfg.whatsapp).replace(/\D/g, "") : "919825000000");
        const msg = encodeURIComponent(cfg.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote.");
        headerWaBtn.href = `https://wa.me/${raw}?text=${msg}`;
      }
    }
  };

  // Delegated click handler to guarantee dynamic wa.me and tel: resolution at click time
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const cfg = SBData.settings();
      if (href.includes("wa.me/")) {
        const raw = cfg.whatsappRaw || (cfg.whatsapp ? String(cfg.whatsapp).replace(/\D/g, "") : "");
        if (raw) {
          try {
            const u = new URL(href, window.location.origin);
            const text = u.searchParams.get("text");
            a.href = text ? `https://wa.me/${raw}?text=${encodeURIComponent(text)}` : `https://wa.me/${raw}`;
          } catch (_) {}
        }
      } else if (href.startsWith("tel:")) {
        const raw = cfg.phoneRaw || (cfg.phone ? String(cfg.phone).replace(/\D/g, "") : "");
        if (raw) a.href = `tel:+${raw}`;
      }
    }, true);
  }

  // Cross-tab real-time sync with Admin mutations via BroadcastChannel
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel("sb_data_sync");
      bc.onmessage = async (evt) => {
        try {
          sessionStorage.removeItem(CACHE_KEY);
        } catch (_) {}
        const { success, changed } = await fetchPublicData({ forceFresh: true, timeoutMs: 6000, retries: 1 });
        if (success) {
          SBData.source = "live";
          triggerRerender();
        }
      };
    } catch (_) {}
  }

  window.SBData = SBData;
  window.SB = SB;

  // Hydration triggers
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      SB.applySettings();
    });
  } else {
    SB.applySettings();
  }

  SBData.ready.then(() => {
    SB.applySettings();
  });
})();
