/**
 * Signage Basket - Main Engine (Progressive Enhancement & Failsafe Architecture)
 */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  // 1. FAILSAFE TIMER: Force hide preloader & curtain after 3s, restore full visibility
  const failsafeTimer = setTimeout(() => {
    forceRestoreVisibility("Failsafe timeout reached");
  }, 3000);

  function forceRestoreVisibility(reason) {
    root.classList.remove("js-anim");
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.display = "none";
      preloader.style.pointerEvents = "none";
    }
    const curtain = document.getElementById("pageCurtain");
    if (curtain) {
      curtain.classList.remove("active");
      curtain.style.display = "none";
      curtain.style.pointerEvents = "none";
    }
    // Make sure all elements are visible
    document.querySelectorAll(".hero-mask-target, .hero-fade, .intro-word, .process-step, .reveal-up").forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // 2. CHECK REDUCED MOTION & LIBRARY AVAILABILITY
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const librariesAvailable =
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined" &&
    typeof window.Lenis !== "undefined";

  if (prefersReducedMotion || !librariesAvailable) {
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("Reduced motion or missing libraries");
    initImageFallbackHandlers();
    return;
  }

  // Enable animation class only when libraries are confirmed
  root.classList.add("js-anim");

  // 3. SAFE ANIMATION EXECUTION INSIDE TRY/CATCH
  try {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const Lenis = window.Lenis;

    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis (Only on desktop width > 900px and non-touch)
    let lenis;
    const isMobileOrTouch = window.innerWidth <= 900 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (!isMobileOrTouch) {
      lenis = new Lenis({
        duration: 1.2,
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

    // Preloader Logic (Index page)
    const preloader = document.getElementById("preloader");
    if (preloader) {
      const hasVisited = sessionStorage.getItem("sb_visited");
      if (hasVisited) {
        preloader.style.display = "none";
        preloader.style.pointerEvents = "none";
        initHeroAnimations(gsap);
      } else {
        const tl = gsap.timeline({
          onComplete: () => {
            preloader.style.display = "none";
            preloader.style.pointerEvents = "none";
            sessionStorage.setItem("sb_visited", "true");
            initHeroAnimations(gsap);
          }
        });

        tl.to("#preloaderBrand", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
          .to("#preloaderLine", { scaleX: 1, duration: 0.5, ease: "power2.inOut" })
          .to(preloader, { yPercent: -100, duration: 0.6, ease: "power3.inOut", delay: 0.2 });
      }
    } else {
      initHeroAnimations(gsap);
    }

    // Page Curtain Interceptor
    const curtain = document.getElementById("pageCurtain");
    if (curtain) {
      curtain.style.display = "flex";
      gsap.fromTo(curtain, { yPercent: 0 }, {
        yPercent: -100,
        duration: 0.5,
        ease: "power3.inOut",
        onComplete: () => {
          curtain.style.display = "none";
          curtain.style.pointerEvents = "none";
        }
      });

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
            curtain.style.display = "flex";
            curtain.style.pointerEvents = "auto";
            curtain.classList.add("active");
            gsap.fromTo(curtain, { yPercent: 100 }, {
              yPercent: 0,
              duration: 0.4,
              ease: "power3.inOut",
              onComplete: () => { window.location.href = href; }
            });
          });
        }
      });
    }

    // Hero Animations
    function initHeroAnimations(gsapRef) {
      const heroTl = gsapRef.timeline({
        onComplete: () => clearTimeout(failsafeTimer)
      });

      heroTl.to(".hero-mask-target", {
        yPercent: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power4.out"
      })
      .to(".hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.4");
    }

    // Intro Section Scroll-Scrubbed Text
    const introText = document.getElementById("introText");
    if (introText) {
      const words = introText.innerText.split(" ");
      introText.innerHTML = words.map(w => `<span class="intro-word">${w}</span>`).join(" ");

      const introWords = introText.querySelectorAll(".intro-word");
      gsap.timeline({
        scrollTrigger: {
          trigger: ".intro-section",
          start: "top 75%",
          end: "bottom 45%",
          scrub: 0.5
        }
      }).to(introWords, {
        opacity: 1,
        stagger: 0.1,
        ease: "power1.inOut"
      });
    }

    // Services Hover Image Follow (Desktop > 900px)
    const floatImgContainer = document.getElementById("serviceFloatImg");
    const serviceRows = document.querySelectorAll(".service-row");

    if (floatImgContainer && serviceRows.length > 0 && window.innerWidth > 900) {
      const floatImg = floatImgContainer.querySelector("img");
      serviceRows.forEach((row) => {
        const imgSrc = row.getAttribute("data-img");
        row.addEventListener("mouseenter", () => {
          if (imgSrc && floatImg) {
            floatImg.src = imgSrc;
            floatImgContainer.classList.add("active");
          }
        });
        row.addEventListener("mousemove", (e) => {
          gsap.to(floatImgContainer, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        row.addEventListener("mouseleave", () => {
          floatImgContainer.classList.remove("active");
        });
        row.addEventListener("click", () => {
          window.location.href = "collection.html";
        });
      });
    }

    // Selected Work Pinned Horizontal Scroll (> 900px ONLY)
    const workTrack = document.getElementById("horizontalTrack");
    const workSection = document.getElementById("workSection");

    if (workTrack && workSection && window.innerWidth > 900) {
      const getScrollAmount = () => -(workTrack.scrollWidth - window.innerWidth + window.innerWidth * 0.1);
      gsap.to(workTrack, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: workSection,
          start: "top top",
          end: () => `+=${workTrack.scrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    }

    // Craft Process Progress
    const timelineProgress = document.getElementById("timelineProgress");
    const processSteps = document.querySelectorAll(".process-step");
    const processSection = document.getElementById("processSection");

    if (timelineProgress && processSection) {
      gsap.to(timelineProgress, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: processSection,
          start: "top 60%",
          end: "bottom 60%",
          scrub: true
        }
      });

      processSteps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 70%",
          end: "bottom 30%",
          onEnter: () => step.classList.add("active"),
          onLeave: () => step.classList.remove("active"),
          onEnterBack: () => step.classList.add("active"),
          onLeaveBack: () => step.classList.remove("active")
        });
      });
    }

    // Header Scroll Controller
    const header = document.getElementById("mainHeader");
    if (header) {
      let lastScrollY = window.scrollY;
      window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
        if (currentScrollY > 200 && currentScrollY > lastScrollY) {
          header.classList.add("header-hidden");
        } else {
          header.classList.remove("header-hidden");
        }
        lastScrollY = currentScrollY;
      });
    }

    // Custom Cursor & Magnetic Buttons (Desktop Pointer Fine)
    if (window.matchMedia("(pointer: fine)").matches && window.innerWidth > 900) {
      const cursor = document.createElement("div");
      cursor.className = "custom-cursor";
      document.body.appendChild(cursor);

      window.addEventListener("mousemove", (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      document.querySelectorAll("a, button, .service-row, .project-card, .btn").forEach((el) => {
        el.addEventListener("mouseenter", () => cursor.classList.add("hovered"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("hovered"));
      });
    }

  } catch (err) {
    console.warn("Animation setup caught error, falling back to static layout:", err);
    clearTimeout(failsafeTimer);
    forceRestoreVisibility("JS Execution Error");
  }

  // 4. Image Fallback Handlers
  initImageFallbackHandlers();
});

function initImageFallbackHandlers() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function () {
      this.style.opacity = "0";
      this.style.pointerEvents = "none";
      const parent = this.closest(".img-fallback-wrapper") || this.parentElement;
      if (parent) {
        parent.classList.add("img-fallback-wrapper");
        if (!parent.getAttribute("data-title")) {
          parent.setAttribute("data-title", this.getAttribute("alt") || "Signage Basket Craft");
        }
      }
    });
  });
}
