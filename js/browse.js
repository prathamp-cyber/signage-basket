/**
 * Signage Basket — Generic Category Browse Controller
 * Handles data-driven category rendering, filter chips, GSAP animations & design modal.
 */

function initBrowse(categoryKey) {
  const catalog = window.CATALOG || {};
  let catKey = categoryKey;

  // If no categoryKey provided, resolve from location.pathname
  if (!catKey) {
    const path = window.location.pathname.replace(/\/$/, "");
    for (const key in catalog) {
      if (catalog[key].page === path || catalog[key].page === path + "/") {
        catKey = key;
        break;
      }
    }
  }

  const category = catKey && catalog[catKey];
  const mainContent = document.getElementById("main-content");

  // Unknown path / category not found state
  if (!category) {
    document.title = "Category Not Found | Signage Basket";
    if (mainContent) {
      mainContent.innerHTML = `
        <section class="section-pad">
          <div class="page-container category-not-found">
            <h1>Category Not Found</h1>
            <p>The signage collection you are looking for does not exist or has been moved.</p>
            <a href="/collection" class="btn btn-primary">
              <span>View All Collections</span>
              <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
            </a>
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
  const cfg = window.SIGNAGE_CONFIG || {};
  const waBtn = document.getElementById("catalogWhatsAppBtn");
  if (waBtn && cfg.whatsappRaw) {
    const msg = encodeURIComponent(`Hi Signage Basket, I would like to inquire about ${category.title}.`);
    waBtn.href = `https://wa.me/${cfg.whatsappRaw}?text=${msg}`;
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

    filtersContainer.innerHTML = catFilters.map((f, i) => `
      <button type="button" class="chip filter-chip ${i === 0 ? "active is-active" : ""}" role="tab" aria-selected="${i === 0 ? "true" : "false"}" data-filter="${f.tag}">
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
      const plateHtml = window.renderPlate ? window.renderPlate(item.plate) : "";
      return `
        <article class="catalog-card" data-slug="${item.slug}">
          <div class="catalog-card-media">
            <a href="/design/${encodeURIComponent(item.slug)}" class="catalog-media-link" aria-label="View ${item.name} details" style="display:block;color:inherit;text-decoration:none;">
              ${plateHtml}
            </a>
            <button type="button" class="catalog-zoom-btn" data-slug="${item.slug}" aria-label="View ${item.name} larger">
              <span class="icon i-zoom-plus" aria-hidden="true"></span>
            </button>
          </div>
          <div class="catalog-card-info">
            <h2 class="catalog-card-name" data-slug="${item.slug}">
              <a href="/design/${encodeURIComponent(item.slug)}" style="color:inherit;text-decoration:none;">${item.name}</a>
            </h2>
            <div class="catalog-card-mat">${item.material}</div>
            <a href="/design/${encodeURIComponent(item.slug)}" class="catalog-card-link">
              <span>View details</span>
              <span class="icon i-arrow-right" aria-hidden="true"></span>
            </a>
          </div>
        </article>
      `;
    }).join("");

    if (window.autoFitPlates) window.autoFitPlates(grid);
  }

  // Initial Grid Render
  renderGrid(items);

  // Filter click handling with GSAP smooth transition
  if (filtersContainer) {
    filtersContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip, .filter-chip, .work-filter-btn");
      if (!btn) return;
      const filter = btn.getAttribute("data-filter");
      if (filter === activeFilter) return;

      filtersContainer.querySelectorAll(".chip, .filter-chip, .work-filter-btn").forEach((b) => {
        b.classList.remove("active", "is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active", "is-active");
      btn.setAttribute("aria-selected", "true");
      activeFilter = filter;

      visibleItems = filter === "all" ? items : items.filter((item) => (item.tags || []).includes(filter));
      updateResultCount(visibleItems.length);

      const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!prefersReduced && window.gsap && grid) {
        gsap.to(grid.children, {
          opacity: 0,
          scale: 0.96,
          duration: 0.2,
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
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("catalogGrid") && !window.browseInitialized) {
    window.browseInitialized = true;
    initBrowse();
  }
});
