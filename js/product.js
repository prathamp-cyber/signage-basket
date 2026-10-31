/**
 * Signage Basket — Product Detail Page Logic
 * Interactive gallery, customizer, live renderer, quote modal, mobile bar.
 */

(function () {
  try {
    const config = window.SIGNAGE_CONFIG || {
      brandName: "Signage Basket",
      city: "Gandhidham",
      whatsappRaw: "919999999999",
      SITE_URL: "https://www.signagebasket.in"
    };

    // 1. Resolve design slug from path or search params
    function getDesignSlug() {
      const pathParts = window.location.pathname.replace(/\/+$/, "").split("/");
      const lastSegment = pathParts[pathParts.length - 1] || "";
      if (pathParts.includes("design") && lastSegment && lastSegment !== "design") {
        return decodeURIComponent(lastSegment);
      }
      const params = new URLSearchParams(window.location.search);
      return params.get("slug") || params.get("design") || "";
    }

    const slug = getDesignSlug();

    // Look up slug across ALL CATALOG categories
    let item = null;
    let category = null;
    let categoryKey = null;

    if (window.CATALOG) {
      for (const catK in window.CATALOG) {
        const cat = window.CATALOG[catK];
        if (cat && Array.isArray(cat.items)) {
          const found = cat.items.find((p) => p.slug === slug);
          if (found) {
            item = found;
            category = cat;
            categoryKey = catK;
            break;
          }
        }
      }
    }

    const appContainer = document.getElementById("productApp");
    if (!appContainer) return;

    // 2. Unknown slug: Friendly "Design Not Found" state
    if (!item || !category) {
      document.title = "Design Not Found | Signage Basket";
      appContainer.innerHTML = `
        <div class="product-not-found">
          <h1>Design Not Found</h1>
          <p>We couldn't find the design you're looking for. Explore our full collection of handcrafted signage and nameplates made in Gandhidham.</p>
          <a href="/collection" class="btn btn-primary" title="Browse Collections">
            <span>Browse Collections</span>
            <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
          </a>
        </div>
      `;
      return;
    }

    // Category defaults fallback
    const catDefaults = category.defaults || {};
    const finishes = item.finishes || catDefaults.finishes || ["Default finish"];
    const sizes = item.sizes || catDefaults.sizes || ["Small", "Medium", "Large", "Custom size"];
    const weather = item.weather || catDefaults.weather || "Suitable for recommended installations. Tell us the location and we will advise.";
    const care = item.care || catDefaults.care || "Wipe with a soft dry or slightly damp cloth.";
    const install = item.install || catDefaults.install || "We install on site across Gandhidham, Kutch and Gujarat, or ship with mounting hardware.";
    const textLabel = item.textLabel || catDefaults.textLabel || "Text on your sign";

    const catSingular = category.title.endsWith("s") && !category.title.endsWith("ss") ? category.title.slice(0, -1) : category.title;

    // 3. Dynamic SEO before first paint
    const siteUrl = config.SITE_URL || "https://www.signagebasket.in";
    const canonicalUrl = `${siteUrl}/design/${item.slug}`;
    const pageTitle = `${item.name} | ${catSingular} in Gandhidham | Signage Basket`;
    const metaDesc = `${item.name} in ${item.material.toLowerCase()}, made to order in Gandhidham. Custom sizes, finishes and free design preview before we make it.`;

    document.title = pageTitle;

    function setMeta(nameOrProp, value, isProperty) {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    }

    setMeta("description", metaDesc, false);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", metaDesc, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:type", "product", true);
    setMeta("og:image", "/assets/images/hero.jpg", true);
    setMeta("twitter:card", "summary_large_image", false);
    setMeta("twitter:title", pageTitle, false);
    setMeta("twitter:description", metaDesc, false);
    setMeta("twitter:image", "/assets/images/hero.jpg", false);

    let canonicalEl = document.querySelector("link[rel='canonical']");
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    // JSON-LD Structured Data
    const jsonLdBreadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl + "/" },
        { "@type": "ListItem", "position": 2, "name": "Collection", "item": siteUrl + "/collection" },
        { "@type": "ListItem", "position": 3, "name": category.title, "item": siteUrl + category.page },
        { "@type": "ListItem", "position": 4, "name": item.name, "item": canonicalUrl }
      ]
    };

    const jsonLdProduct = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": item.name,
      "description": item.desc,
      "brand": {
        "@type": "Brand",
        "name": config.brandName || "Signage Basket"
      },
      "category": category.title,
      "url": canonicalUrl
    };

    const scriptBc = document.createElement("script");
    scriptBc.type = "application/ld+json";
    scriptBc.textContent = JSON.stringify(jsonLdBreadcrumbs);
    document.head.appendChild(scriptBc);

    const scriptProd = document.createElement("script");
    scriptProd.type = "application/ld+json";
    scriptProd.textContent = JSON.stringify(jsonLdProduct);
    document.head.appendChild(scriptProd);

    // 4. Customizer & Gallery State
    let selectedFinish = finishes[0];
    let selectedSize = sizes[0];
    let customLines = [...(item.plate && item.plate.lines ? item.plate.lines : [item.name])];
    let currentWallSize = "";
    let activeSlideIndex = 0;

    function buildWhatsAppUrl() {
      const waRaw = config.whatsappRaw || "919999999999";
      const textMsg = `Hi Signage Basket, I am interested in the "${item.name}" (${canonicalUrl}). Finish: ${selectedFinish}, Size: ${selectedSize}, Text: "${customLines.join(" / ")}"${currentWallSize ? `, Wall size: ${currentWallSize}` : ""}. Please share a free design preview and quote.`;
      return `https://wa.me/${waRaw}?text=${encodeURIComponent(textMsg)}`;
    }

    function buildTeamInquiryWhatsAppUrl() {
      const waRaw = config.whatsappRaw || "919999999999";
      const textMsg = `Hi Signage Basket, I need custom styling / font / layout for "${item.name}". Can your design team help?`;
      return `https://wa.me/${waRaw}?text=${encodeURIComponent(textMsg)}`;
    }

    // 5. Build Initial Page Structure
    const priceText = item.price ? `From ₹${item.price}` : "Price on request";

    appContainer.innerHTML = `
      <div class="product-page-section">
        <div class="page-container">
          <!-- Breadcrumb -->
          <nav class="product-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a> / 
            <a href="/collection">Collection</a> / 
            <a href="${category.page}">${category.title}</a> / 
            <span aria-current="page">${item.name}</span>
          </nav>

          <!-- 2 Columns Layout -->
          <div class="product-layout-grid">
            <!-- Left: Gallery -->
            <div class="product-gallery-wrap" id="galleryWrap">
              <div class="product-stage-container" id="stageContainer" title="Click to view larger">
                <div class="product-stage-slides" id="stageSlides"></div>
                <button type="button" class="gallery-nav-btn gallery-nav-prev" id="galleryPrevBtn" aria-label="Previous slide">
                  <span class="icon i-arrow-right" aria-hidden="true"></span>
                </button>
                <button type="button" class="gallery-nav-btn gallery-nav-next" id="galleryNextBtn" aria-label="Next slide">
                  <span class="icon i-arrow-right" aria-hidden="true"></span>
                </button>
                <div class="gallery-counter-badge" id="galleryCounter">1 / 4</div>
              </div>
              <div class="gallery-thumbs-row" id="thumbsRow"></div>
            </div>

            <!-- Right: Details & Customizer (Sticky on desktop) -->
            <div class="product-details-wrap">
              <a href="${category.page}" class="product-collection-eyebrow">Collection: ${category.title}</a>
              <h1 class="product-title">${item.name}</h1>
              <div class="product-material-sub">${item.material}</div>
              <div class="product-price-row">${priceText}</div>
              <p class="product-promise-note">Made to order in Gandhidham. Free design preview before we make it.</p>

              <!-- Customizer Form -->
              <div class="customizer-group">
                <div class="customizer-label">
                  <span>Finish</span>
                  <small style="color:var(--muted);font-weight:400;text-transform:none;" id="selectedFinishLabel">${selectedFinish}</small>
                </div>
                <div class="customizer-pills" id="finishPills">
                  ${finishes.map((f, i) => `
                    <button type="button" class="pill-btn ${i === 0 ? 'active' : ''}" data-finish="${f}">${f}</button>
                  `).join("")}
                </div>
              </div>

              <div class="customizer-group">
                <div class="customizer-label">
                  <span>Size</span>
                  <small style="color:var(--muted);font-weight:400;text-transform:none;" id="selectedSizeLabel">${selectedSize}</small>
                </div>
                <div class="customizer-pills" id="sizePills">
                  ${sizes.map((s, i) => `
                    <button type="button" class="pill-btn ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
                  `).join("")}
                </div>
              </div>

              <div class="customizer-group">
                <div class="customizer-label">${textLabel}</div>
                <div class="customizer-inputs-stack" id="lineInputsWrap">
                  ${customLines.map((line, idx) => `
                    <input type="text" class="customizer-text-input" data-line-idx="${idx}"
                      aria-label="Line ${idx + 1}" placeholder="Line ${idx + 1}" maxlength="28" value="${line}">
                  `).join("")}
                </div>
              </div>

              <div class="customizer-group">
                <div class="customizer-label">Your wall or surface size <span style="font-weight:400;color:var(--muted);text-transform:none;">(optional)</span></div>
                <input type="text" class="customizer-text-input" id="wallSizeInput" placeholder="e.g. 24 x 18 inches or wall width">
              </div>

              <!-- Primary Action Block -->
              <div class="product-action-block">
                <button type="button" class="btn btn-primary product-quote-cta" id="mainGetQuoteBtn">
                  <span>Get a Quote</span>
                  <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
                </button>
                <a href="${buildWhatsAppUrl()}" target="_blank" rel="noopener" class="product-whatsapp-sublink" id="productWaLink">
                  <span class="icon i-whatsapp" aria-hidden="true"></span>
                  <span>Prefer WhatsApp? Chat with us</span>
                </a>
              </div>

              <p class="product-desc-text">${item.desc}</p>

              <div class="product-custom-note">
                Need a different font, size or layout? 
                <a href="${buildTeamInquiryWhatsAppUrl()}" target="_blank" rel="noopener" id="teamWaLink">Message us on WhatsApp and our design team will help.</a>
              </div>

              <!-- Accordion -->
              <div class="product-accordion" id="productAccordion">
                <div class="accordion-item">
                  <button type="button" class="accordion-header" aria-expanded="false">
                    <span>Primary Material</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                  </button>
                  <div class="accordion-content">
                    <p>${item.material}. Precision crafted using high grade raw materials suitable for architectural signage.</p>
                  </div>
                </div>

                <div class="accordion-item">
                  <button type="button" class="accordion-header" aria-expanded="false">
                    <span>Sizes</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                  </button>
                  <div class="accordion-content">
                    <p>Made to your size. Choose a standard size above or specify custom dimensions.</p>
                  </div>
                </div>

                <div class="accordion-item">
                  <button type="button" class="accordion-header" aria-expanded="false">
                    <span>Durability &amp; Weather</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                  </button>
                  <div class="accordion-content">
                    <p>${weather}</p>
                  </div>
                </div>

                <div class="accordion-item">
                  <button type="button" class="accordion-header" aria-expanded="false">
                    <span>Care</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                  </button>
                  <div class="accordion-content">
                    <p>${care}</p>
                  </div>
                </div>

                <div class="accordion-item">
                  <button type="button" class="accordion-header" aria-expanded="false">
                    <span>Installation and delivery</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                  </button>
                  <div class="accordion-content">
                    <p>${install} <a href="/shipping-installation">See Shipping &amp; Installation</a>.</p>
                  </div>
                </div>
              </div>

              <!-- Share Button -->
              <div class="product-share-row">
                <button type="button" class="product-share-btn" id="shareBtn">
                  <span class="icon i-arrow-right" style="transform:rotate(-45deg);" aria-hidden="true"></span>
                  <span>Share this design</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section (Only if matching real reviews exist) -->
      <div id="productReviewsContainer"></div>

      <!-- Related Items ("You May Also Like") -->
      <section class="section-pad" style="background-color:var(--surface);border-top:1px solid var(--line);">
        <div class="page-container">
          <div style="text-align:center;max-width:700px;margin:0 auto 2.5rem;">
            <span class="keyword-eyebrow" style="margin-bottom:0.5rem;">Recommendations</span>
            <h2 style="font-size:clamp(24px,2.5vw,34px);margin:0 0 0.5rem;">You may also like</h2>
            <p style="color:var(--muted);font-size:0.95rem;margin:0;">Handcrafted ${category.title.toLowerCase()} designs from the same studio.</p>
          </div>
          <div class="catalog-grid" id="relatedGrid"></div>
        </div>
      </section>

      <!-- CTA Band -->
      <section class="section-pad" style="background-color:var(--bg);border-top:1px solid var(--line);">
        <div class="page-container" style="text-align:center;max-width:720px;">
          <h2 style="font-size:clamp(26px,3vw,38px);margin-bottom:0.75rem;">Can't find your style?</h2>
          <p style="color:var(--muted);font-size:1.05rem;margin-bottom:2rem;">
            We design custom signs and nameplates to match your exact vision.
          </p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <a href="/contact" class="btn btn-primary" title="Get a Free Quote">
              <span>Get a Free Quote</span>
              <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
            </a>
            <a href="${buildWhatsAppUrl()}" target="_blank" rel="noopener" class="btn btn-outline" id="bottomCtaWaBtn" title="WhatsApp Us">
              <span class="icon i-whatsapp" aria-hidden="true"></span>
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Mobile Sticky Bottom Bar (under 900px) -->
      <div class="mobile-quote-bar" id="mobileQuoteBar">
        <div class="mobile-quote-bar-info">
          <div class="mobile-quote-bar-title">${item.name}</div>
          <div class="mobile-quote-bar-price">${priceText}</div>
        </div>
        <button type="button" class="btn btn-primary mobile-quote-bar-btn" id="mobileQuoteBarBtn">
          <span>Get a Quote</span>
        </button>
      </div>

      <!-- Quote Modal -->
      <div class="quote-modal-overlay" id="quoteModalOverlay" role="dialog" aria-modal="true" aria-labelledby="quoteModalTitle">
        <div class="quote-modal-card" id="quoteModalCard">
          <button type="button" class="quote-modal-close-btn" id="quoteModalCloseBtn" aria-label="Close quote modal">
            <span class="icon i-close" aria-hidden="true"></span>
          </button>
          <h2 class="quote-modal-title" id="quoteModalTitle">Get a Quote: ${item.name}</h2>
          <div class="quote-modal-summary" id="quoteModalSummary"></div>

          <form id="quoteForm" novalidate>
            <!-- Hidden honeypot -->
            <input type="text" name="company_website" style="display:none;" tabindex="-1" autocomplete="off">

            <div class="quote-field" id="fieldFullName">
              <label for="quoteName">Full Name <span class="req">*</span></label>
              <input type="text" id="quoteName" class="quote-input" placeholder="Your name" required autocomplete="name">
              <div class="quote-error-msg" id="nameError">Please enter your name.</div>
            </div>

            <div class="quote-field" id="fieldPhone">
              <label for="quotePhone">Phone / WhatsApp <span class="req">*</span></label>
              <input type="tel" id="quotePhone" class="quote-input" placeholder="10-digit mobile number" required autocomplete="tel">
              <div class="quote-error-msg" id="phoneError">Please enter a valid 10-digit mobile number.</div>
            </div>

            <div class="quote-field" id="fieldEmail">
              <label for="quoteEmail">Email Address <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <input type="email" id="quoteEmail" class="quote-input" placeholder="name@example.com" autocomplete="email">
              <div class="quote-error-msg" id="emailError">Please enter a valid email address.</div>
            </div>

            <div class="quote-field">
              <label for="quoteCity">City / Location <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <input type="text" id="quoteCity" class="quote-input" placeholder="e.g. Gandhidham, Adipur, Bhuj, Ahmedabad">
            </div>

            <div class="quote-field">
              <label for="quoteNotes">Special Notes or Questions <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <textarea id="quoteNotes" class="quote-textarea" placeholder="Any specific requirements, fonts, or questions..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary quote-modal-submit-btn" id="quoteSubmitBtn">
              <span>Send Request on WhatsApp</span>
              <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
            </button>
          </form>

          <div id="quoteSuccessState" class="quote-success-state" style="display:none;">
            <div class="quote-success-icon"><span class="icon i-check" aria-hidden="true"></span></div>
            <h3 class="quote-success-title">Thank you!</h3>
            <p class="quote-success-desc">We will get back to you shortly with your free design preview and quote.</p>
            <a href="#" target="_blank" rel="noopener" class="btn btn-primary" id="openWaAgainBtn" style="width:100%;justify-content:center;">
              <span class="icon i-whatsapp" aria-hidden="true"></span>
              <span>Open WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Small Toast -->
      <div class="product-toast" id="productToast">Link copied to clipboard</div>
    `;

    // 6. Gallery Rendering Engine
    let currentSlides = [];

    function updateGallery() {
      currentSlides = window.plateSlides(item, customLines);
      const stageSlidesEl = document.getElementById("stageSlides");
      const thumbsRowEl = document.getElementById("thumbsRow");
      const counterEl = document.getElementById("galleryCounter");

      if (stageSlidesEl) {
        stageSlidesEl.innerHTML = currentSlides.map((slide, idx) => `
          <div class="product-stage-slide ${idx === activeSlideIndex ? 'active' : ''}" data-slide-idx="${idx}">
            ${slide.html}
          </div>
        `).join("");
      }

      if (thumbsRowEl) {
        thumbsRowEl.innerHTML = currentSlides.map((slide, idx) => `
          <button type="button" class="gallery-thumb-btn ${idx === activeSlideIndex ? 'active' : ''}" data-thumb-idx="${idx}" aria-label="${slide.title}">
            ${slide.html}
          </button>
        `).join("");
      }

      if (counterEl) {
        counterEl.textContent = `${activeSlideIndex + 1} / ${currentSlides.length}`;
      }

      if (window.autoFitPlates) {
        window.autoFitPlates(document.getElementById("stageContainer"));
        window.autoFitPlates(thumbsRowEl);
      }
    }

    function goToSlide(index) {
      if (!currentSlides.length) return;
      activeSlideIndex = (index + currentSlides.length) % currentSlides.length;
      const slides = document.querySelectorAll(".product-stage-slide");
      slides.forEach((s, i) => s.classList.toggle("active", i === activeSlideIndex));
      const thumbs = document.querySelectorAll(".gallery-thumb-btn");
      thumbs.forEach((t, i) => t.classList.toggle("active", i === activeSlideIndex));
      const counter = document.getElementById("galleryCounter");
      if (counter) counter.textContent = `${activeSlideIndex + 1} / ${currentSlides.length}`;
    }

    updateGallery();

    // Gallery Controls: Prev / Next / Thumbs / Lightbox
    const prevBtn = document.getElementById("galleryPrevBtn");
    const nextBtn = document.getElementById("galleryNextBtn");
    const stageContainer = document.getElementById("stageContainer");
    const thumbsRow = document.getElementById("thumbsRow");

    if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); goToSlide(activeSlideIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); goToSlide(activeSlideIndex + 1); });

    if (stageContainer) {
      stageContainer.addEventListener("click", () => {
        if (window.openViewer) {
          const viewerSlides = currentSlides.map((s) => ({
            name: `${item.name} (${s.title})`,
            material: item.material,
            html: s.html,
            slug: item.slug
          }));
          window.openViewer(viewerSlides, activeSlideIndex);
        }
      });
    }

    if (thumbsRow) {
      thumbsRow.addEventListener("click", (e) => {
        const thumb = e.target.closest(".gallery-thumb-btn");
        if (thumb) {
          const idx = parseInt(thumb.getAttribute("data-thumb-idx"), 10);
          if (!isNaN(idx)) goToSlide(idx);
        }
      });
    }

    // Touch swipe for gallery
    let touchStartX = 0;
    if (stageContainer) {
      stageContainer.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      stageContainer.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff < 0) goToSlide(activeSlideIndex + 1);
          else goToSlide(activeSlideIndex - 1);
        }
      }, { passive: true });
    }

    // Keyboard arrow keys
    window.addEventListener("keydown", (e) => {
      const modal = document.getElementById("quoteModalOverlay");
      const viewer = document.getElementById("designViewer");
      if ((modal && modal.classList.contains("open")) || (viewer && viewer.classList.contains("open"))) return;
      if (e.key === "ArrowLeft") goToSlide(activeSlideIndex - 1);
      else if (e.key === "ArrowRight") goToSlide(activeSlideIndex + 1);
    });

    // 7. Customizer Interactions
    const finishPills = document.getElementById("finishPills");
    if (finishPills) {
      finishPills.addEventListener("click", (e) => {
        const btn = e.target.closest(".pill-btn");
        if (!btn) return;
        finishPills.querySelectorAll(".pill-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFinish = btn.getAttribute("data-finish") || "";
        const label = document.getElementById("selectedFinishLabel");
        if (label) label.textContent = selectedFinish;
        updateWaLinks();
      });
    }

    const sizePills = document.getElementById("sizePills");
    if (sizePills) {
      sizePills.addEventListener("click", (e) => {
        const btn = e.target.closest(".pill-btn");
        if (!btn) return;
        sizePills.querySelectorAll(".pill-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSize = btn.getAttribute("data-size") || "";
        const label = document.getElementById("selectedSizeLabel");
        if (label) label.textContent = selectedSize;
        updateWaLinks();
      });
    }

    // Live Plate Text Input Updates
    const lineInputs = document.querySelectorAll(".customizer-text-input[data-line-idx]");
    lineInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const idx = parseInt(input.getAttribute("data-line-idx"), 10);
        if (!isNaN(idx)) {
          customLines[idx] = input.value;
          updateGallery();
          updateWaLinks();
        }
      });
    });

    const wallSizeInput = document.getElementById("wallSizeInput");
    if (wallSizeInput) {
      wallSizeInput.addEventListener("input", () => {
        currentWallSize = wallSizeInput.value.trim();
        updateWaLinks();
      });
    }

    function updateWaLinks() {
      const url = buildWhatsAppUrl();
      const productWaLink = document.getElementById("productWaLink");
      const bottomCtaWaBtn = document.getElementById("bottomCtaWaBtn");
      if (productWaLink) productWaLink.href = url;
      if (bottomCtaWaBtn) bottomCtaWaBtn.href = url;
    }

    // 8. Accordion Interactions
    const accordion = document.getElementById("productAccordion");
    if (accordion) {
      accordion.addEventListener("click", (e) => {
        const header = e.target.closest(".accordion-header");
        if (!header) return;
        const item = header.closest(".accordion-item");
        const isOpen = item.classList.contains("open");
        accordion.querySelectorAll(".accordion-item").forEach((it) => {
          it.classList.remove("open");
          const h = it.querySelector(".accordion-header");
          if (h) h.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          header.setAttribute("aria-expanded", "true");
        }
      });
    }

    // 9. Share Button with Toast
    const shareBtn = document.getElementById("shareBtn");
    const toast = document.getElementById("productToast");

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => { toast.classList.remove("show"); }, 2400);
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${item.name} | Signage Basket`,
              text: `Check out the ${item.name} design by Signage Basket Gandhidham.`,
              url: window.location.href
            });
          } catch (err) {
            // Cancelled or unsupported
          }
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(window.location.href).then(() => {
            showToast("Link copied to clipboard");
          }).catch(() => {
            showToast("Failed to copy link");
          });
        } else {
          showToast("Link copied to clipboard");
        }
      });
    }

    // 10. Quote Modal Logic
    const quoteOverlay = document.getElementById("quoteModalOverlay");
    const quoteCard = document.getElementById("quoteModalCard");
    const quoteCloseBtn = document.getElementById("quoteModalCloseBtn");
    const quoteForm = document.getElementById("quoteForm");
    const quoteSuccess = document.getElementById("quoteSuccessState");
    const openWaAgainBtn = document.getElementById("openWaAgainBtn");
    const quoteSummary = document.getElementById("quoteModalSummary");
    const nameInput = document.getElementById("quoteName");
    const phoneInput = document.getElementById("quotePhone");
    const emailInput = document.getElementById("quoteEmail");
    const cityInput = document.getElementById("quoteCity");
    const notesInput = document.getElementById("quoteNotes");
    let lastQuoteFocus = null;

    function openQuoteModal() {
      lastQuoteFocus = document.activeElement;
      if (quoteSummary) {
        quoteSummary.textContent = `${selectedFinish} · ${selectedSize} · "${customLines.join(' / ')}"${currentWallSize ? ' · Wall: ' + currentWallSize : ''}`;
      }
      if (quoteSuccess) quoteSuccess.style.display = "none";
      if (quoteForm) {
        quoteForm.style.display = "block";
      }
      quoteOverlay.classList.add("open");
      document.body.style.overflow = "hidden";
      if (window.lenis && typeof window.lenis.stop === "function") window.lenis.stop();
      if (nameInput) nameInput.focus();
    }

    function closeQuoteModal() {
      quoteOverlay.classList.remove("open");
      document.body.style.overflow = "";
      if (window.lenis && typeof window.lenis.start === "function") window.lenis.start();
      if (lastQuoteFocus) lastQuoteFocus.focus();
    }

    const mainGetQuoteBtn = document.getElementById("mainGetQuoteBtn");
    if (mainGetQuoteBtn) mainGetQuoteBtn.addEventListener("click", openQuoteModal);

    const mobileQuoteBarBtn = document.getElementById("mobileQuoteBarBtn");
    if (mobileQuoteBarBtn) mobileQuoteBarBtn.addEventListener("click", openQuoteModal);

    if (quoteCloseBtn) quoteCloseBtn.addEventListener("click", closeQuoteModal);
    if (quoteOverlay) {
      quoteOverlay.addEventListener("click", (e) => {
        if (e.target === quoteOverlay) closeQuoteModal();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (!quoteOverlay.classList.contains("open")) return;
      if (e.key === "Escape") {
        closeQuoteModal();
      } else if (e.key === "Tab") {
        const focusables = quoteCard.querySelectorAll("button, [href], input:not([style*='display:none']), textarea");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Form Validation & Submission
    function validatePhone(phone) {
      const clean = phone.replace(/[\s\-\+\(\)]/g, "");
      return /^[6-9]\d{9}$/.test(clean);
    }

    function validateEmail(email) {
      if (!email) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if (quoteForm) {
      quoteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const honeypot = quoteForm.querySelector("input[name='company_website']");
        if (honeypot && honeypot.value) return; // bot detection

        let isValid = true;
        const nameVal = nameInput ? nameInput.value.trim() : "";
        const phoneVal = phoneInput ? phoneInput.value.trim() : "";
        const emailVal = emailInput ? emailInput.value.trim() : "";
        const cityVal = cityInput ? cityInput.value.trim() : "";
        const notesVal = notesInput ? notesInput.value.trim() : "";

        // Validate Name
        const nameField = document.getElementById("fieldFullName");
        if (!nameVal) {
          if (nameField) nameField.classList.add("has-error");
          isValid = false;
        } else if (nameField) {
          nameField.classList.remove("has-error");
        }

        // Validate Phone
        const phoneField = document.getElementById("fieldPhone");
        if (!validatePhone(phoneVal)) {
          if (phoneField) phoneField.classList.add("has-error");
          isValid = false;
        } else if (phoneField) {
          phoneField.classList.remove("has-error");
        }

        // Validate Email (optional)
        const emailField = document.getElementById("fieldEmail");
        if (emailVal && !validateEmail(emailVal)) {
          if (emailField) emailField.classList.add("has-error");
          isValid = false;
        } else if (emailField) {
          emailField.classList.remove("has-error");
        }

        if (!isValid) return;

        // Build neat WhatsApp quote message
        const waLines = [
          `Hi Signage Basket, I would like to get a quote for a custom ${catSingular.toLowerCase()}:`,
          ``,
          `*Design:* ${item.name}`,
          `*Link:* ${canonicalUrl}`,
          `*Finish:* ${selectedFinish}`,
          `*Size:* ${selectedSize}`,
          `*Text:* ${customLines.join(" / ")}`
        ];

        if (currentWallSize) waLines.push(`*Wall / Space:* ${currentWallSize}`);
        waLines.push(``);
        waLines.push(`*Customer Details:*`);
        waLines.push(`- Name: ${nameVal}`);
        waLines.push(`- Phone: ${phoneVal}`);
        if (emailVal) waLines.push(`- Email: ${emailVal}`);
        if (cityVal)  waLines.push(`- City: ${cityVal}`);
        if (notesVal) waLines.push(`- Notes: ${notesVal}`);

        const waUrl = `https://wa.me/${config.whatsappRaw || '919999999999'}?text=${encodeURIComponent(waLines.join("\n"))}`;

        // Attempt opening WhatsApp popup
        window.open(waUrl, "_blank");

        // Show success state
        quoteForm.style.display = "none";
        if (quoteSuccess) {
          quoteSuccess.style.display = "block";
          if (openWaAgainBtn) openWaAgainBtn.href = waUrl;
        }
      });
    }

    // 11. Mobile Sticky Bottom Bar Observer
    const mobileBar = document.getElementById("mobileQuoteBar");
    if (mobileBar && mainGetQuoteBtn) {
      const footer = document.querySelector(".site-footer") || document.getElementById("siteFooterContainer");

      function checkMobileBarVisibility() {
        if (window.innerWidth > 900) {
          mobileBar.classList.remove("show");
          document.body.classList.remove("has-mobile-quote-bar");
          return;
        }

        const btnRect = mainGetQuoteBtn.getBoundingClientRect();
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        const btnPassed = btnRect.bottom < 0;
        const reachedFooter = footerRect ? footerRect.top < window.innerHeight : false;

        if (btnPassed && !reachedFooter) {
          mobileBar.classList.add("show");
          document.body.classList.add("has-mobile-quote-bar");
        } else {
          mobileBar.classList.remove("show");
          document.body.classList.remove("has-mobile-quote-bar");
        }
      }

      window.addEventListener("scroll", checkMobileBarVisibility, { passive: true });
      window.addEventListener("resize", checkMobileBarVisibility);
      checkMobileBarVisibility();
    }

    // 12. "You May Also Like" Grid
    const relatedGrid = document.getElementById("relatedGrid");
    if (relatedGrid) {
      const currentTags = item.tags || [];
      const others = category.items.filter((p) => p.slug !== item.slug);

      // Score items by shared tags
      const scored = others.map((p) => {
        let score = 0;
        (p.tags || []).forEach((t) => {
          if (currentTags.includes(t)) score++;
        });
        return { item: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const top4 = scored.slice(0, 4).map((s) => s.item);

      relatedGrid.innerHTML = top4.map((p) => {
        const plateHtml = window.renderPlate(p.plate);
        return `
          <article class="catalog-card" data-slug="${p.slug}">
            <div class="catalog-card-media">
              ${plateHtml}
              <button type="button" class="catalog-zoom-btn" data-slug="${p.slug}" aria-label="View ${p.name} larger">
                <span class="icon i-zoom-plus" aria-hidden="true"></span>
              </button>
            </div>
            <div class="catalog-card-info">
              <h3 class="catalog-card-name" data-slug="${p.slug}">${p.name}</h3>
              <div class="catalog-card-mat">${p.material}</div>
              <a href="/design/${encodeURIComponent(p.slug)}" class="catalog-card-link">
                <span>View details</span>
                <span class="icon i-arrow-right" aria-hidden="true"></span>
              </a>
            </div>
          </article>
        `;
      }).join("");

      if (window.autoFitPlates) window.autoFitPlates(relatedGrid);

      relatedGrid.addEventListener("click", (e) => {
        const zoomBtn = e.target.closest(".catalog-zoom-btn");
        if (zoomBtn) {
          e.preventDefault();
          e.stopPropagation();
          const targetSlug = zoomBtn.getAttribute("data-slug");
          if (window.openViewer) window.openViewer(targetSlug);
          return;
        }
        const card = e.target.closest(".catalog-card");
        if (card) {
          const targetSlug = card.getAttribute("data-slug");
          if (targetSlug) {
            window.location.href = `/design/${targetSlug}`;
          }
        }
      });
    }

    // 13. Reviews Rendering (Strictly only if verified real client review matches this slug)
    const reviewsContainer = document.getElementById("productReviewsContainer");
    if (reviewsContainer) {
      const allReviews = window.SIGNAGE_REVIEWS || [];
      const matchingReviews = allReviews.filter((r) => {
        return r && (r.project === item.slug || r.design === item.slug || (r.project && r.project.toLowerCase().includes(item.name.toLowerCase())));
      });

      if (matchingReviews.length > 0) {
        reviewsContainer.innerHTML = `
          <section class="section-pad" style="border-top:1px solid var(--line);">
            <div class="page-container">
              <div style="text-align:center;max-width:700px;margin:0 auto 2.5rem;">
                <span class="keyword-eyebrow" style="margin-bottom:0.5rem;">Verified Feedback</span>
                <h2 style="font-size:clamp(24px,2.5vw,34px);margin:0 0 0.5rem;">Client Reviews</h2>
              </div>
              <div class="reviews-grid">
                ${matchingReviews.map((r) => {
                  const stars = Array(5).fill(0).map((_, i) =>
                    `<span class="icon i-star" aria-hidden="true" style="${i < r.rating ? "color:var(--accent)" : "color:var(--line)"}"></span>`
                  ).join("");
                  return `
                    <div class="review-card">
                      <div class="review-stars" aria-label="${r.rating} out of 5 stars">${stars}</div>
                      <p class="review-text">&ldquo;${r.text}&rdquo;</p>
                      <div class="review-author">
                        <strong>${r.name}</strong>
                        <span>${r.project}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          </section>
        `;
      }
    }

  } catch (err) {
    console.error("Product detail initialization error:", err);
  }
})();
