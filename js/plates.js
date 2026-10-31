/**
 * Signage Basket — In-Code Plate Visualizer & Shared Viewer
 * Renders high-fidelity signage & nameplate designs without external images.
 */

function renderPlate(plate, opts) {
  if (!plate) return "";
  opts = opts || {};

  const sceneKey = opts.scene || plate.scene || "plaster";
  const sceneClass = `plate-scene-${sceneKey}`;
  const fontClass = `plate-font-${plate.font || "serif"}`;
  const lines = opts.lines !== undefined ? opts.lines : (plate.lines || []);
  const zoom = opts.zoom || 1;
  const zoomStyle = zoom !== 1 ? `style="transform: scale(${zoom}); transform-origin: center center;"` : "";

  let bodyHtml = "";

  // 1. TYPE: glowletters
  if (plate.type === "glowletters") {
    const mainText = (lines && lines[0]) || "";
    const subText = (lines && lines[1]) || "";
    const styleClass = `plate-glow-${plate.style || "halo"}`;
    const subHtml = subText ? `<span class="plate-line plate-glow-sub">${subText}</span>` : "";

    const glowContent = `
      <div class="plate-glowletters-wrap ${styleClass} ${fontClass}" ${zoomStyle}>
        <span class="plate-line plate-glowletters-main">${mainText}</span>
        ${subHtml}
      </div>
    `;

    if (sceneKey === "facade") {
      bodyHtml = `
        <div class="plate-facade-sky" aria-hidden="true"></div>
        <div class="plate-facade-band">
          ${glowContent}
        </div>
        <div class="plate-facade-windows" aria-hidden="true">
          <div class="plate-facade-window lit"></div>
          <div class="plate-facade-window"></div>
          <div class="plate-facade-window lit"></div>
          <div class="plate-facade-window"></div>
          <div class="plate-facade-window lit"></div>
          <div class="plate-facade-window"></div>
          <div class="plate-facade-window lit"></div>
          <div class="plate-facade-window lit"></div>
          <div class="plate-facade-window"></div>
          <div class="plate-facade-window lit"></div>
        </div>
      `;
    } else {
      bodyHtml = glowContent;
    }
  }

  // 2. TYPE: ledboard
  else if (plate.type === "ledboard") {
    const mainText = (lines && lines[0]) || "";
    const subText = (lines && lines[1]) || "";
    const styleClass = `plate-ledboard-${plate.style || "front"}`;
    const subHtml = subText ? `<span class="plate-line plate-ledboard-sub">${subText}</span>` : "";

    bodyHtml = `
      <div class="plate-ledboard-box ${styleClass} ${fontClass}" ${zoomStyle}>
        <span class="plate-line plate-ledboard-main">${mainText}</span>
        ${subHtml}
      </div>
    `;
  }

  // 3. TYPE: letters3d
  else if (plate.type === "letters3d") {
    const mainText = (lines && lines[0]) || "";
    const subText = (lines && lines[1]) || "";
    const styleClass = `plate-3d-${plate.style || "gold"}`;
    const subHtml = subText ? `<span class="plate-line plate-letters3d-sub">${subText}</span>` : "";

    bodyHtml = `
      <div class="plate-letters3d-wrap ${styleClass} ${fontClass}" ${zoomStyle}>
        <span class="plate-line plate-letters3d-main">${mainText}</span>
        ${subHtml}
      </div>
    `;
  }

  // 4. TYPE: board
  else if (plate.type === "board") {
    const styleKey = plate.style || "white";
    const isSteel = styleKey === "steel";
    const isDirectory = styleKey === "directory";
    const standoffClass = isSteel ? "plate-standoff plate-standoff-steel" : "plate-standoff";
    const standoffs = `
      <span class="${standoffClass} plate-standoff-tl" aria-hidden="true"></span>
      <span class="${standoffClass} plate-standoff-tr" aria-hidden="true"></span>
      <span class="${standoffClass} plate-standoff-bl" aria-hidden="true"></span>
      <span class="${standoffClass} plate-standoff-br" aria-hidden="true"></span>
    `;

    if (isDirectory) {
      const headerText = (lines && lines[0]) || "DIRECTORY";
      const rows = (lines || []).slice(1).map((row) => `
        <div class="plate-dir-row">
          <span class="plate-line">${row}</span>
          <span class="arrow">→</span>
        </div>
      `).join("");

      bodyHtml = `
        <div class="plate-wall-board plate-board-directory ${fontClass}" ${zoomStyle}>
          ${standoffs}
          <div class="plate-line plate-dir-header">${headerText}</div>
          <div class="plate-dir-rows">
            ${rows}
          </div>
        </div>
      `;
    } else {
      const isCompact = lines.length <= 2;
      const compactClass = isCompact ? "compact" : "";
      const mainLine = (lines && lines[0]) || "";
      const otherLines = (lines || []).slice(1);
      const dividerHtml = otherLines.length ? `<div class="plate-board-divider"></div>` : "";
      const linesHtml = otherLines.map((l) => `<div class="plate-line plate-board-line">${l}</div>`).join("");

      bodyHtml = `
        <div class="plate-wall-board plate-board-${styleKey} ${compactClass} ${fontClass}" ${zoomStyle}>
          ${standoffs}
          <div class="plate-line plate-board-title">${mainLine}</div>
          ${dividerHtml}
          <div class="plate-board-lines">
            ${linesHtml}
          </div>
        </div>
      `;
    }
  }

  // 5. TYPE: reception
  else if (plate.type === "reception") {
    const mainText = (lines && lines[0]) || "";
    const subText = (lines && lines[1]) || "";
    const styleClass = `plate-3d-${plate.style || "gold"}`;
    const subHtml = subText ? `<span class="plate-line plate-letters3d-sub">${subText}</span>` : "";

    bodyHtml = `
      <div class="plate-reception-scene" ${zoomStyle}>
        <div class="plate-reception-spotlight" aria-hidden="true"></div>
        <div class="plate-reception-letters plate-letters3d-wrap ${styleClass} ${fontClass}">
          <span class="plate-line plate-letters3d-main">${mainText}</span>
          ${subHtml}
        </div>
        <div class="plate-reception-counter" aria-hidden="true"></div>
      </div>
    `;
  }

  // 6. TYPE: studio
  else if (plate.type === "studio") {
    const mainText = (lines && lines[0]) || "";
    const subText = (lines && lines[1]) || "";
    const styleClass = `plate-3d-${plate.style || "white"}`;
    const subHtml = subText ? `<span class="plate-line plate-letters3d-sub plate-studio-sub">${subText}</span>` : "";

    bodyHtml = `
      <div class="plate-studio-wrap ${styleClass} ${fontClass}" ${zoomStyle}>
        <span class="plate-line plate-letters3d-main">${mainText}</span>
        ${subHtml}
        <div class="plate-studio-ledbar" aria-hidden="true"></div>
      </div>
    `;
  }

  // 7. TYPE: frames
  else if (plate.type === "frames") {
    const mainTitle = (lines && lines[0]) || "WALL OF FAME";
    const captionText = (lines && lines[1]) || "HONOREE";

    const framesHtml = [1, 2, 3].map(() => `
      <div class="plate-single-frame">
        <div class="plate-frame-box">
          <div class="plate-frame-mat">
            <div class="plate-silhouette">
              <div class="plate-sil-head"></div>
              <div class="plate-sil-body"></div>
            </div>
          </div>
        </div>
        <div class="plate-frame-caption">${captionText}</div>
      </div>
    `).join("");

    bodyHtml = `
      <div class="plate-frames-wrap ${fontClass}" ${zoomStyle}>
        <div class="plate-line plate-frames-title">${mainTitle}</div>
        <div class="plate-frames-grid">
          ${framesHtml}
        </div>
      </div>
    `;
  }

  // Default: Classic Nameplate Shapes (Rect, Round, Oval, Cutout)
  else {
    const mountClass = `plate-mount-${plate.mount || "wall"}`;
    const isHanging = plate.mount === "hanging";
    const isCutout = plate.shape === "cutout";
    const isRect = plate.shape === "rect";
    const isRoundOrOval = plate.shape === "round" || plate.shape === "oval";
    const isBlackGold = plate.mat === "blackgold";

    let hangingHtml = "";
    if (isHanging) {
      hangingHtml = `
        <div class="plate-hanging-bar" aria-hidden="true"></div>
        <div class="plate-hanging-chain plate-chain-left" aria-hidden="true"></div>
        <div class="plate-hanging-chain plate-chain-right" aria-hidden="true"></div>
      `;
    }

    if (isCutout) {
      const mainText = (lines && lines[0]) || "";
      bodyHtml = `
        ${hangingHtml}
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
        ${hangingHtml}
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
  }

  const plateLabel = (lines || []).join(" ") + " signage design";

  return `
    <div class="plate-scene ${sceneClass}" role="img" aria-label="${plateLabel}">
      ${bodyHtml}
    </div>
  `;
}

function autoFitPlates(root) {
  const scope = root || document;
  const scenes = scope.querySelectorAll(".plate-scene");
  scenes.forEach((scene) => {
    const maxWidth = (scene.clientWidth || 300) * 0.88;
    const lines = scene.querySelectorAll(".plate-line, .plate-glowletters-main, .plate-ledboard-main, .plate-letters3d-main, .plate-board-title, .plate-frames-title");
    lines.forEach((line) => {
      line.style.fontSize = "";
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
  const plate = item.plate;
  const specialTypes = ["facade", "reception", "studio", "frames"];
  const isSpecial = specialTypes.includes(plate.type) || plate.scene === "facade";

  if (isSpecial) {
    const scene = plate.scene || "dark";
    return [
      {
        title: "Standard setting",
        scene: scene,
        html: renderPlate(plate, { lines: currentLines, zoom: 1 })
      },
      {
        title: "Slight angle zoom",
        scene: scene,
        zoom: 1.25,
        html: renderPlate(plate, { lines: currentLines, zoom: 1.25 })
      },
      {
        title: "Full architectural view",
        scene: scene,
        html: renderPlate(plate, { lines: currentLines, zoom: 1 })
      },
      {
        title: "Close-up detail",
        scene: scene,
        zoom: 1.9,
        html: renderPlate(plate, { lines: currentLines, zoom: 1.9 })
      }
    ];
  }

  const isLed = plate.mat === "led" || plate.type === "glowletters" || plate.type === "ledboard";
  const scene3 = isLed ? "plaster" : "dark";

  return [
    {
      title: "Standard setting",
      scene: plate.scene || "plaster",
      html: renderPlate(plate, { lines: currentLines })
    },
    {
      title: "Concrete wall setting",
      scene: "concrete",
      html: renderPlate(plate, { scene: "concrete", lines: currentLines })
    },
    {
      title: isLed ? "Plaster wall setting" : "Dark textured setting",
      scene: scene3,
      html: renderPlate(plate, { scene: scene3, lines: currentLines })
    },
    {
      title: "Close-up detail",
      scene: plate.scene || "plaster",
      zoom: 1.9,
      html: renderPlate(plate, { zoom: 1.9, lines: currentLines })
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
    let allItems = [];
    if (window.CATALOG) {
      Object.keys(window.CATALOG).forEach((catKey) => {
        if (window.CATALOG[catKey] && Array.isArray(window.CATALOG[catKey].items)) {
          allItems = allItems.concat(window.CATALOG[catKey].items);
        }
      });
    }
    const idx = allItems.findIndex((i) => i.slug === slidesOrSlug);
    activeViewerSlides = allItems.map((it) => ({
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
