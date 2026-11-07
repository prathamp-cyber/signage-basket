/**
 * Signage Basket — Popular Designs & Product Catalog
 * Renders home page popular designs grid from SBData.catalog().
 */

window.SIGNAGE_PRODUCTS = [
  {
    name: "Backlit Logo Sign",
    category: "Glow Signs",
    img: "/assets/images/mock-glow-sign.jpg",
    alt: "Sample backlit LED glow sign design by Signage Basket",
    price: null,
    badge: "Popular",
    slug: "backlit-logo-sign"
  },
  {
    name: "Raised 3D Logo Letters",
    category: "3D Letters",
    img: "/assets/images/mock-3d-letters.jpg",
    alt: "Sample raised 3D logo letters design by Signage Basket",
    price: null,
    badge: "Popular",
    slug: "raised-3d-logo-letters"
  },
  {
    name: "Villa Name Plate",
    category: "Home Nameplates",
    img: "/assets/images/mock-home-nameplate.jpg",
    alt: "Sample brass home nameplate design by Signage Basket",
    price: null,
    badge: "Popular",
    slug: "villa-name-plate"
  },
  {
    name: "Office Name Board",
    category: "Office Boards",
    img: "/assets/images/mock-office-board.jpg",
    alt: "Sample acrylic office name board design by Signage Basket",
    price: null,
    badge: "Popular",
    slug: "office-name-board"
  },
  {
    name: "Acrylic Info Board",
    category: "Office Boards",
    img: "/assets/images/mock-acrylic-board.jpg",
    alt: "Sample black acrylic directory board design by Signage Basket",
    price: null,
    badge: "Popular",
    slug: "acrylic-info-board"
  },
  {
    name: "Reception Wall Branding",
    category: "Interior Branding",
    img: "/assets/images/mock-reception-wall.jpg",
    alt: "Sample 3D logo reception wall branding design by Signage Basket",
    price: null,
    badge: null,
    slug: "reception-wall-branding"
  },
  {
    name: "Wall of Fame Panel",
    category: "Interior Branding",
    img: "/assets/images/mock-wall-panel.jpg",
    alt: "Sample wall of fame display panel design by Signage Basket",
    price: null,
    badge: null,
    slug: "wall-of-fame-panel"
  },
  {
    name: "Studio Logo Wall",
    category: "3D Letters",
    img: "/assets/images/mock-studio-wall.jpg",
    alt: "Sample studio logo wall lettering design by Signage Basket",
    price: null,
    badge: null,
    slug: "studio-logo-wall"
  },
  {
    name: "Facade Glow Sign",
    category: "Glow Signs",
    img: "/assets/images/mock-facade-night.jpg",
    alt: "Sample building facade glow sign design by Signage Basket",
    price: null,
    badge: null,
    slug: "facade-glow-sign"
  },
  {
    name: "Company Info Board",
    category: "Office Boards",
    img: "/assets/images/mock-steel-board.jpg",
    alt: "Sample brushed steel company info board design by Signage Basket",
    price: null,
    badge: null,
    slug: "company-info-board"
  }
];

function renderPopularDesigns() {
  const container = document.getElementById("popularDesignsGrid");
  if (!container) return;

  const catalog = (window.SBData && window.SBData.catalog)
    ? window.SBData.catalog()
    : (window.CATALOG || {});

  const allItems = [];
  for (const catKey in catalog) {
    const cat = catalog[catKey];
    if (cat && Array.isArray(cat.items)) {
      for (const it of cat.items) {
        allItems.push(Object.assign({ categoryTitle: cat.title }, it));
      }
    }
  }

  let selected = [];
  const featured = allItems.filter((it) => it.featured);
  if (featured.length >= 4) {
    selected = featured;
  } else if (allItems.length > 0) {
    selected = allItems;
  } else {
    selected = window.SIGNAGE_PRODUCTS || [];
  }

  const itemsToRender = selected.slice(0, 8);

  const html = itemsToRender.map((item) => {
    const priceText = (typeof item.price === "number" && item.price > 0)
      ? `From ₹${item.price.toLocaleString("en-IN")}`
      : (item.price ? `From ₹${item.price}` : "Price on request");

    const isFeatured = item.featured || item.badge === "Popular";
    const badgeHtml = isFeatured
      ? `<span class="product-badge">Popular</span>`
      : "";

    const safeName = (item.name || "").replace(/"/g, "&quot;");
    const hasImages = Array.isArray(item.images) && item.images.length > 0;

    let mediaHtml = "";
    if (hasImages) {
      const firstImg = item.images[0];
      const src = typeof firstImg === "string" ? firstImg : firstImg.url;
      const alt = (typeof firstImg === "object" && firstImg.alt) ? firstImg.alt : `Sample ${item.name} design by Signage Basket`;
      mediaHtml = `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" width="500" height="500" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';if(!this.parentElement.querySelector('.img-fallback-surface')){const f=document.createElement('div');f.className='img-fallback-surface';f.textContent='${safeName}';this.parentElement.appendChild(f);}">`;
    } else if (item.plate && window.renderPlate) {
      mediaHtml = window.renderPlate(item.plate);
    } else if (item.img) {
      const altText = item.alt || `Sample ${item.name} design by Signage Basket`;
      mediaHtml = `<img src="${item.img}" alt="${altText.replace(/"/g, '&quot;')}" width="500" height="500" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';if(!this.parentElement.querySelector('.img-fallback-surface')){const f=document.createElement('div');f.className='img-fallback-surface';f.textContent='${safeName}';this.parentElement.appendChild(f);}">`;
    } else {
      mediaHtml = `<div class="img-fallback-surface" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--muted);">${safeName}</div>`;
    }

    const itemUrl = item.slug ? `/design/${encodeURIComponent(item.slug)}` : "/collection";

    return `
      <a href="${itemUrl}" class="product-card reveal-up" title="View ${safeName} design in Gandhidham, Gujarat">
        <div class="product-img-wrap" style="aspect-ratio:1/1;">
          ${mediaHtml}
          ${badgeHtml}
        </div>
        <div class="product-meta">
          <h3 class="product-name">${item.name}</h3>
          <div class="product-price">${priceText}</div>
        </div>
      </a>
    `;
  }).join("");

  container.innerHTML = html;
  if (window.autoFitPlates) window.autoFitPlates(container);
}

window.renderPopularDesigns = renderPopularDesigns;

if (window.SBData && window.SBData.ready) {
  window.SBData.ready.then(renderPopularDesigns);
}

document.addEventListener("DOMContentLoaded", renderPopularDesigns);
