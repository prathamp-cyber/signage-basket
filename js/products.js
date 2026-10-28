/**
 * Signage Basket — Popular Designs & Product Catalog
 * Data array at the top, easily editable.
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

// Helper to render Popular Designs grid
function renderPopularDesigns() {
  const container = document.getElementById("popularDesignsGrid");
  if (!container || !window.SIGNAGE_PRODUCTS) return;

  const html = window.SIGNAGE_PRODUCTS.map((item) => {
    const priceText = typeof item.price === "number" && item.price !== null
      ? `From ₹${item.price.toLocaleString("en-IN")}`
      : `Request a quote`;

    const badgeHtml = item.badge
      ? `<span class="product-badge">${item.badge}</span>`
      : "";

    const safeName = item.name.replace(/"/g, '&quot;');
    const altText = item.alt || `Sample ${item.name} design by Signage Basket`;

    return `
      <a href="/contact?design=${encodeURIComponent(item.slug)}" class="product-card reveal-up" title="Inquire about ${safeName} in Gandhidham, Gujarat">
        <div class="product-img-wrap" style="aspect-ratio:1/1;">
          <img src="${item.img}" alt="${altText}" width="500" height="500" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';if(!this.parentElement.querySelector('.img-fallback-surface')){const f=document.createElement('div');f.className='img-fallback-surface';f.textContent='${safeName}';this.parentElement.appendChild(f);}">
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
}

document.addEventListener("DOMContentLoaded", renderPopularDesigns);
