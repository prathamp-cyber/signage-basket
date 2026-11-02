/**
 * Signage Basket — Central Data Layer & API Connector
 * Exposes window.SBData and window.SB
 */
(function () {
  const CACHE_KEY = "sb_cache_public_v1";
  const CACHE_TTL = 60 * 1000; // 60 seconds

  let _catalogItems = null;
  let _projects = null;
  let _reviews = null;
  let _settings = null;

  function fetchWithTimeout(url, ms = 3000) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), ms) : null;
    const opts = controller ? { signal: controller.signal } : {};
    return fetch(url, opts)
      .then((res) => {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        return null;
      });
  }

  function readCache() {
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

  const readyPromise = (async function initData() {
    const cached = readCache();
    if (cached) {
      if (Array.isArray(cached.catalog)) _catalogItems = cached.catalog;
      if (Array.isArray(cached.projects)) _projects = cached.projects;
      if (Array.isArray(cached.reviews))  _reviews = cached.reviews;
      if (cached.settings && typeof cached.settings === "object") _settings = cached.settings;
      return;
    }

    try {
      const [catRes, projRes, revRes, setRes] = await Promise.all([
        fetchWithTimeout("/api/public/catalog", 3000),
        fetchWithTimeout("/api/public/projects", 3000),
        fetchWithTimeout("/api/public/reviews", 3000),
        fetchWithTimeout("/api/public/settings", 3000)
      ]);

      if (catRes && catRes.ok && Array.isArray(catRes.items)) {
        _catalogItems = catRes.items;
      }
      if (projRes && projRes.ok && Array.isArray(projRes.items)) {
        _projects = projRes.items;
      }
      if (revRes && revRes.ok && Array.isArray(revRes.items)) {
        _reviews = revRes.items;
      }
      if (setRes && setRes.ok && setRes.settings) {
        _settings = setRes.settings;
      }

      writeCache({
        catalog: _catalogItems,
        projects: _projects,
        reviews: _reviews,
        settings: _settings
      });
    } catch (err) {
      console.warn("SBData initialization error:", err);
    }
  })();

  const SBData = {
    ready: readyPromise,

    catalog() {
      const staticCatalog = window.CATALOG || {};
      if (!_catalogItems || !_catalogItems.length) {
        return staticCatalog;
      }

      const apiByCat = {};
      for (const it of _catalogItems) {
        const catKey = it.category;
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
            if (!item.plate && staticMap[item.slug] && staticMap[item.slug].plate) {
              item.plate = staticMap[item.slug].plate;
            }
            return item;
          });
        } else {
          out[catKey].items = staticCat.items || [];
        }
      }

      return out;
    },

    projects() {
      if (_projects && _projects.length > 0) {
        return _projects;
      }
      return window.SIGNAGE_PROJECTS || [];
    },

    reviews() {
      if (_reviews && _reviews.length > 0) {
        return _reviews;
      }
      return window.SIGNAGE_REVIEWS || [];
    },

    settings() {
      const base = Object.assign({}, window.SIGNAGE_CONFIG || {});
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
        const res = await fetch("/api/public/enquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        });
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
    }
  };

  window.SBData = SBData;
  window.SB = SB;

  SBData.ready.then(() => {
    SB.applySettings();
  });
})();
