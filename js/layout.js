/**
 * Signage Basket — Shared Header, Footer & Global Layout (Phase 5 E-commerce Reskin)
 * Sticky 88px Header with Collection Dropdown, 4-Column Ink Footer, and White Page Fade.
 */

document.addEventListener("DOMContentLoaded", () => {
  try {
    const config = window.SIGNAGE_CONFIG || {
      phone: "+91 XXXXX XXXXX",
      whatsapp: "+91 XXXXX XXXXX",
      whatsappRaw: "919999999999",
      email: "hello@signagebasket.com",
      address: "Station Road, Gandhidham, Kutch, Gujarat 370201",
      instagram: "https://instagram.com/signagebasket",
      instagramHandle: "@signagebasket",
      SITE_URL: "https://www.signagebasket.in",
      whatsappDefaultMsg: "Hi Signage Basket, I'd like a quote for a nameplate/signage."
    };

    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    // 1. Page Transition Fade Overlay (Clean 0.3s white fade)
    let pageFade = document.getElementById("pageFadeOverlay");
    if (!pageFade) {
      pageFade = document.createElement("div");
      pageFade.id = "pageFadeOverlay";
      pageFade.className = "page-fade-overlay";
      document.body.prepend(pageFade);
    }

    // 3-second failsafe to clear fade overlay
    const fadeTimer = setTimeout(() => {
      if (pageFade) pageFade.classList.add("fade-out");
    }, 50);

    setTimeout(() => {
      if (pageFade) {
        pageFade.classList.add("fade-out");
        pageFade.style.pointerEvents = "none";
      }
    }, 3000);

    // Intercept internal link clicks for 0.3s white fade-out
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("javascript:") &&
        link.target !== "_blank"
      ) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (pageFade) {
            pageFade.classList.remove("fade-out");
            pageFade.style.pointerEvents = "auto";
          }
          setTimeout(() => {
            window.location.href = href;
          }, 280);
        });
      }
    });

    // 2. Inject Shared Header
    const headerPlaceholder = document.getElementById("siteHeaderContainer");
    if (!document.querySelector(".site-header")) {
      const waMsg = encodeURIComponent(config.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote for a custom sign board or nameplate.");
      const waUrl = `https://wa.me/${config.whatsappRaw}?text=${waMsg}`;

      const headerHtml = `
        <header class="site-header" id="mainHeader" role="banner">
          <div class="header-inner">
            <div class="header-left">
              <a href="index.html" class="site-logo" aria-label="Signage Basket Home" title="Signage Basket Home">
                <img src="assets/images/logo.jpeg" alt="Signage Basket Logo" class="site-logo-img" width="52" height="52" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';">
                <span class="logo-fallback-text" style="display:none;">Signage Basket</span>
              </a>

              <nav class="nav-desktop" aria-label="Main Navigation">
                <a href="index.html" class="nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}" title="Home">Home</a>
                
                <div class="nav-dropdown-wrapper">
                  <a href="collection.html" class="nav-link nav-dropdown-trigger ${currentPath === 'collection.html' ? 'active' : ''}" title="Collection">
                    Collection <span class="nav-arrow" aria-hidden="true">▾</span>
                  </a>
                  <div class="nav-dropdown-menu" role="menu">
                    <a href="collection.html#home-nameplates" class="dropdown-item" role="menuitem">Home Nameplates</a>
                    <a href="collection.html#glow-signs" class="dropdown-item" role="menuitem">LED & Glow Signs</a>
                    <a href="collection.html#3d-letters" class="dropdown-item" role="menuitem">3D Letter Signs</a>
                    <a href="collection.html#office-boards" class="dropdown-item" role="menuitem">Acrylic Office Boards</a>
                    <a href="collection.html#wall-branding" class="dropdown-item" role="menuitem">Interior Wall Branding</a>
                  </div>
                </div>

                <a href="our-work.html" class="nav-link ${currentPath === 'our-work.html' ? 'active' : ''}" title="Our Work">Our Work</a>
                <a href="contact.html" class="nav-link ${currentPath === 'contact.html' ? 'active' : ''}" title="Contact">Contact</a>
              </nav>
            </div>

            <div class="header-right">
              <a href="${waUrl}" target="_blank" rel="noopener" class="header-wa-btn" aria-label="Chat on WhatsApp" title="WhatsApp Us">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
              <a href="contact.html" class="btn btn-outline header-quote-btn" title="Get a Quote">
                <span>Get a Quote</span>
                <span class="btn-arrow" aria-hidden="true">→</span>
              </a>
              <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle Menu" aria-expanded="false">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Mobile Drawer -->
        <div class="mobile-nav-overlay" id="mobileNavOverlay" role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div class="mobile-drawer-header">
            <img src="assets/images/logo.jpeg" alt="Signage Basket Logo" class="mobile-logo-img" width="40" height="40">
            <button class="mobile-drawer-close" id="mobileDrawerClose" aria-label="Close Menu">✕</button>
          </div>
          <nav class="mobile-nav-links" aria-label="Mobile Navigation Links">
            <a href="index.html" class="mobile-nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a>
            <div class="mobile-nested-group">
              <a href="collection.html" class="mobile-nav-link ${currentPath === 'collection.html' ? 'active' : ''}">Collection</a>
              <div class="mobile-nested-links">
                <a href="collection.html#home-nameplates">Home Nameplates</a>
                <a href="collection.html#glow-signs">LED & Glow Signs</a>
                <a href="collection.html#3d-letters">3D Letter Signs</a>
                <a href="collection.html#office-boards">Acrylic Office Boards</a>
                <a href="collection.html#wall-branding">Interior Wall Branding</a>
              </div>
            </div>
            <a href="our-work.html" class="mobile-nav-link ${currentPath === 'our-work.html' ? 'active' : ''}">Our Work</a>
            <a href="contact.html" class="mobile-nav-link ${currentPath === 'contact.html' ? 'active' : ''}">Contact</a>
          </nav>
          <div class="mobile-nav-footer">
            <p><strong>Phone:</strong> <a href="tel:${config.phone}">${config.phone}</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/${config.whatsappRaw}">${config.whatsapp}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${config.email}">${config.email}</a></p>
            <p><strong>Location:</strong> ${config.address}</p>
          </div>
        </div>
      `;

      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
      } else {
        document.body.insertAdjacentHTML("afterbegin", headerHtml);
      }
    }

    // 3. Inject Shared 4-Column Ink Footer
    const footerPlaceholder = document.getElementById("siteFooterContainer");
    if (!document.querySelector(".site-footer")) {
      const footerHtml = `
        <footer class="site-footer" role="contentinfo">
          <div class="footer-inner">
            <div class="footer-grid">
              
              <!-- Col 1: Logo & Description -->
              <div class="footer-col">
                <a href="index.html" class="footer-logo-link" title="Signage Basket Home">
                  <img src="assets/images/logo.jpeg" alt="Signage Basket Logo" class="footer-logo-img" width="48" height="48">
                  <span class="footer-brand-title">Signage Basket</span>
                </a>
                <p class="footer-desc">
                  Gandhidham’s premier studio for bespoke home nameplates, LED glow sign boards, and architectural 3D letters across Gujarat and India.
                </p>
              </div>

              <!-- Col 2: Quick Links -->
              <div class="footer-col">
                <h4 class="footer-col-title">Quick Links</h4>
                <ul class="footer-links-list">
                  <li><a href="index.html" class="footer-link">Home</a></li>
                  <li><a href="collection.html" class="footer-link">Collection</a></li>
                  <li><a href="our-work.html" class="footer-link">Our Work</a></li>
                  <li><a href="contact.html" class="footer-link">Get a Quote</a></li>
                </ul>
              </div>

              <!-- Col 3: Popular Searches (SEO Links) -->
              <div class="footer-col">
                <h4 class="footer-col-title">Popular Searches</h4>
                <ul class="footer-links-list">
                  <li><a href="collection.html#home-nameplates" class="footer-link">Nameplate maker in Gandhidham</a></li>
                  <li><a href="collection.html#glow-signs" class="footer-link">LED glow sign boards in Gujarat</a></li>
                  <li><a href="collection.html#3d-letters" class="footer-link">3D letter signs</a></li>
                  <li><a href="collection.html#office-boards" class="footer-link">Office signage & acrylic boards</a></li>
                  <li><a href="collection.html#wall-branding" class="footer-link">Interior wall branding</a></li>
                  <li><a href="collection.html#home-nameplates" class="footer-link">House name plate design</a></li>
                </ul>
              </div>

              <!-- Col 4: Contact & Social -->
              <div class="footer-col">
                <h4 class="footer-col-title">Contact Studio</h4>
                <div class="footer-contact-info">
                  <p><strong>Phone:</strong> <a href="tel:${config.phone}" class="footer-link">${config.phone}</a></p>
                  <p><strong>WhatsApp:</strong> <a href="https://wa.me/${config.whatsappRaw}" target="_blank" rel="noopener" class="footer-link">${config.whatsapp}</a></p>
                  <p><strong>Email:</strong> <a href="mailto:${config.email}" class="footer-link">${config.email}</a></p>
                  <p><strong>Location:</strong> <span>${config.address}</span></p>
                  <p style="margin-top: 0.75rem;">
                    <a href="${config.instagram}" target="_blank" rel="noopener" class="footer-link footer-ig-link">
                      Follow ${config.instagramHandle} →
                    </a>
                  </p>
                </div>
              </div>

            </div>

            <!-- Bottom Bar -->
            <div class="footer-bottom-bar">
              <div class="footer-copy">
                © 2026 Signage Basket · Gandhidham, Gujarat. All rights reserved.
              </div>
              <a href="#top" id="backToTopBtn" class="footer-back-to-top" title="Back to top">Back to top ↑</a>
            </div>
          </div>
        </footer>
      `;

      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
      } else {
        document.body.insertAdjacentHTML("beforeend", footerHtml);
      }

      const backToTopBtn = document.getElementById("backToTopBtn");
      if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }

    // 4. Inject Floating WhatsApp Button (Ink circle with white glyph)
    if (!document.querySelector(".floating-whatsapp")) {
      const waMsg = encodeURIComponent(config.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote for a nameplate/signage.");
      const waUrl = `https://wa.me/${config.whatsappRaw}?text=${waMsg}`;
      const waBtn = document.createElement("a");
      waBtn.href = waUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener";
      waBtn.className = "floating-whatsapp";
      waBtn.setAttribute("aria-label", "Contact Signage Basket on WhatsApp");
      waBtn.setAttribute("title", "WhatsApp Us");
      waBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      `;
      document.body.appendChild(waBtn);
    }

    // 5. Mobile Toggle & Drawer Close
    const toggleBtn = document.getElementById("mobileNavToggle");
    const closeBtn = document.getElementById("mobileDrawerClose");
    const mobileOverlay = document.getElementById("mobileNavOverlay");

    function setDrawerState(open) {
      if (!mobileOverlay) return;
      mobileOverlay.classList.toggle("open", open);
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    if (toggleBtn) toggleBtn.addEventListener("click", () => setDrawerState(true));
    if (closeBtn) closeBtn.addEventListener("click", () => setDrawerState(false));

    if (mobileOverlay) {
      mobileOverlay.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setDrawerState(false));
      });
    }

    // 6. Header Scroll Shadow (Add after 10px scroll)
    const headerEl = document.getElementById("mainHeader");
    if (headerEl) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 10) {
          headerEl.classList.add("scrolled");
        } else {
          headerEl.classList.remove("scrolled");
        }
      }, { passive: true });
    }

  } catch (err) {
    console.warn("Layout injection warning:", err);
  }
});
