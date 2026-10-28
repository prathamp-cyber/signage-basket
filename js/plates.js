/**
 * Signage Basket — In-Code Plate Visualizer & Shared Viewer
 * Renders high-fidelity nameplate designs without external images.
 */

function renderPlate(plate, opts) {
  if (!plate) return "";
  opts = opts || {};

  const sceneKey = opts.scene || plate.scene || "plaster";
  const sceneClass = `plate-scene-${sceneKey}`;
  const mountClass = `plate-mount-${plate.mount || "wall"}`;
  const fontClass = `plate-font-${plate.font || "serif"}`;
  const isHanging = plate.mount === "hanging";
  const isCutout = plate.shape === "cutout";
  const isRect = plate.shape === "rect";
  const isRoundOrOval = plate.shape === "round" || plate.shape === "oval";
  const isBlackGold = plate.mat === "blackgold";

  const lines = opts.lines !== undefined ? opts.lines : (plate.lines || []);
  const zoom = opts.zoom || 1;
  const zoomStyle = zoom !== 1 ? `style="transform: scale(${zoom}); transform-origin: center center;"` : "";

  let hangingHtml = "";
  if (isHanging) {
    hangingHtml = `
      <div class="plate-hanging-bar" aria-hidden="true"></div>
      <div class="plate-hanging-chain plate-chain-left" aria-hidden="true"></div>
      <div class="plate-hanging-chain plate-chain-right" aria-hidden="true"></div>
    `;
  }

  let bodyHtml = "";
  if (isCutout) {
    const mainText = (lines && lines[0]) || "";
    bodyHtml = `
      <div class="plate-body plate-shape-cutout ${fontClass}" ${zoomStyle}>
        <div class="plate-content">
          <span class="plate-line plate-line-main plate-cutout-text">${mainText}</span>
          <span class="plate-cutout-bar" aria-hidden="true"></span>
        </div>
      </div>
    `;
  } else {
    const shapeClass = `plate-shape-${plate.shape || "rect"}`;
    const matClass = `plate-mat-${plate.mat || "brass"}`;

    let screwsHtml = "";
    if (isRect && plate.mat !== "led") {
      screwsHtml = `
        <span class="plate-screw plate-screw-tl" aria-hidden="true"></span>
        <span class="plate-screw plate-screw-tr" aria-hidden="true"></span>
        <span class="plate-screw plate-screw-bl" aria-hidden="true"></span>
        <span class="plate-screw plate-screw-br" aria-hidden="true"></span>
      `;
    }

    let ringHtml = "";
    if (isRoundOrOval || isBlackGold) {
      ringHtml = `<span class="plate-inner-ring" aria-hidden="true"></span>`;
    }

    const mainLine = (lines && lines[0]) || "";
    const subLine = (lines && lines[1]) || "";
    const subHtml = subLine ? `<span class="plate-line plate-line-sub">${subLine}</span>` : "";

    bodyHtml = `
      <div class="plate-body ${shapeClass} ${matClass} ${fontClass}" ${zoomStyle}>
        ${screwsHtml}
        ${ringHtml}
        <div class="plate-content">
          <span class="plate-line plate-line-main">${mainLine}</span>
          ${subHtml}
        </div>
      </div>
    `;
  }

  const plateLabel = (lines || []).join(" ") + " nameplate design";

  return `
    <div class="plate-scene ${sceneClass} ${mountClass}" role="img" aria-label="${plateLabel}">
      ${hangingHtml}
      ${bodyHtml}
    </div>
  `;
}

function autoFitPlates(root) {
  const scope = root || document;
  const scenes = scope.querySelectorAll(".plate-scene");
  scenes.forEach((scene) => {
    const body = scene.querySelector(".plate-body");
    if (!body) return;
    const bodyWidth = body.clientWidth || scene.clientWidth;
    const maxWidth = bodyWidth * 0.88;
    const lines = body.querySelectorAll(".plate-line");
    lines.forEach((line) => {
      line.style.fontSize = ""; // reset
      const scrollW = line.scrollWidth;
      if (scrollW > maxWidth && scrollW > 0) {
        const ratio = maxWidth / scrollW;
        const comp = window.getComputedStyle(line);
        const currentSize = parseFloat(comp.fontSize);
        if (currentSize) {
          line.style.fontSize = Math.floor(currentSize * ratio * 0.95) + "px";
        }
      }
    });
  });
}

function plateSlides(item, lines) {
  if (!item || !item.plate) return [];
  const currentLines = lines !== undefined ? lines : item.plate.lines;
  const isLed = item.plate.mat === "led";
  const scene3 = isLed ? "plaster" : "dark";

  return [
    {
      title: "Standard setting",
      scene: item.plate.scene || "plaster",
      html: renderPlate(item.plate, { lines: currentLines })
    },
    {
      title: "Concrete wall setting",
      scene: "concrete",
      html: renderPlate(item.plate, { scene: "concrete", lines: currentLines })
    },
    {
      title: isLed ? "Plaster wall setting" : "Dark textured setting",
      scene: scene3,
      html: renderPlate(item.plate, { scene: scene3, lines: currentLines })
    },
    {
      title: "Close-up detail",
      scene: item.plate.scene || "plaster",
      zoom: 1.9,
      html: renderPlate(item.plate, { zoom: 1.9, lines: currentLines })
    }
  ];
}

