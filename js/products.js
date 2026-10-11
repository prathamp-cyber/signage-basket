/**
 * Signage Basket — Popular Designs & Product Catalog
 * Data array at the top, easily editable.
 */

window.SIGNAGE_PRODUCTS = [
  {
    name: "Backlit Logo Sign",
    category: "Glow Signs",
    img: "assets/images/work-singfuels.jpg",
    price: null,
    badge: "Popular",
    slug: "backlit-logo-sign"
  },
  {
    name: "Raised 3D Logo Letters",
    category: "3D Letters",
    img: "assets/images/work-shoolin.jpg",
    price: null,
    badge: "Popular",
    slug: "raised-3d-logo-letters"
  },
  {
    name: "Villa Name Plate",
    category: "Home Nameplates",
    img: "assets/images/work-mishvik.jpg",
    price: null,
    badge: "Popular",
    slug: "villa-name-plate"
  },
  {
    name: "Office Name Board",
    category: "Office Boards",
    img: "assets/images/work-dedipya.jpg",
    price: null,
    badge: "Popular",
    slug: "office-name-board"
  },
  {
    name: "Acrylic Info Board",
    category: "Office Boards",
    img: "assets/images/work-hermes.jpg",
    price: null,
    badge: "Popular",
    slug: "acrylic-info-board"
  },
  {
    name: "Reception Wall Branding",
    category: "Interior Branding",
    img: "assets/images/work-integrated.jpg",
    price: null,
    badge: null,
    slug: "reception-wall-branding"
  },
  {
    name: "Wall of Fame Panel",
    category: "Interior Branding",
    img: "assets/images/work-wall-of-fame.jpg",
    price: null,
    badge: null,
    slug: "wall-of-fame-panel"
  },
  {
    name: "Studio Logo Wall",
    category: "3D Letters",
    img: "assets/images/work-core-barbell.jpg",
    price: null,
    badge: null,
    slug: "studio-logo-wall"
  },
  {
    name: "Facade Glow Sign",
    category: "Glow Signs",
    img: "assets/images/work-elysian.jpg",
    price: null,
    badge: null,
    slug: "facade-glow-sign"
  },
  {
    name: "Company Info Board",
    category: "Office Boards",
    img: "assets/images/work-shoolin-board.jpg",
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

    return `
      <a href="contact.html?design=${encodeURIComponent(item.slug)}" class="product-card reveal-up" title="Inquire about ${item.name} in Gandhidham, Gujarat">
        <div class="product-img-wrap">
          <img src="${item.img}" alt="${item.name} made by Signage Basket" width="500" height="500" loading="lazy" decoding="async">
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
