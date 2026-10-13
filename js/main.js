/**
 * Signage Basket — Main Motion & Interaction Engine (Phase 6)
 * Animations in try/catch, start states only under html.js-anim,
 * visible by default. Installation strip drag/swipe. Lightbox.
 */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  // 1. FAILSAFE: Ensure visibility after 3s
  const failsafeTimer = setTimeout(() => {
    forceRestoreVisibility("Failsafe timeout");
  }, 3000);

  function forceRestoreVisibility(reason) {
    root.classList.remove("js-anim");
    document.querySelectorAll(".reveal-up, .hero-content, .hero-bg-img").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // 2. QUERY PARAMS: Auto-populate contact form
  try {
    const urlParams  = new URLSearchParams(window.location.search);
    const designSlug = urlParams.get("design");
    const material   = urlParams.get("material");
    const space      = urlParams.get("space");
    const type       = urlParams.get("type");

    const detailsField  = document.getElementById("details");
    const serviceSelect = document.getElementById("serviceType");

    if (designSlug) {
      const catalog = window.SIGNAGE_PRODUCTS || [];
      const item = catalog.find((p) => p.slug === designSlug);
      const designName = item ? item.name : decodeURIComponent(designSlug.replace(/-/g, " "));
      if (detailsField) {
        let prefill = `Inquiry regarding "${designName}". Please share details and free 3D design preview.`;
        if (material) prefill += ` Preferred material: ${material}.`;
        if (space)    prefill += ` Space: ${space}.`;
        detailsField.value = prefill;
      }
      if (serviceSelect && item && item.category) {
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].text.toLowerCase().includes(item.category.toLowerCase())) {
            serviceSelect.selectedIndex = i;
            break;
          }
        }
      }
    } else {
      // Build a plain prefill from material/space params
      if ((material || space) && detailsField && !detailsField.value) {
        let parts = [];
        if (material) parts.push(`Material: ${material}`);
        if (space)    parts.push(`Space: ${space}`);
        detailsField.value = parts.join(", ") + ". Please share a free design preview.";
      }
    }

    if (type && serviceSelect) {
      const paramMap = {
        "home-nameplates": "Home Nameplate",
        "glow-signs":      "LED / Glow Sign",
        "3d-letters":      "3D Letter Sign",
        "office-boards":   "Acrylic Office Board",
        "wall-branding":   "Interior Wall Branding"
      };
      if (paramMap[type]) serviceSelect.value = paramMap[type];
    }
  } catch (e) {
    console.warn("Query param parsing error:", e);
  }

  // 3. FAQ ACCORDION
  try {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
      const btn = item.querySelector(".faq-question");
      if (btn) {
        btn.addEventListener("click", () => {
          const isOpen = item.classList.contains("active");
          faqItems.forEach((other) => {
            other.classList.remove("active");
            const ob = other.querySelector(".faq-question");
            if (ob) ob.setAttribute("aria-expanded", "false");
          });
          if (!isOpen) {
            item.classList.add("active");
            btn.setAttribute("aria-expanded", "true");
          }
        });
      }
    });
  } catch (e) {
    console.warn("Accordion error:", e);
  }

  // 4. INSTALLATION STRIP: drag/swipe
  try {
    const strip = document.querySelector(".strip-scroll");
    if (strip) {
      let isDown = false, startX = 0, scrollLeft = 0;
      strip.addEventListener("mousedown", (e) => {
        isDown = true;
        strip.classList.add("dragging");
        startX = e.pageX - strip.offsetLeft;
        scrollLeft = strip.scrollLeft;
      });
      strip.addEventListener("mouseleave", () => { isDown = false; strip.classList.remove("dragging"); });
      strip.addEventListener("mouseup",    () => { isDown = false; strip.classList.remove("dragging"); });
      strip.addEventListener("mousemove",  (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - strip.offsetLeft;
        strip.scrollLeft = scrollLeft - (x - startX) * 1.2;
      });

      // Arrow buttons
      const prevBtn = strip.closest(".strip-scroll-wrapper") && strip.closest(".strip-scroll-wrapper").querySelector(".prev-btn");
      const nextBtn = strip.closest(".strip-scroll-wrapper") && strip.closest(".strip-scroll-wrapper").querySelector(".next-btn");
      if (prevBtn) prevBtn.addEventListener("click", () => { strip.scrollBy({ left: -300, behavior: "smooth" }); });
      if (nextBtn) nextBtn.addEventListener("click", () => { strip.scrollBy({ left:  300, behavior: "smooth" }); });
    }
  } catch (e) {
    console.warn("Strip drag error:", e);
  }

  // 5. GLOBAL LIGHTBOX (for strip items and zoom buttons on index)
  try {
    const lightbox = document.getElementById("lightboxModal");
    if (!lightbox) {
      // Create a lightweight lightbox for pages that don't have one
      const lb = document.createElement("div");
      lb.id = "lightboxModal";
      lb.className = "lightbox-modal";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Image Lightbox");
      lb.innerHTML = `
        <button class="lightbox-close" id="lightboxClose" aria-label="Close"><span class="icon i-close" style="font-size:1.5rem;"></span></button>
        <div class="lightbox-content">
          <img src="" alt="Enlarged preview" id="lightboxImg">
          <div style="margin-top:1rem;color:#fff;display:flex;justify-content:space-between;align-items:center;">
            <h3 id="lightboxTitle" style="font-size:1.1rem;font-weight:500;color:#fff;"></h3>
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem;">
            <button id="lightboxPrev" class="lightbox-nav-btn"><span class="icon i-arrow-right" style="transform:scaleX(-1);"></span> Prev</button>
            <button id="lightboxNext" class="lightbox-nav-btn">Next <span class="icon i-arrow-right"></span></button>
          </div>
        </div>`;
      document.body.appendChild(lb);
    }

    // Gather all lightbox-triggerable images
    let lbImages = [];
    let lbIndex  = 0;

    function openLightbox(img, title, idx, images) {
      const modal    = document.getElementById("lightboxModal");
      const lbImg    = document.getElementById("lightboxImg");
      const lbTitle  = document.getElementById("lightboxTitle");
      if (!modal || !lbImg) return;
      lbImages = images || [{ src: img, title: title || "" }];
      lbIndex  = idx || 0;
      lbImg.src = lbImages[lbIndex].src;
      lbImg.alt = lbImages[lbIndex].title || "Signage project";
      if (lbTitle) lbTitle.textContent = lbImages[lbIndex].title || "";
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      const modal = document.getElementById("lightboxModal");
      if (modal) modal.classList.remove("active");
      document.body.style.overflow = "";
    }

    function navLightbox(dir) {
      const modal   = document.getElementById("lightboxModal");
      const lbImg   = document.getElementById("lightboxImg");
      const lbTitle = document.getElementById("lightboxTitle");
      if (!modal || !lbImages.length) return;
      lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
      if (lbImg) { lbImg.src = lbImages[lbIndex].src; lbImg.alt = lbImages[lbIndex].title || ""; }
      if (lbTitle) lbTitle.textContent = lbImages[lbIndex].title || "";
    }

    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("#lightboxClose");
      const lb       = document.getElementById("lightboxModal");
      if (closeBtn) { closeLightbox(); return; }
      if (lb && e.target === lb) { closeLightbox(); return; }
      if (e.target.closest("#lightboxPrev")) { navLightbox(-1); return; }
      if (e.target.closest("#lightboxNext")) { navLightbox(1);  return; }

      // Zoom button on product cards
      const zoomBtn = e.target.closest(".product-zoom-btn");
      if (zoomBtn) {
        e.preventDefault();
        const wrap = zoomBtn.closest(".product-img-wrap");
        const img  = wrap && wrap.querySelector("img");
        if (img) {
          const allCards = Array.from(document.querySelectorAll(".product-img-wrap img"));
          const images   = allCards.map(i => ({ src: i.src, title: i.alt }));
          const idx      = allCards.indexOf(img);
          openLightbox(img.src, img.alt, idx, images);
        }
        return;
      }

      // Strip items
      const stripItem = e.target.closest(".strip-item");
      if (stripItem) {
        const img = stripItem.querySelector("img");
        if (img) {
          const allStrip = Array.from(document.querySelectorAll(".strip-item img"));
          const images   = allStrip.map(i => ({ src: i.src, title: i.alt }));
          openLightbox(img.src, img.alt, allStrip.indexOf(img), images);
        }
        return;
      }
    });

    document.addEventListener("keydown", (e) => {
      const lb = document.getElementById("lightboxModal");
      if (!lb || !lb.classList.contains("active")) return;
      if (e.key === "Escape")    closeLightbox();
      if (e.key === "ArrowLeft") navLightbox(-1);
      if (e.key === "ArrowRight")navLightbox(1);
    });

    // Expose for work.js to use
    window.openLightbox = openLightbox;

  } catch (e) {
    console.warn("Lightbox error:", e);
  }

  // 6. MOTION CHECK
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const librariesAvailable   = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (prefersReducedMotion || !librariesAvailable) {
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("Reduced motion or missing libraries");
    initImageFallbackHandlers();
    return;
  }

  root.classList.add("js-anim");

  // 7. GSAP & LENIS
  try {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    const isMobileOrTouch = window.innerWidth <= 900 || ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isMobileOrTouch && typeof window.Lenis !== "undefined") {
      const lenis = new window.Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 0
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const heroImg = document.querySelector(".hero-bg-img");
    if (heroImg) {
      gsap.fromTo(heroImg,
        { scale: 1.08 },
        { scale: 1, duration: 1.6, ease: "power2.out", onComplete: () => clearTimeout(failsafeTimer) }
      );
      if (!isMobileOrTouch) {
        gsap.to(heroImg, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true }
        });
      }
    } else {
      clearTimeout(failsafeTimer);
    }

    const reveals = document.querySelectorAll(".reveal-up");
    if (reveals.length > 0) {
      ScrollTrigger.batch(".reveal-up", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" });
        }
      });
    }

  } catch (err) {
    console.warn("GSAP animation warning:", err);
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("JS Animation Error");
  }

  initImageFallbackHandlers();
});

function initImageFallbackHandlers() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function () {
      this.style.opacity = "0";
      const parent = this.closest(".product-img-wrap, .collection-img-wrap, .work-img-frame, .strip-item") || this.parentElement;
      if (parent) parent.style.backgroundColor = "var(--surface-2)";
    });
  });
}
