/**
 * Signage Basket — Shared Header, Footer & Global Layout (Phase 6 Icon/Logo Upgrade)
 * SVG-icon header, full 4-column ink footer with social icons and SEO row.
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
      facebook: "",
      youtube: "",
      instagramHandle: "@signagebasket",
      SITE_URL: "https://www.signagebasket.in",
      whatsappDefaultMsg: "Hi Signage Basket, I'd like a quote for a nameplate/signage in Gandhidham/Gujarat."
    };

    const rawPath = window.location.pathname.replace(/\/+$/, "").replace(/\.html$/, "");
    const normalizedPath = rawPath === "" || rawPath === "/index" ? "/" : rawPath;

    // 1. Page Transition Fade Overlay
    let pageFade = document.getElementById("pageFadeOverlay");
    if (!pageFade) {
      pageFade = document.createElement("div");
      pageFade.id = "pageFadeOverlay";
      pageFade.className = "page-fade-overlay";
      document.body.prepend(pageFade);
    }

    setTimeout(() => { if (pageFade) pageFade.classList.add("fade-out"); }, 50);
    setTimeout(() => {
      if (pageFade) {
        pageFade.classList.add("fade-out");
        pageFade.style.pointerEvents = "none";
      }
    }, 3000);

    // Intercept internal link clicks for page fade (handles extensionless same-origin paths)
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("javascript:") &&
        link.target !== "_blank"
      ) {
        const isInternal = href.startsWith("/") || (!href.startsWith("http:") && !href.startsWith("https:")) || (link.origin === window.location.origin);
        if (isInternal) {
          link.addEventListener("click", (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            if (pageFade) {
              pageFade.classList.remove("fade-out");
              pageFade.style.pointerEvents = "auto";
            }
            setTimeout(() => { window.location.href = href; }, 280);
          });
        }
      }
    });

    // 2. Inject Shared Header
    if (!document.querySelector(".site-header")) {
      const waMsg = encodeURIComponent(config.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote.");
      const waUrl = `https://wa.me/${config.whatsappRaw}?text=${waMsg}`;
      const isHome    = normalizedPath === "/";
      const isColl    = normalizedPath === "/collection" || normalizedPath === "/house-nameplates" || normalizedPath === "/led-glow-signs" || normalizedPath === "/3d-letter-signs" || normalizedPath === "/acrylic-office-boards" || normalizedPath === "/wall-branding";
      const isWork    = normalizedPath === "/our-work";
      const isAbout   = normalizedPath === "/about";
      const isContact = normalizedPath === "/contact";

      const headerHtml = `
        <header class="site-header" id="mainHeader" role="banner">
          <div class="header-inner">
            <div class="header-left">
              <a href="/" class="site-logo" aria-label="Signage Basket Home">
                <img src="/assets/logo/logo-wordmark.svg" alt="Signage Basket" class="site-logo-img logo-dark" width="220" height="60"
                  onerror="this.style.display='none';">
                <img src="/assets/logo/logo-wordmark-light.svg" alt="Signage Basket" class="site-logo-img logo-light" width="220" height="60"
                  onerror="this.style.display='none';">
                <span class="logo-fallback-text" style="display:none;">Signage Basket</span>
              </a>

              <nav class="nav-desktop" aria-label="Main Navigation">
                <a href="/" class="nav-link ${isHome ? 'active' : ''}">Home</a>

                <div class="nav-dropdown-wrapper">
                  <a href="/collection" class="nav-link nav-dropdown-trigger ${isColl ? 'active' : ''}">
                    Collection <span class="icon i-chevron-down nav-chevron" aria-hidden="true"></span>
                  </a>
                  <div class="nav-dropdown-menu" role="menu">
                    <a href="/house-nameplates" class="dropdown-item" role="menuitem">Home Nameplates</a>
                    <a href="/led-glow-signs" class="dropdown-item" role="menuitem">LED &amp; Glow Signs</a>
                    <a href="/3d-letter-signs" class="dropdown-item" role="menuitem">3D Letter Signs</a>
                    <a href="/acrylic-office-boards" class="dropdown-item" role="menuitem">Acrylic Office Boards</a>
                    <a href="/wall-branding" class="dropdown-item" role="menuitem">Interior Wall Branding</a>
                  </div>
                </div>

                <a href="/our-work" class="nav-link ${isWork ? 'active' : ''}">Our Work</a>
                <a href="/about" class="nav-link ${isAbout ? 'active' : ''}">About</a>
                <a href="/contact" class="nav-link ${isContact ? 'active' : ''}">Contact</a>
              </nav>
            </div>

            <div class="header-right">
              <button class="header-icon-btn" id="searchToggleBtn" aria-label="Search" aria-expanded="false">
                <span class="icon i-search" aria-hidden="true"></span>
              </button>
              <a href="${waUrl}" target="_blank" rel="noopener" class="header-icon-btn wa-btn" aria-label="Chat on WhatsApp" title="WhatsApp Us">
                <span class="icon i-whatsapp" aria-hidden="true"></span>
              </a>
              <a href="/contact" class="btn btn-outline header-quote-btn" title="Get a Quote">
                <span>Get a Quote</span>
                <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
              </a>
              <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Open Menu" aria-expanded="false">
                <span class="icon i-menu" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Search Overlay -->
        <div class="search-overlay" id="searchOverlay" role="search" aria-label="Site Search">
          <div class="search-overlay-inner">
            <div class="search-input-row">
              <span class="icon i-search" aria-hidden="true" style="font-size:1.25rem;color:var(--muted);"></span>
              <input type="text" id="searchInput" placeholder="Search designs, collections, pages…" autocomplete="off" aria-label="Search">
              <button class="search-close-btn" id="searchCloseBtn" aria-label="Close search">
                <span class="icon i-close" aria-hidden="true"></span>
              </button>
            </div>
            <div class="search-results" id="searchResults" aria-live="polite"></div>
          </div>
        </div>

        <!-- Mobile Drawer -->
        <div class="mobile-nav-overlay" id="mobileNavOverlay" role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div class="mobile-drawer-header">
            <a href="/">
              <img src="/assets/logo/logo-wordmark.svg" alt="Signage Basket" height="36" style="width:auto;"
                onerror="this.style.display='none';">
            </a>
            <button class="mobile-drawer-close" id="mobileDrawerClose" aria-label="Close Menu">
              <span class="icon i-close" aria-hidden="true"></span>
            </button>
          </div>
          <nav class="mobile-nav-links" aria-label="Mobile Navigation">
            <a href="/" class="mobile-nav-link ${isHome ? 'active' : ''}">Home</a>
            <div class="mobile-nested-group">
              <a href="/collection" class="mobile-nav-link ${isColl ? 'active' : ''}">Collection</a>
              <div class="mobile-nested-links">
                <a href="/house-nameplates">Home Nameplates</a>
                <a href="/led-glow-signs">LED &amp; Glow Signs</a>
                <a href="/3d-letter-signs">3D Letter Signs</a>
                <a href="/acrylic-office-boards">Acrylic Office Boards</a>
                <a href="/wall-branding">Interior Wall Branding</a>
              </div>
            </div>
            <a href="/our-work" class="mobile-nav-link ${isWork ? 'active' : ''}">Our Work</a>
            <a href="/about" class="mobile-nav-link ${isAbout ? 'active' : ''}">About</a>
            <a href="/contact" class="mobile-nav-link ${isContact ? 'active' : ''}">Contact</a>
          </nav>
          <div class="mobile-nav-footer">
            <p><strong>Phone:</strong> <a href="tel:${config.phone}">${config.phone}</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/${config.whatsappRaw}">${config.whatsapp}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${config.email}">${config.email}</a></p>
            <p><strong>Location:</strong> ${config.address}</p>
          </div>
        </div>
      `;

      const headerPlaceholder = document.getElementById("siteHeaderContainer");
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
      } else {
        document.body.insertAdjacentHTML("afterbegin", headerHtml);
      }
    }

    // 3. Inject Shared Footer
    if (!document.querySelector(".site-footer")) {
      const socials = [
        config.instagram ? `<a href="${config.instagram}" target="_blank" rel="noopener" class="footer-social-icon" aria-label="Instagram"><span class="icon i-instagram"></span></a>` : "",
        config.facebook  ? `<a href="${config.facebook}"  target="_blank" rel="noopener" class="footer-social-icon" aria-label="Facebook"><span class="icon i-facebook"></span></a>`   : "",
        config.youtube   ? `<a href="${config.youtube}"   target="_blank" rel="noopener" class="footer-social-icon" aria-label="YouTube"><span class="icon i-youtube"></span></a>`     : "",
        config.whatsappRaw ? `<a href="https://wa.me/${config.whatsappRaw}" target="_blank" rel="noopener" class="footer-social-icon" aria-label="WhatsApp"><span class="icon i-whatsapp"></span></a>` : "",
      ].filter(Boolean).join("");

      const footerHtml = `
        <footer class="site-footer" role="contentinfo">
          <div class="footer-inner">
            <div class="footer-grid">

              <!-- Col 1: Brand -->
              <div class="footer-col">
                <a href="/" class="footer-logo-link" title="Signage Basket Home">
                  <img src="/assets/logo/logo-wordmark-light.svg" alt="Signage Basket" class="footer-logo-img"
                    onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span style=&quot;color:#fff;font-size:1.2rem;font-weight:600;&quot;>Signage Basket</span>');">
                </a>
                <p class="footer-desc">A signage and nameplate studio in Gandhidham, Kutch — custom-crafting home nameplates, LED glow sign boards, and 3D letters for clients across Gujarat and India.</p>
                <div class="footer-social-row">${socials}</div>
              </div>

              <!-- Col 2: Quick Links -->
              <div class="footer-col">
                <h4 class="footer-col-title">Quick Links</h4>
                <ul class="footer-links-list">
                  <li><a href="/" class="footer-link">Home</a></li>
                  <li><a href="/collection" class="footer-link">Collection</a></li>
                  <li><a href="/our-work" class="footer-link">Our Work</a></li>
                  <li><a href="/about" class="footer-link">About</a></li>
                  <li><a href="/collection#faq" class="footer-link">FAQ</a></li>
                  <li><a href="/contact" class="footer-link">Get a Quote</a></li>
                </ul>
              </div>

              <!-- Col 3: Policies -->
              <div class="footer-col">
                <h4 class="footer-col-title">Policies</h4>
                <ul class="footer-links-list">
                  <li><a href="/privacy-policy" class="footer-link">Privacy Policy</a></li>
                  <li><a href="/terms" class="footer-link">Terms of Service</a></li>
                  <li><a href="/shipping-installation" class="footer-link">Shipping &amp; Installation</a></li>
                </ul>
              </div>

              <!-- Col 4: Contact -->
              <div class="footer-col">
                <h4 class="footer-col-title">Contact Studio</h4>
                <div class="footer-contact-info">
                  <div class="footer-contact-row">
                    <span class="icon i-map-pin"></span>
                    <span>${config.address}</span>
                  </div>
                  <div class="footer-contact-row">
                    <span class="icon i-phone"></span>
                    <a href="tel:${config.phone}">${config.phone}</a>
                  </div>
                  <div class="footer-contact-row">
                    <span class="icon i-mail"></span>
                    <a href="mailto:${config.email}">${config.email}</a>
                  </div>
                  <div class="footer-contact-row">
                    <span class="icon i-clock"></span>
                    <span>Mon – Sat: 10:00 AM – 7:00 PM</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Popular Searches SEO row -->
            <div class="footer-seo-row">
              <div class="footer-seo-inner">
                <span class="footer-seo-label">Popular searches</span>
                <a href="/house-nameplates" class="footer-link">House nameplate designs</a>
                <a href="/led-glow-signs" class="footer-link">LED glow sign boards</a>
                <a href="/3d-letter-signs" class="footer-link">3D letter signs</a>
                <a href="/acrylic-office-boards" class="footer-link">Acrylic office boards</a>
                <a href="/wall-branding" class="footer-link">Interior wall branding</a>
                <a href="/collection" class="footer-link">Nameplate maker in Gandhidham</a>
              </div>
            </div>

            <!-- Bottom Bar -->
            <div class="footer-bottom-bar">
              <div>&copy; 2026 Signage Basket &middot; Gandhidham, Gujarat. All rights reserved.</div>
              <a href="#top" id="backToTopBtn" class="footer-back-to-top" title="Back to top">
                Back to top <span class="icon i-arrow-up"></span>
              </a>
            </div>
          </div>
        </footer>
      `;

      const footerPlaceholder = document.getElementById("siteFooterContainer");
      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
      } else {
        document.body.insertAdjacentHTML("beforeend", footerHtml);
      }

      const backToTop = document.getElementById("backToTopBtn");
      if (backToTop) {
        backToTop.addEventListener("click", (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }

    // 4. Inject Floating WhatsApp Button
    if (!document.querySelector(".floating-whatsapp")) {
      const waMsg = encodeURIComponent(config.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote.");
      const waUrl = `https://wa.me/${config.whatsappRaw}?text=${waMsg}`;
      const waBtn = document.createElement("a");
      waBtn.href = waUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener";
      waBtn.className = "floating-whatsapp";
      waBtn.setAttribute("aria-label", "Contact Signage Basket on WhatsApp");
      waBtn.title = "WhatsApp Us";
      waBtn.innerHTML = `<span class="icon i-whatsapp" style="font-size:1.5rem;"></span>`;
      document.body.appendChild(waBtn);
    }

    // 5. Mobile Toggle & Drawer
    const toggleBtn = document.getElementById("mobileNavToggle");
    const closeBtn  = document.getElementById("mobileDrawerClose");
    const mobileOverlay = document.getElementById("mobileNavOverlay");

    function setDrawerState(open) {
      if (!mobileOverlay) return;
      mobileOverlay.classList.toggle("open", open);
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      evaluateHeaderState();
    }

    if (toggleBtn) toggleBtn.addEventListener("click", () => setDrawerState(true));
    if (closeBtn)  closeBtn.addEventListener("click",  () => setDrawerState(false));

    if (mobileOverlay) {
      mobileOverlay.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setDrawerState(false));
      });
    }

    // 6. Header Scroll & Over-Hero State Handling
    const headerEl = document.getElementById("mainHeader");
    const searchToggle = document.getElementById("searchToggleBtn");
    const searchOverlay = document.getElementById("searchOverlay");
    const searchClose   = document.getElementById("searchCloseBtn");
    const searchInput   = document.getElementById("searchInput");
    const isHome = normalizedPath === "/";

    let ticking = false;

    function evaluateHeaderState() {
      try {
        if (!headerEl) return;
        const scrollY = window.pageYOffset || window.scrollY || 0;
        headerEl.classList.toggle("scrolled", scrollY > 10);

        if (!isHome) {
          headerEl.classList.remove("is-over-hero");
          return;
        }

        const isDrawerOpen = mobileOverlay && mobileOverlay.classList.contains("open");
        const isSearchOpen = searchOverlay && searchOverlay.classList.contains("open");

        if (isDrawerOpen || isSearchOpen) {
          headerEl.classList.remove("is-over-hero");
        } else if (scrollY < 60) {
          headerEl.classList.add("is-over-hero");
        } else {
          headerEl.classList.remove("is-over-hero");
        }
      } catch (err) {
        if (headerEl) headerEl.classList.remove("is-over-hero");
        console.warn("Header state evaluation error:", err);
      }
    }

    window.updateHeaderState = evaluateHeaderState;

    function requestHeaderUpdate() {
      if (!ticking) {
        requestAnimationFrame(() => {
          evaluateHeaderState();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
    window.addEventListener("resize", requestHeaderUpdate);
    window.addEventListener("pageshow", evaluateHeaderState);
    evaluateHeaderState();

    // 7. Search Overlay
    function openSearch() {
      if (!searchOverlay) return;
      searchOverlay.classList.add("open");
      if (searchToggle) searchToggle.setAttribute("aria-expanded", "true");
      if (searchInput) { searchInput.focus(); }
      evaluateHeaderState();
    }

    function closeSearch() {
      if (!searchOverlay) return;
      searchOverlay.classList.remove("open");
      if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
      evaluateHeaderState();
    }

    if (searchToggle) searchToggle.addEventListener("click", openSearch);
    if (searchClose)  searchClose.addEventListener("click", closeSearch);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchOverlay && searchOverlay.classList.contains("open")) {
        closeSearch();
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        if (typeof window.runSiteSearch === "function") {
          window.runSiteSearch(searchInput.value);
        }
      });
      searchInput.addEventListener("keydown", (e) => {
        if (typeof window.searchKeyNav === "function") {
          window.searchKeyNav(e);
        }
      });
    }

  } catch (err) {
    console.warn("Layout injection warning:", err);
  }
});