// Shared Modal Viewer Logic
let activeViewerSlides = [];
let activeViewerIndex = 0;
let lastFocusedElement = null;

function ensureViewerModal() {
  let overlay = document.getElementById("designViewer");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "design-viewer-overlay";
    overlay.id = "designViewer";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Design Viewer");
    overlay.innerHTML = `
      <div class="design-viewer-modal" id="designViewerModal">
        <button class="design-viewer-close-btn" id="viewerCloseBtn" aria-label="Close Design Viewer">
          <span class="icon i-close" aria-hidden="true"></span>
        </button>
        <button class="design-viewer-nav-btn design-viewer-prev-btn" id="viewerPrevBtn" aria-label="Previous Design">
          <span class="icon i-chevron-left" aria-hidden="true"></span>
        </button>
        <button class="design-viewer-nav-btn design-viewer-next-btn" id="viewerNextBtn" aria-label="Next Design">
          <span class="icon i-chevron-right" aria-hidden="true"></span>
        </button>
        <div class="design-viewer-scene-wrap" id="viewerScene"></div>
        <div class="design-viewer-info">
          <div class="design-viewer-title-box">
            <h3 id="viewerName"></h3>
            <p id="viewerMat"></p>
          </div>
          <a href="/contact" class="btn btn-primary" id="viewerRequestBtn">
            <span>Get a Quote</span>
            <span class="btn-arrow" aria-hidden="true"><span class="icon i-arrow-right"></span></span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeViewer();
    });
    const closeBtn = overlay.querySelector("#viewerCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeViewer);
    const prevBtn = overlay.querySelector("#viewerPrevBtn");
    if (prevBtn) prevBtn.addEventListener("click", prevViewerSlide);
    const nextBtn = overlay.querySelector("#viewerNextBtn");
    if (nextBtn) nextBtn.addEventListener("click", nextViewerSlide);

    window.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowLeft") prevViewerSlide();
      else if (e.key === "ArrowRight") nextViewerSlide();
    });
  }
  return overlay;
}

function updateViewerSlide() {
  const overlay = ensureViewerModal();
  const sceneEl = overlay.querySelector("#viewerScene");
  const nameEl = overlay.querySelector("#viewerName");
  const matEl = overlay.querySelector("#viewerMat");
  const reqBtn = overlay.querySelector("#viewerRequestBtn");

  const slide = activeViewerSlides[activeViewerIndex];
  if (!slide) return;

  if (sceneEl) {
    sceneEl.innerHTML = slide.html || (slide.plate ? renderPlate(slide.plate) : "");
    autoFitPlates(sceneEl);
  }
  if (nameEl) nameEl.textContent = slide.name || slide.title || "Design Preview";
  if (matEl) matEl.textContent = slide.material || slide.scene || "";
  if (reqBtn) {
    if (slide.slug) {
      reqBtn.href = `/design/${encodeURIComponent(slide.slug)}`;
      const span = reqBtn.querySelector("span:not(.btn-arrow)");
      if (span) span.textContent = "View Details";
    } else {
      reqBtn.href = "/contact";
      const span = reqBtn.querySelector("span:not(.btn-arrow)");
      if (span) span.textContent = "Get a Quote";
    }
  }
}

function prevViewerSlide() {
  if (!activeViewerSlides.length) return;
  activeViewerIndex = (activeViewerIndex - 1 + activeViewerSlides.length) % activeViewerSlides.length;
  updateViewerSlide();
}

function nextViewerSlide() {
  if (!activeViewerSlides.length) return;
  activeViewerIndex = (activeViewerIndex + 1) % activeViewerSlides.length;
  updateViewerSlide();
}

function openViewer(slidesOrSlug, index) {
  lastFocusedElement = document.activeElement;
  const overlay = ensureViewerModal();

  if (Array.isArray(slidesOrSlug)) {
    activeViewerSlides = slidesOrSlug;
    activeViewerIndex = index || 0;
  } else if (typeof slidesOrSlug === "string") {
    const catalog = (window.CATALOG && window.CATALOG["home-nameplates"] && window.CATALOG["home-nameplates"].items) || [];
    const idx = catalog.findIndex((i) => i.slug === slidesOrSlug);
    activeViewerSlides = catalog.map((it) => ({
      name: it.name,
      material: it.material,
      slug: it.slug,
      plate: it.plate,
      html: renderPlate(it.plate)
    }));
    activeViewerIndex = idx >= 0 ? idx : 0;
  }

  updateViewerSlide();
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  if (window.lenis && typeof window.lenis.stop === "function") window.lenis.stop();

  const closeBtn = overlay.querySelector("#viewerCloseBtn");
  if (closeBtn) closeBtn.focus();
}

function closeViewer() {
  const overlay = document.getElementById("designViewer");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
  if (window.lenis && typeof window.lenis.start === "function") window.lenis.start();
  if (lastFocusedElement) lastFocusedElement.focus();
}

window.renderPlate = renderPlate;
window.autoFitPlates = autoFitPlates;
window.plateSlides = plateSlides;
window.openViewer = openViewer;
window.closeViewer = closeViewer;
