# Signage Basket — Codebase Architecture & AI Context Reference

Use this reference whenever you prompt another AI (ChatGPT, Claude, Cursor, Gemini, etc.) to modify any element on this website.

---

## 1. Tech Stack & Non-Negotiables
- **Core:** Semantic HTML5, Vanilla CSS ([styles.css](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/css/styles.css)), and Vanilla ES6+ JavaScript.
- **No Build Tools:** No Vite, React, Webpack, Tailwind, or SCSS. Everything runs directly in the browser.
- **Shared Layout:** Header and Footer are **not** in HTML pages. They are dynamically injected by [layout.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/layout.js) into `#siteHeaderContainer` and `#siteFooterContainer`.
- **Global Config:** Studio contact info, addresses, and WhatsApp parameters are centralized in [config.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/config.js).

---

## 2. CSS Architecture & Design Tokens ([styles.css](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/css/styles.css))

### Colors & Variables
```css
:root {
  --bg: #ffffff;             /* Primary white background */
  --surface: #f4f4f4;        /* Soft grey container background */
  --surface-2: #eaeaea;      /* Image placeholders / nested grey */
  --ink: #111111;            /* Deep ink black for text & primary buttons */
  --text: #1c1c1c;           /* Primary body copy */
  --muted: #5f5f5f;          /* Secondary text, captions, subtitles */
  --line: #e4e4e4;           /* Subtle 1px dividing borders */
  --accent: #6b4a32;         /* Warm bronze accent for labels and highlights */
  --font-main: 'Josefin Sans', sans-serif;
  --font-preview-serif: 'Cormorant Garamond', serif;
  --font-preview-script: 'Great Vibes', cursive;
  --header-height: 88px;
}
```

### Icon System
Icons do not use raw SVG tags. They use CSS mask with `currentColor`:
```html
<span class="icon i-search" aria-hidden="true"></span>
<span class="icon i-whatsapp" aria-hidden="true"></span>
<span class="icon i-arrow-right" aria-hidden="true"></span>
<span class="icon i-menu" aria-hidden="true"></span>
<span class="icon i-close" aria-hidden="true"></span>
```

---

## 3. Navbar & Full-Bleed Hero Behavior

- **Home Page (`body.home-page` in [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html)):**
  - Header is `position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;`.
  - **Transparent State (`.site-header.is-over-hero`):** Active when `scrollY < 60px` and mobile drawer/search are closed. Header is transparent, height is 88px, text/icons/buttons turn white with subtle text-shadow, logo switches to `assets/logo/logo-wordmark-light.svg`.
  - **Solid State (Default / Scrolled):** Active when `scrollY >= 60px` OR when drawer/search are open. Header turns solid white, height shrinks to 72px (64px on mobile), bottom border `1px solid var(--line)`, soft drop shadow, dark logo `assets/logo/logo-wordmark.svg`.
- **Inner Pages (`collection.html`, `our-work.html`, `about.html`, `contact.html`):**
  - Header is solid white sticky with 1px border at all times.
- **Scroll Margin:** All anchor targets (`:target`, `[id]`) have `scroll-margin-top: var(--header-height, 88px)` to prevent fixed navbar overlap.

---

## 4. Key Interactive Elements & Selectors

| Component | Files Involved | Selectors & IDs | Description |
| :--- | :--- | :--- | :--- |
| **Hero Banner** | [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html), [styles.css](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/css/styles.css) | `.hero-section`, `.hero-bg-img`, `.hero-overlay`, `.hero-content` | Full-bleed 100svh hero with dual scrim gradient |
| **Live Preview** | [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html), [preview.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/preview.js) | `#previewPlate`, `#previewSurnameInput`, `#previewNamesInput`, `#previewRequestBtn` | Dynamic 3-panel plate visualizer (brass/steel/black, classic/modern/script, rectangle/oval/round) |
| **Live Preview Info** | [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html), [styles.css](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/css/styles.css) | `.preview-info-col`, `.preview-info-title` | Right-side panel containing only vertically centered "Live Preview" heading |
| **Popular Designs** | [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html), [products.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/products.js) | `#popularDesignsGrid`, `.product-card`, `.product-zoom-btn` | Rendered from product array with lightbox zoom trigger |
| **Installations Strip** | [index.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/index.html), [main.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/main.js) | `#installationsStrip`, `.strip-item`, `.prev-btn`, `.next-btn` | Horizontal drag/swipe installation showcase |
| **Work Gallery** | [our-work.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/our-work.html), [work.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/work.js) | `#galleryGrid`, `.filter-btn` | Real photo portfolio with category filtering |
| **Lightbox Modal** | [main.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/main.js) | `#lightboxModal`, `#lightboxImg`, `#lightboxTitle` | Fullscreen photo viewer with arrow navigation and Esc dismiss |
| **Search Overlay** | [layout.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/layout.js), [search.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/search.js) | `#searchOverlay`, `#searchInput`, `#searchResults` | Instant search modal filtering products and collections |
| **Contact Prefill** | [contact.html](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/contact.html), [main.js](file:///d:/My%20things/Sites/Signature%20Board/signage-basket/js/main.js) | `#contactForm`, `#details`, `#serviceType` | Parses URL query params (`?design=...&material=...`) into inquiry form |

---

## 5. Ready-to-Paste AI Prompt Template

Copy and paste this into any other AI before requesting changes:

```markdown
I am working on the "Signage Basket" website codebase. Here is the architecture context you must adhere to:

1. ARCHITECTURE & TECH STACK:
- Vanilla HTML5, Vanilla CSS (css/styles.css), and Vanilla JavaScript only.
- No React, no Tailwind, no SCSS, no build tools or package managers. Everything runs directly in the browser.
- The <header> and <footer> are NOT hardcoded in HTML files. They are injected at runtime by js/layout.js into #siteHeaderContainer and #siteFooterContainer.

2. DESIGN SYSTEM:
- Colors: --bg (#ffffff), --surface (#f4f4f4), --ink (#111111), --accent (#6b4a32), --line (#e4e4e4), --muted (#5f5f5f).
- Font: 'Josefin Sans' for primary UI, 'Cormorant Garamond' and 'Great Vibes' for preview accents.
- Icons: Rendered with CSS mask and currentColor (<span class="icon i-[name]" aria-hidden="true"></span>). Never insert raw inline SVGs into HTML.

3. HOME NAVBAR & HERO:
- index.html has <body id="top" class="home-page">.
- The navbar is fixed on the home page and alternates between .is-over-hero (transparent, white text/icons, light logo) and solid (white bg, dark logo, 72px height).
- The hero is full-bleed 100svh starting behind the fixed navbar.

4. INSTRUCTIONS FOR MY REQUEST:
[DESCRIBE WHAT YOU WANT TO CHANGE HERE]
```
