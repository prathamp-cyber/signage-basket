/**
 * Signage Basket - Shared Layout Injector (Phase 3 Retheme & Logo Badge)
 * Injects Header with Logo, Mobile Overlay, Footer with Back to Top link,
 * Curtain Logo, and Floating WhatsApp Button.
 */

document.addEventListener("DOMContentLoaded", () => {
  try {
    const config = window.SIGNAGE_CONFIG || {
      phone: "+91 XXXXX XXXXX",
      whatsapp: "+91 XXXXX XXXXX",
      whatsappRaw: "919999999999",
      email: "hello@signagebasket.com",
      address: "Station Road, Bhuj, Kutch, Gujarat 370001",
      instagram: "https://instagram.com/signagebasket",
      instagramHandle: "@signagebasket",
      whatsappDefaultMsg: "Hi Signage Basket, I'd like a quote for a nameplate/signage."
    };

    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    // 1. Inject Page Transition Curtain with Logo Badge
    if (!document.querySelector(".page-curtain")) {
      const curtain = document.createElement("div");
      curtain.className = "page-curtain";
      curtain.id = "pageCurtain";
      curtain.innerHTML = `
        <img src="assets/images/logo.jpeg" alt="Signage Basket" class="curtain-logo-img" width="48" height="48">
        <div class="page-curtain-line"></div>
      `;
      document.body.prepend(curtain);
    }

    // 2. Inject Shared Header
    const headerPlaceholder = document.getElementById("siteHeaderContainer");
    if (!document.querySelector(".site-header")) {
      const headerHtml = `
        <header class="site-header" id="mainHeader">
          <div class="header-inner">
            <a href="index.html" class="site-logo" aria-label="Signage Basket Home">
              <img src="assets/images/logo.jpeg" alt="Signage Basket" class="site-logo-img" width="40" height="40" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';">
              <span class="logo-fallback-text" style="display:none; font-family: var(--font-display);">Signage <em style="color:var(--bronze);">Basket</em></span>
            </a>
            <nav class="nav-desktop">
              <a href="index.html" class="nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a>
              <a href="collection.html" class="nav-link ${currentPath === 'collection.html' ? 'active' : ''}">Collection</a>
              <a href="our-work.html" class="nav-link ${currentPath === 'our-work.html' ? 'active' : ''}">Our Work</a>
              <a href="contact.html" class="nav-link ${currentPath === 'contact.html' ? 'active' : ''}">Contact</a>
            </nav>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <a href="contact.html" class="btn btn-outline" style="padding: 0.6rem 1.4rem; font-size: 0.8rem;">
                <span>Get a Quote</span>
                <span class="btn-arrow">→</span>
              </a>
              <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle Mobile Navigation Menu">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
            </div>
          </div>
        </header>
        
        <div class="mobile-nav-overlay" id="mobileNavOverlay">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
            <img src="assets/images/logo.jpeg" alt="Signage Basket" class="mobile-logo-img" width="48" height="48">
          </div>
          <div class="mobile-nav-links">
            <a href="index.html" class="mobile-nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a>
            <a href="collection.html" class="mobile-nav-link ${currentPath === 'collection.html' ? 'active' : ''}">Collection</a>
            <a href="our-work.html" class="mobile-nav-link ${currentPath === 'our-work.html' ? 'active' : ''}">Our Work</a>
            <a href="contact.html" class="mobile-nav-link ${currentPath === 'contact.html' ? 'active' : ''}">Contact</a>
          </div>
          <div class="mobile-nav-footer">
            <p><strong style="color: var(--charcoal);">Phone:</strong> ${config.phone}</p>
            <p><strong style="color: var(--charcoal);">Email:</strong> ${config.email}</p>
            <p><strong style="color: var(--charcoal);">Location:</strong> ${config.address}</p>
          </div>
        </div>
      `;

      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
      } else {
        document.body.insertAdjacentHTML("afterbegin", headerHtml);
      }
    }

    // 3. Inject Shared Footer
    const footerPlaceholder = document.getElementById("siteFooterContainer");
    if (!document.querySelector(".site-footer")) {
      const footerHtml = `
        <footer class="site-footer">
          <div class="footer-inner">
            <div class="footer-statement">
              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem;">
                <img src="assets/images/logo.jpeg" alt="Signage Basket" class="footer-logo-img" width="56" height="56">
                <span style="font-family: var(--font-display); font-size: 1.8rem; color: var(--paper);">Signage <em style="color:var(--taupe);">Basket</em></span>
              </div>
              <h2 class="footer-statement-title">
                Let’s make your name <span class="italic-gold" style="color: var(--taupe);">unforgettable.</span>
              </h2>
              <a href="contact.html" class="btn btn-inverted-primary">
                <span>Start Your Sign Project</span>
                <span class="btn-arrow">→</span>
              </a>
            </div>
            <div class="footer-grid">
              <div>
                <div class="footer-col-title">Navigation</div>
                <ul class="footer-links-list">
                  <li><a href="index.html" class="footer-link">Home</a></li>
                  <li><a href="collection.html" class="footer-link">Collection & Products</a></li>
                  <li><a href="our-work.html" class="footer-link">Our Work & Portfolio</a></li>
                  <li><a href="contact.html" class="footer-link">Contact & Inquiries</a></li>
                </ul>
              </div>
              <div>
                <div class="footer-col-title">Contact Studio</div>
                <div class="footer-contact-info">
                  <p><strong style="color: var(--paper);">Phone:</strong> <span data-config="phone">${config.phone}</span></p>
                  <p><strong style="color: var(--paper);">WhatsApp:</strong> <span data-config="whatsapp">${config.whatsapp}</span></p>
                  <p><strong style="color: var(--paper);">Email:</strong> <span data-config="email">${config.email}</span></p>
                  <p><strong style="color: var(--paper);">Address:</strong> <span data-config="address">${config.address}</span></p>
                </div>
              </div>
              <div>
                <div class="footer-col-title">Connect</div>
                <div class="footer-contact-info">
                  <p>Follow our latest installations & design showcases on Instagram:</p>
                  <p style="margin-top: 0.5rem;">
                    <a href="${config.instagram}" target="_blank" rel="noopener noreferrer" class="footer-link text-gold" style="color: var(--paper); font-weight: 600;">
                      ${config.instagramHandle} →
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div class="footer-bottom">
              <div>© 2026 Signage Basket. Crafting luxury nameplates & glow signs in Kutch.</div>
              <div>
                <a href="#top" id="backToTopBtn" style="color: var(--taupe); font-weight: 500;">Back to Top ↑</a>
              </div>
            </div>
          </div>
        </footer>
      `;

      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
      } else {
        document.body.appendChild(document.createRange().createContextualFragment(footerHtml));
      }

      // Smooth scroll back to top listener
      const backToTopBtn = document.getElementById("backToTopBtn");
      if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }

    // 4. Inject Floating WhatsApp Button
    if (!document.querySelector(".floating-whatsapp")) {
      const waMsg = encodeURIComponent(config.whatsappDefaultMsg || "Hi Signage Basket, I'd like a quote for a nameplate/signage.");
      const waUrl = `https://wa.me/${config.whatsappRaw}?text=${waMsg}`;
      const waBtn = document.createElement("a");
      waBtn.href = waUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener noreferrer";
      waBtn.className = "floating-whatsapp";
      waBtn.setAttribute("aria-label", "Contact Signage Basket on WhatsApp");
      waBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      `;
      document.body.appendChild(waBtn);
    }

    // 5. Mobile Toggle Event Listener
    const toggleBtn = document.getElementById("mobileNavToggle");
    const mobileOverlay = document.getElementById("mobileNavOverlay");
    if (toggleBtn && mobileOverlay) {
      toggleBtn.addEventListener("click", () => {
        mobileOverlay.classList.toggle("open");
        const isOpen = mobileOverlay.classList.contains("open");
        toggleBtn.setAttribute("aria-expanded", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
      });

      mobileOverlay.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileOverlay.classList.remove("open");
          document.body.style.overflow = "";
        });
      });
    }

  } catch (e) {
    console.warn("Layout injection warning:", e);
  }
});
