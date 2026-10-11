/**
 * Signage Basket — Main Motion & Interaction Engine (Phase 5 E-commerce Reskin)
 * Light, smooth animations with Lenis, GSAP, and resilient failsafes.
 */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  // 1. FAILSAFE: Ensure visibility after 3s under any condition
  const failsafeTimer = setTimeout(() => {
    forceRestoreVisibility("Failsafe timeout reached");
  }, 3000);

  function forceRestoreVisibility(reason) {
    root.classList.remove("js-anim");
    document.querySelectorAll(".reveal-up, .hero-content, .hero-bg-img").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // 2. QUERY PARAMS: Auto-populate Contact Form from ?design=<slug>
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const designSlug = urlParams.get("design");
    if (designSlug) {
      const detailsField = document.getElementById("details");
      const serviceSelect = document.getElementById("serviceType");

      // Find matching item in catalog
      const catalog = window.SIGNAGE_PRODUCTS || [];
      const item = catalog.find((p) => p.slug === designSlug);
      const designName = item ? item.name : decodeURIComponent(designSlug.replace(/-/g, " "));

      if (detailsField) {
        detailsField.value = `Inquiry regarding "${designName}". Please share details and free 3D design preview.`;
      }
      if (serviceSelect && item && item.category) {
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].text.toLowerCase().includes(item.category.toLowerCase())) {
            serviceSelect.selectedIndex = i;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Query param parsing error:", e);
  }

  // 3. FAQ ACCORDION HANDLER (collection.html)
  try {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
      const questionBtn = item.querySelector(".faq-question");
      if (questionBtn) {
        questionBtn.addEventListener("click", () => {
          const isOpen = item.classList.contains("active");
          // Close others
          faqItems.forEach((other) => {
            other.classList.remove("active");
            const btn = other.querySelector(".faq-question");
            if (btn) btn.setAttribute("aria-expanded", "false");
          });
          // Toggle current
          if (!isOpen) {
            item.classList.add("active");
            questionBtn.setAttribute("aria-expanded", "true");
          }
        });
      }
    });
  } catch (e) {
    console.warn("Accordion initialization error:", e);
  }

  // 4. CHECK MOTION PREFERENCE & LIBRARIES
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const librariesAvailable =
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";

  if (prefersReducedMotion || !librariesAvailable) {
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("Reduced motion or missing libraries");
    initImageFallbackHandlers();
    return;
  }

  // Enable animation start states
  root.classList.add("js-anim");

  // 5. GSAP & LENIS SETUP
  try {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Lenis Smooth Scroll (Desktop Only)
    const isMobileOrTouch = window.innerWidth <= 900 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
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

    // Hero Image scale 1.08 -> 1 on load
    const heroImg = document.querySelector(".hero-bg-img");
    if (heroImg) {
      gsap.fromTo(heroImg, 
        { scale: 1.08 },
        { scale: 1, duration: 1.6, ease: "power2.out", onComplete: () => clearTimeout(failsafeTimer) }
      );

      // Slight parallax on scroll (desktop only)
      if (!isMobileOrTouch) {
        gsap.to(heroImg, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-section",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
    } else {
      clearTimeout(failsafeTimer);
    }

    // Reveal Up Elements
    const reveals = document.querySelectorAll(".reveal-up");
    if (reveals.length > 0) {
      ScrollTrigger.batch(".reveal-up", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out"
          });
        }
      });
    }

  } catch (err) {
    console.warn("GSAP animation initialization warning:", err);
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("JS Animation Error");
  }

  // 6. IMAGE FALLBACKS
  initImageFallbackHandlers();
});

function initImageFallbackHandlers() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function () {
      this.style.opacity = "0";
      const parent = this.closest(".product-img-wrap, .collection-img-wrap, .work-img-frame") || this.parentElement;
      if (parent) {
        parent.style.backgroundColor = "var(--surface-2)";
      }
    });
  });
}
