/**
 * Signage Basket — Live Nameplate Preview Engine
 * Handles real-time typography scaling, materials, and prefilled WhatsApp dispatch.
 */

(function () {
  function initLivePreview() {
    const surnameInput = document.getElementById("previewSurnameInput");
    const namesInput = document.getElementById("previewNamesInput");
    const surnameDisplay = document.getElementById("previewPlateSurname");
    const namesDisplay = document.getElementById("previewPlateNames");
    const plate = document.getElementById("previewPlate");
    const whatsappBtn = document.getElementById("previewRequestBtn");

    if (!plate || !surnameInput || !namesInput) return;

    const materialInputs = document.querySelectorAll('input[name="previewMaterial"]');
    const styleInputs = document.querySelectorAll('input[name="previewStyle"]');

    // Auto-fit function for typography inside plate
    function fitText(element, maxFontSize, minFontSize) {
      if (!element || !element.parentElement) return;
      let currentSize = maxFontSize;
      element.style.fontSize = currentSize + "px";
      const maxWidth = element.parentElement.clientWidth * 0.92;

      while (element.scrollWidth > maxWidth && currentSize > minFontSize) {
        currentSize -= 1;
        element.style.fontSize = currentSize + "px";
      }
    }

    function updatePreview() {
      const surnameVal = (surnameInput.value || "Sharma").trim();
      const namesVal = (namesInput.value || "Rajesh & Meena").trim();

      if (surnameDisplay) surnameDisplay.textContent = surnameVal;
      if (namesDisplay) namesDisplay.textContent = namesVal;

      // Fit text dynamically
      fitText(surnameDisplay, 34, 16);
      fitText(namesDisplay, 18, 11);

      // Material
      const activeMaterial = document.querySelector('input[name="previewMaterial"]:checked')?.value || "antique-brass";
      plate.setAttribute("data-material", activeMaterial);

      // Style
      const activeStyle = document.querySelector('input[name="previewStyle"]:checked')?.value || "classic";
      plate.setAttribute("data-style", activeStyle);

      // Update WhatsApp URL
      if (whatsappBtn) {
        const config = window.SIGNAGE_CONFIG || {};
        const rawPhone = config.whatsappRaw || "919999999999";
        const materialLabel = activeMaterial === "brushed-steel" ? "Brushed Steel" :
                              activeMaterial === "matte-black" ? "Matte Black" : "Antique Brass";
        const styleLabel = activeStyle === "modern" ? "Modern (Josefin Sans)" :
                           activeStyle === "script" ? "Script (Great Vibes)" : "Classic (Cormorant Garamond)";

        const msg = `Hi Signage Basket, I designed a nameplate using your Live Preview:\n` +
                    `• Surname: ${surnameVal}\n` +
                    `• Names: ${namesVal}\n` +
                    `• Material: ${materialLabel}\n` +
                    `• Style: ${styleLabel}\n\n` +
                    `Could you please share a free 3D design preview and price quote?`;

        whatsappBtn.href = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
      }
    }

    // Attach listeners
    surnameInput.addEventListener("input", updatePreview);
    namesInput.addEventListener("input", updatePreview);

    materialInputs.forEach((input) => input.addEventListener("change", updatePreview));
    styleInputs.forEach((input) => input.addEventListener("change", updatePreview));

    window.addEventListener("resize", () => {
      fitText(surnameDisplay, 34, 16);
      fitText(namesDisplay, 18, 11);
    });

    // Initial update
    updatePreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLivePreview);
  } else {
    initLivePreview();
  }
})();
