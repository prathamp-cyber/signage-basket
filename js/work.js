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
    const failedProjectIds = new Set();

    function checkGalleryEmpty() {
      const cards = galleryGrid.querySelectorAll(".gallery-card");
      let emptyMsg = galleryGrid.querySelector(".work-empty-state");
      if (cards.length === 0) {
        if (!emptyMsg) {
          const cfg = window.SIGNAGE_CONFIG || {};
          const waNum = cfg.whatsappRaw || "919999999999";
          const waMsg = encodeURIComponent(cfg.whatsappDefaultMsg || "Hi Signage Basket, I'd like to see your recent work photos.");
          const waUrl = `https://wa.me/${waNum}?text=${waMsg}`;

          emptyMsg = document.createElement("div");
          emptyMsg.className = "work-empty-state";
          emptyMsg.innerHTML = `
            <p>Project photos are being added. Message us on WhatsApp to see our recent work.</p>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-primary" title="Message on WhatsApp">
              <span class="icon i-whatsapp" aria-hidden="true"></span>
              <span>Message on WhatsApp</span>
              <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
            </a>
          `;
          galleryGrid.appendChild(emptyMsg);
        }
      } else {
        if (emptyMsg) emptyMsg.remove();
      }
    }
    window.handleWorkCardRemoved = checkGalleryEmpty;

    function getValidProjects(filter) {
      return (window.SIGNAGE_PROJECTS || []).filter((p) => {
        if (failedProjectIds.has(p.id)) return false;
        if (filter === "all") return true;
        return p.categorySlug === filter || p.category.toLowerCase().includes(filter);
      });
    }

    // Render Gallery Items
    function renderGallery(projects) {
      galleryGrid.innerHTML = "";
      if (projects.length === 0) {
        checkGalleryEmpty();
        return;
      }

      projects.forEach((proj) => {
        const card = document.createElement("article");
        card.className = "gallery-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("data-proj-id", proj.id);
        card.setAttribute("aria-label", `View details for ${proj.name} - ${proj.category} in ${proj.location}`);

        card.innerHTML = `
          <div class="gallery-card-img-wrapper" style="aspect-ratio:1/1;">
            <img src="${proj.img}" alt="${proj.alt}" class="project-img" width="500" height="500" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="const c=this.closest('.gallery-card');if(c){c.remove();}window.onWorkImgError && window.onWorkImgError('${proj.id}');">
          </div>
          <div class="gallery-card-meta">
            <div>
              <h3 class="gallery-card-title">${proj.name}</h3>
              <div style="font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem;">${proj.location}</div>
            </div>
            <span class="gallery-card-tag">${proj.category}</span>
          </div>
        `;

        card.addEventListener("click", () => openLightboxForCard(card));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightboxForCard(card);
          }
        });

        galleryGrid.appendChild(card);
      });

      checkGalleryEmpty();
    }

    window.onWorkImgError = function(id) {
      failedProjectIds.add(id);
      checkGalleryEmpty();
    };

    // Initial Render
    renderGallery(getValidProjects(activeFilter));
    setTimeout(checkGalleryEmpty, 300);
    setTimeout(checkGalleryEmpty, 1000);

    // Filter Logic
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        activeFilter = btn.getAttribute("data-filter") || "all";
        const filtered = getValidProjects(activeFilter);

        if (typeof window.gsap !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          window.gsap.to(galleryGrid, {
            opacity: 0,
            y: 10,
            duration: 0.25,
            onComplete: () => {
              renderGallery(filtered);
              window.gsap.to(galleryGrid, { opacity: 1, y: 0, duration: 0.35 });
            }
          });
        } else {
          renderGallery(filtered);
        }
      });
    });

    // Lightbox Controls - ONLY navigate existing items
    function getRemainingCards() {
      return Array.from(galleryGrid.querySelectorAll(".gallery-card"));
    }

    function openLightboxForCard(card) {
      const cards = getRemainingCards();
      const idx = cards.indexOf(card);
      if (idx !== -1) {
        openLightbox(idx);
      }
    }

    function openLightbox(index) {
      const cards = getRemainingCards();
      if (!lightboxModal || cards.length === 0) return;
      currentIndex = (index + cards.length) % cards.length;
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
      const cards = getRemainingCards();
      if (cards.length === 0) {
        closeLightbox();
        return;
      }
      currentIndex = (currentIndex + cards.length) % cards.length;
      const card = cards[currentIndex];
      const img = card.querySelector("img");
      const title = card.querySelector(".gallery-card-title")?.textContent || "";
      const loc = card.querySelector("div[style*='font-size: 0.8rem']")?.textContent || "";
      const cat = card.querySelector(".gallery-card-tag")?.textContent || "";

      if (lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
      }
      if (lightboxTitle) lightboxTitle.textContent = `${title} (${loc})`;
      if (lightboxType) lightboxType.textContent = cat;
    }

    function showPrev() {
      const cards = getRemainingCards();
      if (cards.length === 0) return;
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateLightboxContent();
    }

    function showNext() {
      const cards = getRemainingCards();
      if (cards.length === 0) return;
      currentIndex = (currentIndex + 1) % cards.length;
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
