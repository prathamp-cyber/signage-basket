/**
 * Signage Basket - Work & Portfolio Engine
 * Contains projects data, category filter logic & interactive lightbox.
 */

window.SIGNAGE_PROJECTS = [
  {
    id: "singfuels",
    name: "SingFuels",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    img: "assets/images/work-singfuels.jpg",
    alt: "SingFuels Illuminated Backlit Logo Sign Board"
  },
  {
    id: "shoolin",
    name: "Shoolin Trade Link LLP",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    img: "assets/images/work-shoolin.jpg",
    alt: "Shoolin Trade Link 3D Metallic Glow Sign"
  },
  {
    id: "shoolin-board",
    name: "Shoolin Info Board",
    category: "Boards",
    categorySlug: "boards",
    img: "assets/images/work-shoolin-board.jpg",
    alt: "Shoolin Directory Acrylic Board"
  },
  {
    id: "core-barbell",
    name: "Core & Barbell Gym",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    img: "assets/images/work-core-barbell.jpg",
    alt: "Core & Barbell Gym Interior Wall & Glow Sign"
  },
  {
    id: "mishvik",
    name: "Mishvik Villa A-6",
    category: "Nameplates",
    categorySlug: "nameplates",
    img: "assets/images/work-mishvik.jpg",
    alt: "Mishvik Villa Luxury Acrylic Home Nameplate"
  },
  {
    id: "dedipya",
    name: "Dedipya Sheth & Associates",
    category: "Boards",
    categorySlug: "boards",
    img: "assets/images/work-dedipya.jpg",
    alt: "Dedipya Sheth Corporate Acrylic Sign Board"
  },
  {
    id: "integrated",
    name: "Integrated Service Solutions",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    img: "assets/images/work-integrated.jpg",
    alt: "Integrated Service Solutions Office Branding"
  },
  {
    id: "wall-of-fame",
    name: "Wall of Fame Panel",
    category: "Office & Interiors",
    categorySlug: "office-interiors",
    img: "assets/images/work-wall-of-fame.jpg",
    alt: "Wall of Fame Acrylic Feature Installation"
  },
  {
    id: "hermes",
    name: "Hermes Tradex",
    category: "Boards",
    categorySlug: "boards",
    img: "assets/images/work-hermes.jpg",
    alt: "Hermes Tradex Professional Office Door Plate"
  },
  {
    id: "elysian",
    name: "The Elysian Facade",
    category: "Glow Signs",
    categorySlug: "glow-signs",
    img: "assets/images/work-elysian.jpg",
    alt: "The Elysian Architectural Facade Glow Sign"
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
        card.setAttribute("aria-label", `View ${proj.name} project details`);

        card.innerHTML = `
          <div class="gallery-card-img-wrapper img-fallback-wrapper" data-title="${proj.name}">
            <img src="${proj.img}" alt="${proj.alt}" class="project-img" loading="lazy" onerror="this.style.opacity='0';">
          </div>
          <div class="gallery-card-meta">
            <h3 class="gallery-card-title">${proj.name}</h3>
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
      if (lightboxTitle) lightboxTitle.textContent = item.name;
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

    // Touch Swipe Gesture Support
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
