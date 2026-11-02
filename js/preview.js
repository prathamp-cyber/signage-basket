/**
 * Signage Basket — Live Nameplate Preview Engine (Phase 6)
 * Shape option added: Rectangle (3:2, radius 14px), Oval (3:2, 50% radius), Round (1:1, 50%).
 * WhatsApp message includes the selected shape.
 */

(function () {
  function initLivePreview() {
    const surnameInput  = document.getElementById("previewSurnameInput");
    const namesInput    = document.getElementById("previewNamesInput");
    const surnameDisplay= document.getElementById("previewPlateSurname");
    const namesDisplay  = document.getElementById("previewPlateNames");
    const plate         = document.getElementById("previewPlate");
    const whatsappBtn   = document.getElementById("previewRequestBtn");

    if (!plate || !surnameInput || !namesInput) return;

    const materialInputs = document.querySelectorAll('input[name="previewMaterial"]');
    const styleInputs    = document.querySelectorAll('input[name="previewStyle"]');
    const shapeInputs    = document.querySelectorAll('input[name="previewShape"]');

    // Auto-fit text inside plate
    function fitText(element, maxFontSize, minFontSize) {
      if (!element || !element.parentElement) return;
      let currentSize = maxFontSize;
      element.style.fontSize = currentSize + "px";
      // For oval/round use a tighter inset
      const shape = document.querySelector('input[name="previewShape"]:checked')?.value || "rectangle";
      const ratio = (shape === "oval" || shape === "round") ? 0.68 : 0.92;
      const maxWidth = element.parentElement.clientWidth * ratio;
      while (element.scrollWidth > maxWidth && currentSize > minFontSize) {
        currentSize -= 1;
        element.style.fontSize = currentSize + "px";
      }
    }

    function updatePreview() {
      const surnameVal = (surnameInput.value || "Sharma").trim();
      const namesVal   = (namesInput.value  || "Rajesh & Meena").trim();

      if (surnameDisplay) surnameDisplay.textContent = surnameVal;
      if (namesDisplay)   namesDisplay.textContent   = namesVal;

      fitText(surnameDisplay, 34, 16);
      fitText(namesDisplay,   18, 11);

      const activeMaterial = document.querySelector('input[name="previewMaterial"]:checked')?.value || "antique-brass";
      const activeStyle    = document.querySelector('input[name="previewStyle"]:checked')?.value    || "classic";
      const activeShape    = document.querySelector('input[name="previewShape"]:checked')?.value    || "rectangle";

      plate.setAttribute("data-material", activeMaterial);
      plate.setAttribute("data-style",    activeStyle);
      plate.setAttribute("data-shape",    activeShape);

      if (whatsappBtn) {
        const config = (window.SBData && window.SBData.settings) ? window.SBData.settings() : (window.SIGNAGE_CONFIG || {});
        const rawPhone = config.whatsappRaw || "919999999999";

        const materialLabel = activeMaterial === "brushed-steel" ? "Brushed Steel" :
                              activeMaterial === "matte-black"   ? "Matte Black"   : "Antique Brass";
        const styleLabel    = activeStyle === "modern" ? "Modern (Josefin Sans)" :
                              activeStyle === "script" ? "Script (Great Vibes)"  : "Classic (Cormorant Garamond)";
        const shapeLabel    = activeShape === "oval"   ? "Oval"                  :
                              activeShape === "round"  ? "Round"                 : "Rectangle";

        const msg = `Hi Signage Basket, I designed a nameplate using your Live Preview:\n` +
                    `• Surname: ${surnameVal}\n` +
                    `• Names: ${namesVal}\n` +
                    `• Material: ${materialLabel}\n` +
                    `• Style: ${styleLabel}\n` +
                    `• Shape: ${shapeLabel}\n\n` +
                    `Could you please share a free 3D design preview and price quote?`;

        whatsappBtn.href = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
      }
    }

    // Attach click handler on preview request button to send enquiry before opening WhatsApp
    if (whatsappBtn && !whatsappBtn.dataset.sbBound) {
      whatsappBtn.dataset.sbBound = "true";

      // Ensure hidden honeypot field exists in preview container
      let hp = document.getElementById("previewHoneypot");
      if (!hp) {
        hp = document.createElement("input");
        hp.type = "text";
        hp.id = "previewHoneypot";
        hp.name = "website";
        hp.tabIndex = -1;
        hp.autocomplete = "off";
        hp.style.cssText = "display:none !important; position:absolute !important; left:-9999px !important;";
        whatsappBtn.parentNode.insertBefore(hp, whatsappBtn);
      }

      whatsappBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const hpVal = hp ? hp.value : "";
        if (hpVal) return;

        const surnameVal = (surnameInput.value || "Sharma").trim();
        const namesVal   = (namesInput.value  || "Rajesh & Meena").trim();
        const activeMaterial = document.querySelector('input[name="previewMaterial"]:checked')?.value || "antique-brass";
        const activeStyle    = document.querySelector('input[name="previewStyle"]:checked')?.value    || "classic";
        const activeShape    = document.querySelector('input[name="previewShape"]:checked')?.value    || "rectangle";

        const cfg = (window.SBData && window.SBData.settings) ? window.SBData.settings() : (window.SIGNAGE_CONFIG || {});
        const rawPhone = cfg.whatsappRaw || "919999999999";

        const materialLabel = activeMaterial === "brushed-steel" ? "Brushed Steel" :
                              activeMaterial === "matte-black"   ? "Matte Black"   : "Antique Brass";
        const styleLabel    = activeStyle === "modern" ? "Modern (Josefin Sans)" :
                              activeStyle === "script" ? "Script (Great Vibes)"  : "Classic (Cormorant Garamond)";
        const shapeLabel    = activeShape === "oval"   ? "Oval"                  :
                              activeShape === "round"  ? "Round"                 : "Rectangle";

        const msg = `Hi Signage Basket, I designed a nameplate using your Live Preview:\n` +
                    `• Surname: ${surnameVal}\n` +
                    `• Names: ${namesVal}\n` +
                    `• Material: ${materialLabel}\n` +
                    `• Style: ${styleLabel}\n` +
                    `• Shape: ${shapeLabel}\n\n` +
                    `Could you please share a free 3D design preview and price quote?`;

        const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;

        const payload = {
          source: "preview",
          name: namesVal || surnameVal || "Live Preview Client",
          phone: "",
          email: "",
          city: "",
          message: msg,
          details: {
            surname: surnameVal,
            names: namesVal,
            material: activeMaterial,
            style: activeStyle,
            shape: activeShape
          },
          website: hpVal
        };

        const sendPromise = (window.SB && window.SB.sendEnquiry) ? window.SB.sendEnquiry(payload) : Promise.resolve();
        const timeoutPromise = new Promise((r) => setTimeout(r, 1000));

        await Promise.race([sendPromise, timeoutPromise]);
        window.open(waUrl, "_blank");
      });
    }

    surnameInput.addEventListener("input", updatePreview);
    namesInput.addEventListener("input", updatePreview);
    materialInputs.forEach((i) => i.addEventListener("change", updatePreview));
    styleInputs.forEach((i)    => i.addEventListener("change", updatePreview));
    shapeInputs.forEach((i)    => i.addEventListener("change", updatePreview));

    window.addEventListener("resize", () => {
      fitText(surnameDisplay, 34, 16);
      fitText(namesDisplay,   18, 11);
    });

    updatePreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLivePreview);
  } else {
    initLivePreview();
  }
})();
