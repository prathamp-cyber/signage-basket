/**
 * Signage Basket — Live Site Search (no network, no libraries)
 * Searches: products, collection categories, pages, FAQ questions.
 * Groups results: Designs / Collections / Pages.
 * Keyboard: arrow keys navigate, Enter opens, Esc closes.
 */

(function () {
  // --- Static search index ---
  const PRODUCTS_INDEX = (window.SIGNAGE_PRODUCTS || []).map((p) => ({
    type: "Designs",
    label: p.name,
    sub: p.category,
    url: `/contact?design=${encodeURIComponent(p.slug)}`
  }));

  const fallbackCatalogItems = [
    { name: "Hanging Brass Nameplate", material: "Brass finish", slug: "hanging-brass-nameplate" },
    { name: "Classic Brass Wall Plate", material: "Brass finish", slug: "classic-brass-wall-plate" },
    { name: "Round Brass House Number Plate", material: "Brass finish", slug: "round-brass-house-number-plate" },
    { name: "Oval Steel Nameplate", material: "Brushed steel finish", slug: "oval-steel-nameplate" },
    { name: "Laser-Cut Metal Name", material: "Metal cut-out letters", slug: "laser-cut-metal-name" },
    { name: "Modern Matte Black Plate", material: "Matte black", slug: "modern-matte-black-plate" },
    { name: "Round Black & Gold Plate", material: "Matte black with gold", slug: "round-black-gold-plate" },
    { name: "Walnut Wood Nameplate", material: "Wood finish", slug: "walnut-wood-nameplate" },
    { name: "White Marble Nameplate", material: "Marble finish", slug: "white-marble-nameplate" },
    { name: "LED Backlit Nameplate", material: "Backlit acrylic", slug: "led-backlit-nameplate" }
  ];

  const CATALOG_DESIGNS = (window.CATALOG && window.CATALOG["home-nameplates"] ? window.CATALOG["home-nameplates"].items : fallbackCatalogItems).map((item) => ({
    type: "Designs",
    label: item.name,
    sub: `${item.material} · House Nameplates`,
    url: `/design/${item.slug}`
  }));

  const COLLECTIONS_INDEX = [
    { type: "Collections", label: "Home Nameplates",       sub: "Custom house & villa nameplates",       url: "/house-nameplates" },
    { type: "Collections", label: "LED & Glow Signs",      sub: "Backlit commercial sign boards",        url: "/collection#glow-signs"       },
    { type: "Collections", label: "3D Letter Signs",       sub: "Raised acrylic & metal letters",        url: "/collection#3d-letters"        },
    { type: "Collections", label: "Acrylic Office Boards", sub: "Corporate directory & info boards",     url: "/collection#office-boards"     },
    { type: "Collections", label: "Interior Wall Branding",sub: "Lobby & gym feature wall installations",url: "/collection#wall-branding"     }
  ];

  const PAGES_INDEX = [
    { type: "Pages", label: "Home",             sub: "Signage Basket homepage",                  url: "/"                     },
    { type: "Pages", label: "House Nameplates", sub: "Browse custom house nameplate designs",    url: "/house-nameplates"     },
    { type: "Pages", label: "Collection",       sub: "Browse all signage products",              url: "/collection"                },
    { type: "Pages", label: "Our Work",         sub: "Portfolio of installed signs",             url: "/our-work"                  },
    { type: "Pages", label: "About",            sub: "About Signage Basket studio",              url: "/about"                     },
    { type: "Pages", label: "Contact",          sub: "Get a free 3D design preview & quote",     url: "/contact"                   },
    { type: "Pages", label: "FAQ",              sub: "Frequently asked questions",               url: "/collection#faq"            },
    { type: "Pages", label: "Privacy Policy",   sub: "How we handle your data",                  url: "/privacy-policy"            },
    { type: "Pages", label: "Terms of Service", sub: "Terms for custom made-to-order signs",     url: "/terms"                    },
    { type: "Pages", label: "Shipping & Installation", sub: "Delivery and installation details", url: "/shipping-installation"    },
    // FAQ questions (hard-coded anchors from collection.html)
    { type: "Pages", label: "Who is the best nameplate maker in Gandhidham?",     sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "Do you make LED glow sign boards in Kutch?",         sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "Can you make Gujarati or bilingual name plates?",    sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "Do you deliver nameplates across India?",            sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "What materials are available for house name plates?",sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "How long does a sign board take to make?",           sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "Do you install signage outside Gandhidham?",         sub: "FAQ",  url: "/collection#faq" },
    { type: "Pages", label: "Can you make 3D letter signs for offices?",          sub: "FAQ",  url: "/collection#faq" }
  ];

  const ALL_INDEX = [...CATALOG_DESIGNS, ...PRODUCTS_INDEX, ...COLLECTIONS_INDEX, ...PAGES_INDEX];

  function highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(re, "<mark>$1</mark>");
  }

  let resultsCache = [];
  let highlightedIdx = -1;

  window.runSiteSearch = function (query) {
    const resultsEl = document.getElementById("searchResults");
    if (!resultsEl) return;

    const q = (query || "").trim().toLowerCase();

    if (!q) {
      resultsEl.innerHTML = "";
      resultsCache = [];
      highlightedIdx = -1;
      return;
    }

    const matched = ALL_INDEX.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      (item.sub && item.sub.toLowerCase().includes(q))
    ).slice(0, 20);

    resultsCache = matched;
    highlightedIdx = -1;

    if (!matched.length) {
      const config = window.SIGNAGE_CONFIG || {};
      const waRaw  = config.whatsappRaw || "919999999999";
      const waMsg  = encodeURIComponent(`Hi Signage Basket, I searched for "${query}" on your website and couldn't find it. Can you help?`);
      resultsEl.innerHTML = `
        <p class="search-empty">
          No results for "<strong>${query}</strong>". 
          <a href="https://wa.me/${waRaw}?text=${waMsg}" target="_blank" rel="noopener">Ask us on WhatsApp</a>.
        </p>`;
      return;
    }

    // Group by type
    const groups = {};
    matched.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });

    let html = "";
    Object.entries(groups).forEach(([groupName, items]) => {
      html += `<div class="search-group-label">${groupName}</div>`;
      items.forEach((item, i) => {
        const globalIdx = matched.indexOf(item);
        html += `
          <a href="${item.url}" class="search-result-item" data-result-idx="${globalIdx}">
            <span>${highlight(item.label, query)}</span>
            ${item.sub ? `<small style="color:var(--muted);font-size:0.8rem;margin-left:auto;">${highlight(item.sub, query)}</small>` : ""}
          </a>`;
      });
    });

    resultsEl.innerHTML = html;
  };

  window.searchKeyNav = function (e) {
    const items = Array.from(document.querySelectorAll(".search-result-item"));
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedIdx = Math.max(highlightedIdx - 1, 0);
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault();
      items[highlightedIdx].click();
      return;
    } else {
      return;
    }

    items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIdx));
    if (items[highlightedIdx]) items[highlightedIdx].scrollIntoView({ block: "nearest" });
  };
})();
