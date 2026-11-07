/**
 * Signage Basket — Generic Category Browse Controller
 * Handles data-driven category rendering, filter chips, GSAP animations & design modal.
 */

function initBrowse(categoryKey) {
  const catalog = (window.SBData && window.SBData.catalog) ? window.SBData.catalog() : (window.CATALOG || {});
  let catKey = categoryKey;

  // If no categoryKey provided, resolve from URL params or location.pathname
  if (!catKey) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCat = urlParams.get("cat") || urlParams.get("category");
    if (paramCat && catalog[paramCat]) {
      catKey = paramCat;
    }
  }

  if (!catKey) {
    const rawPath = decodeURIComponent(window.location.pathname || "").toLowerCase().replace(/\/+$/, "") || "/";
    const normalizedPath = rawPath.replace(/[\s_+]+/g, "-");

    // 1. Direct page match
    for (const key in catalog) {
      const catPage = (catalog[key].page || "").toLowerCase().replace(/\/+$/, "");
      if (catPage === rawPath || catPage === normalizedPath) {
        catKey = key;
        break;
      }
    }

    // 2. Fallback key or keyword match
    if (!catKey) {
      const pathPart = normalizedPath.replace(/^\//, "").replace(/\.html$/, "");
      if (catalog[pathPart]) {
        catKey = pathPart;
      } else if (pathPart.includes("nameplate") || pathPart.includes("house")) {
        catKey = "home-nameplates";
      } else if (pathPart.includes("glow") || pathPart.includes("led")) {
        catKey = "glow-signs";
      } else if (pathPart.includes("3d") || pathPart.includes("letter")) {
        catKey = "3d-letters";
      } else if (pathPart.includes("office") || pathPart.includes("acrylic")) {
        catKey = "office-boards";
      } else if (pathPart.includes("wall") || pathPart.includes("branding")) {
        catKey = "wall-branding";
      } else if (pathPart === "category") {
        catKey = "home-nameplates";
      }
    }
  }

  const category = catKey && catalog[catKey];
  const mainContent = document.getElementById("main-content");

  // Unknown path / category not found state
  if (!category) {
    document.title = "Category Not Found | Signage Basket";
    let noindexMeta = document.querySelector('meta[name="robots"]');
    if (!noindexMeta) {
      noindexMeta = document.createElement("meta");
      noindexMeta.name = "robots";
      document.head.appendChild(noindexMeta);
    }
    noindexMeta.content = "noindex";

    if (mainContent) {
      mainContent.innerHTML = `
        <section class="section-pad">
          <div class="page-container category-not-found" style="text-align:center;padding:4rem 1rem;">
            <h1>Category Not Found</h1>
            <p style="color:var(--muted);margin:1rem auto 2rem;max-width:540px;">The signage collection you are looking for does not exist or has been moved.</p>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
              <a href="/collection" class="btn btn-primary" title="Browse All Collections">
                <span>View All Collections</span>
                <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
              </a>
              <a href="/" class="btn btn-outline" title="Back to Home">
                <span>Back to Home</span>
              </a>
            </div>
          </div>
        </section>
      `;
    }
    return;
  }

  // Valid category found: remove noindex
  const noindexMeta = document.querySelector('meta[name="robots"][content*="noindex"]');
  if (noindexMeta) noindexMeta.remove();

  // Update document title, description, canonical, OG tags
  const pageTitle = `${category.title} Designs in Gandhidham, Gujarat | Signage Basket`;
  const pageDesc = category.intro || `Explore custom ${category.title.toLowerCase()} in Gandhidham, Gujarat. Crafted by Signage Basket.`;
  const pageUrl = `https://www.signagebasket.in${category.page}`;

  document.title = pageTitle;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", pageDesc);

  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.setAttribute("href", pageUrl);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", pageTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", pageDesc);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", pageUrl);

  // Update BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.signagebasket.in/" },
      { "@type": "ListItem", "position": 2, "name": "Collection", "item": "https://www.signagebasket.in/collection" },
      { "@type": "ListItem", "position": 3, "name": category.title, "item": pageUrl }
    ]
  };
  let breadcrumbScript = document.getElementById("breadcrumbLd");
  if (!breadcrumbScript) {
    breadcrumbScript = document.createElement("script");
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.id = "breadcrumbLd";
    document.head.appendChild(breadcrumbScript);
  }
  breadcrumbScript.textContent = JSON.stringify(breadcrumbLd);

  // Update ItemList JSON-LD
  const items = category.items || [];
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${category.title} Designs`,
    "description": pageDesc,
    "itemListElement": items.map((it, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": it.name,
      "url": `https://www.signagebasket.in/design/${encodeURIComponent(it.slug)}`
    }))
  };
  let itemListScript = document.getElementById("itemListLd");
  if (!itemListScript) {
    itemListScript = document.createElement("script");
    itemListScript.type = "application/ld+json";
    itemListScript.id = "itemListLd";
    document.head.appendChild(itemListScript);
  }
  itemListScript.textContent = JSON.stringify(itemListLd);

  // DOM Elements
  const breadcrumbCurrent = document.getElementById("catBreadcrumbCurrent");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = category.title;

  const eyebrowEl = document.getElementById("catEyebrow");
  if (eyebrowEl) eyebrowEl.textContent = category.eyebrow || category.title;

  const h1El = document.getElementById("catH1");
  if (h1El) h1El.textContent = category.h1 || `${category.title} Designs in Gandhidham, Gujarat`;

  const introEl = document.getElementById("catIntro");
  if (introEl) introEl.textContent = category.intro || "";

  // WhatsApp CTA
  const cfg = (window.SBData && window.SBData.settings) ? window.SBData.settings() : (window.SIGNAGE_CONFIG || {});
  const waBtn = document.getElementById("catalogWhatsAppBtn");
  if (waBtn && (cfg.whatsappRaw || cfg.phoneRaw)) {
    const rawNum = cfg.whatsappRaw || cfg.phoneRaw || "919999999999";
    const msg = encodeURIComponent(`Hi Signage Basket, I would like to inquire about ${category.title}.`);
    waBtn.href = `https://wa.me/${rawNum}?text=${msg}`;
  }

  // Filters Bar
  let filtersContainer = document.getElementById("catalogFilters");
  const catFilters = category.filters || [{ label: "All", tag: "all" }];
  let activeFilter = "all";
  let visibleItems = [...items];

  let filterBar = filtersContainer ? filtersContainer.closest(".filter-bar") : null;
  let resultCountEl = document.getElementById("catalogResultCount") || document.querySelector(".result-count");

  if (filtersContainer) {
    if (!filterBar) {
      filterBar = document.createElement("div");
      filterBar.className = "filter-bar";
      filtersContainer.parentNode.insertBefore(filterBar, filtersContainer);
      filterBar.appendChild(filtersContainer);

      resultCountEl = document.createElement("p");
      resultCountEl.className = "result-count";
      resultCountEl.id = "catalogResultCount";
      resultCountEl.setAttribute("aria-live", "polite");
      filterBar.appendChild(resultCountEl);
    }

    if (!filtersContainer.classList.contains("chips")) {
      filtersContainer.classList.add("chips");
    }
    filtersContainer.setAttribute("role", "tablist");

    filtersContainer.innerHTML = catFilters.map((f, idx) => `
      <button type="button" class="chip ${f.tag === activeFilter ? "active" : ""}" role="tab" aria-selected="${f.tag === activeFilter}" data-filter="${f.tag}">
        ${f.label}
      </button>
    `).join("");
  }

  function updateResultCount(count) {
    if (resultCountEl) {
      resultCountEl.textContent = `Showing ${count} ${count === 1 ? "design" : "designs"}`;
    }
  }

  updateResultCount(visibleItems.length);

  // Catalog Grid
  const grid = document.getElementById("catalogGrid");

  function renderGrid(filteredList) {
    if (!grid) return;
    grid.innerHTML = filteredList.map((item) => {
      const hasImages = Array.isArray(item.images) && item.images.length > 0;
      let mediaInner = "";
      if (hasImages) {
        const firstImg = item.images[0];
        const src = typeof firstImg === "string" ? firstImg : firstImg.url;
        const alt = (typeof firstImg === "object" && firstImg.alt) ? firstImg.alt : `${item.name} design by Signage Basket`;
        mediaInner = `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" width="500" height="500" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';">`;
      } else {
        mediaInner = window.renderPlate ? window.renderPlate(item.plate) : "";
      }

      const badgeHtml = item.featured
        ? `<span class="product-badge" style="position:absolute;top:10px;left:10px;z-index:2;">Popular</span>`
        : "";

      const priceText = (typeof item.price === "number" && item.price > 0)
        ? `From ₹${item.price.toLocaleString("en-IN")}`
        : (item.price ? `From ₹${item.price}` : "Price on request");

      return `
        <article class="catalog-card" data-slug="${item.slug}">
          <div class="catalog-card-media" style="position:relative;">
            <a href="/design/${encodeURIComponent(item.slug)}" class="catalog-media-link" aria-label="View ${item.name} details" style="display:block;color:inherit;text-decoration:none;width:100%;height:100%;">
              ${mediaInner}
            </a>
            ${badgeHtml}
            <button type="button" class="catalog-zoom-btn" data-slug="${item.slug}" aria-label="View ${item.name} larger">
              <span class="icon i-zoom-plus" aria-hidden="true"></span>
            </button>
          </div>
          <div class="catalog-card-info">
            <h2 class="catalog-card-name" data-slug="${item.slug}">
              <a href="/design/${encodeURIComponent(item.slug)}" style="color:inherit;text-decoration:none;">${item.name}</a>
            </h2>
            <div class="catalog-card-mat">${item.material}</div>
            <div class="catalog-card-price" style="font-size:0.9rem;font-weight:600;color:var(--accent);margin:0.25rem 0 0.75rem 0;">${priceText}</div>
            <a href="/contact?design=${encodeURIComponent(item.slug)}&type=${encodeURIComponent(catKey)}" class="btn btn-primary catalog-card-link" style="margin-top:auto;width:100%;justify-content:center;text-decoration:none;font-size:13px;padding:10px 16px;">
              <span>Request a Quote</span>
              <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
            </a>
          </div>
        </article>
      `;
    }).join("");

    if (window.autoFitPlates) {
      window.autoFitPlates(grid);
    }
  }

  renderGrid(visibleItems);

  // Filter interaction
  if (filtersContainer) {
    filtersContainer.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const tag = chip.getAttribute("data-filter");
      if (!tag || tag === activeFilter) return;

      activeFilter = tag;
      filtersContainer.querySelectorAll(".chip").forEach((c) => {
        const isActive = c.getAttribute("data-filter") === activeFilter;
        c.classList.toggle("active", isActive);
        c.setAttribute("aria-selected", isActive);
      });

      if (activeFilter === "all") {
        visibleItems = [...items];
      } else {
        visibleItems = items.filter((it) => Array.isArray(it.tags) && it.tags.includes(activeFilter));
      }

      updateResultCount(visibleItems.length);

      if (typeof gsap !== "undefined") {
        gsap.to(grid.children, {
          opacity: 0,
          scale: 0.96,
          duration: 0.18,
          stagger: 0.02,
          ease: "power2.in",
          onComplete: () => {
            renderGrid(visibleItems);
            gsap.fromTo(
              grid.children,
              { opacity: 0, scale: 0.96, y: 15 },
              { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }
            );
          }
        });
      } else {
        renderGrid(visibleItems);
      }
    });
  }

  // Delegate zoom button click to open viewer
  if (grid) {
    grid.addEventListener("click", (e) => {
      const zoomBtn = e.target.closest(".catalog-zoom-btn");
      if (zoomBtn) {
        e.preventDefault();
        e.stopPropagation();
        const slug = zoomBtn.getAttribute("data-slug");
        if (window.openViewer) {
          window.openViewer(slug);
        }
      }
    });
  }
}

window.initBrowse = initBrowse;

if (window.SBData && window.SBData.ready) {
  window.SBData.ready.then(() => {
    if (document.getElementById("catalogGrid")) {
      initBrowse();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("catalogGrid") && !window.browseInitialized) {
    window.browseInitialized = true;
    initBrowse();
  }
});
