/**
 * Signage Basket - Work & Portfolio Engine (Phase 4 SEO Pass)
 * Projects data with descriptive location labels, alt texts & interactive lightbox.
 */

window.SIGNAGE_PROJECTS = [
  {
    id: "singfuels",
    name: "SingFuels",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-singfuels.jpg",
    alt: "LED glow sign board for SingFuels office, made by Signage Basket in Gandhidham, Gujarat"
  },
  {
    id: "shoolin",
    name: "Shoolin Trade Link LLP",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-shoolin.jpg",
    alt: "3D acrylic letter sign for Shoolin Trade Link LLP in Gandhidham, Gujarat"
  },
  {
    id: "shoolin-board",
    name: "Shoolin Info Board",
    category: "Boards",
    categorySlug: "boards",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-shoolin-board.jpg",
    alt: "Acrylic directory office board for Shoolin in Gandhidham, Gujarat"
  },
  {
    id: "core-barbell",
    name: "Core & Barbell Gym",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    location: "Kutch, Gujarat",
    img: "assets/images/work-core-barbell.jpg",
    alt: "Gym glow sign board and wall logo for Core and Barbell in Kutch, Gujarat"
  },
  {
    id: "mishvik",
    name: "Mishvik Villa A-6",
    category: "Nameplates",
    categorySlug: "nameplates",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-mishvik.jpg",
    alt: "Bespoke house name plate design for Mishvik Villa in Gandhidham, Gujarat"
  },
  {
    id: "dedipya",
    name: "Dedipya Sheth & Associates",
    category: "Boards",
    categorySlug: "boards",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-dedipya.jpg",
    alt: "Corporate acrylic office board for Dedipya Sheth and Associates in Gandhidham, Gujarat"
  },
  {
    id: "integrated",
    name: "Integrated Service Solutions",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    location: "Kutch, Gujarat",
    img: "assets/images/work-integrated.jpg",
    alt: "Commercial front-lit signage board for Integrated Service Solutions in Kutch, Gujarat"
  },
  {
    id: "wall-of-fame",
    name: "Wall of Fame Panel",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-wall-of-fame.jpg",
    alt: "Interior wall branding and wall of fame acrylic panel in Gandhidham, Gujarat"
  },
  {
    id: "hermes",
    name: "Hermes Tradex",
    category: "Boards",
    categorySlug: "boards",
    location: "Gandhidham, Gujarat",
    img: "assets/images/work-hermes.jpg",
    alt: "Acrylic office door plate for Hermes Tradex in Gandhidham, Gujarat"
  },
  {
    id: "elysian",
    name: "The Elysian Facade",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    location: "Kutch, Gujarat",
    img: "assets/images/work-elysian.jpg",
    alt: "Architectural building facade LED glow sign for The Elysian in Kutch, Gujarat"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  try {
    const galleryGrid = document.getElementById("galleryGrid");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const lightboxType = document.getElementById("lightboxType");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");

    if (!galleryGrid) return;

    let activeFilter = "all";
    let currentIndex = 0;
    let filteredProjects = [...window.SIGNAGE_PROJECTS];

    // Render Gallery Items
    function renderGallery(projects) {
      galleryGrid.innerHTML = "";
      projects.forEach((proj, idx) => {
        const card = document.createElement("article");
        card.className = "gallery-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `View details for ${proj.name} - ${proj.category} in ${proj.location}`);

        card.innerHTML = `
          <div class="gallery-card-img-wrapper img-fallback-wrapper" data-title="${proj.name}">
            <img src="${proj.img}" alt="${proj.alt}" class="project-img" width="400" height="360" loading="lazy" decoding="async" onerror="this.style.opacity='0';">
          </div>
          <div class="gallery-card-meta">
            <div>
              <h3 class="gallery-card-title">${proj.name}</h3>
              <div style="font-size: 0.8rem; color: var(--slate); margin-top: 0.2rem;">${proj.location}</div>
            </div>
            <span class="gallery-card-tag">${proj.category}</span>
          </div>
        `;

        card.addEventListener("click", () => openLightbox(idx));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox(idx);
          }
        });

        galleryGrid.appendChild(card);
      });
    }

    // Initial Render
    renderGallery(filteredProjects);

    // Filter Logic
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        activeFilter = btn.getAttribute("data-filter") || "all";

        if (activeFilter === "all") {
          filteredProjects = [...window.SIGNAGE_PROJECTS];
        } else {
          filteredProjects = window.SIGNAGE_PROJECTS.filter(
            (p) => p.categorySlug === activeFilter || p.category.toLowerCase().includes(activeFilter)
          );
        }

        if (typeof window.gsap !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          window.gsap.to(galleryGrid, {
            opacity: 0,
            y: 10,
            duration: 0.25,
            onComplete: () => {
              renderGallery(filteredProjects);
              window.gsap.to(galleryGrid, { opacity: 1, y: 0, duration: 0.35 });
            }
          });
        } else {
          renderGallery(filteredProjects);
        }
      });
    });

    // Lightbox Controls
    function openLightbox(index) {
      if (!lightboxModal) return;
      currentIndex = index;
      updateLightboxContent();
      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden";

      if (window.lenis) {
        try { window.lenis.stop(); } catch (e) {}
      }
    }

    function closeLightbox() {
      if (!lightboxModal) return;
      lightboxModal.classList.remove("active");
      document.body.style.overflow = "";

      if (window.lenis) {
        try { window.lenis.start(); } catch (e) {}
      }
    }

    function updateLightboxContent() {
      const item = filteredProjects[currentIndex];
      if (!item) return;
      if (lightboxImg) {
        lightboxImg.src = item.img;
        lightboxImg.alt = item.alt;
      }
      if (lightboxTitle) lightboxTitle.textContent = `${item.name} (${item.location})`;
      if (lightboxType) lightboxType.textContent = item.category;
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + filteredProjects.length) % filteredProjects.length;
      updateLightboxContent();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % filteredProjects.length;
      updateLightboxContent();
    }

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", showPrev);
    if (lightboxNext) lightboxNext.addEventListener("click", showNext);

    if (lightboxModal) {
      lightboxModal.addEventListener("click", (e) => {
        if (e.target === lightboxModal) closeLightbox();
      });
    }

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
      if (!lightboxModal || !lightboxModal.classList.contains("active")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    });

    // Touch Swipe Support
    let touchStartX = 0;
    if (lightboxModal) {
      lightboxModal.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });

      lightboxModal.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) showNext();
          else showPrev();
        }
      }, { passive: true });
    }

  } catch (err) {
    console.warn("Work gallery script notice:", err);
  }
});
