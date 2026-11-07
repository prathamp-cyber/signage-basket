/**
 * Signage Basket — Client Reviews / Testimonials
 * Renders from SBData.reviews() with textContent escaping and empty hiding.
 */
window.SIGNAGE_REVIEWS = window.SIGNAGE_REVIEWS || [];

(function () {
  function renderReviews() {
    const section = document.getElementById("reviewsSection");
    if (!section) return;

    const allReviews = (window.SBData && window.SBData.reviews)
      ? window.SBData.reviews()
      : (window.SIGNAGE_REVIEWS || []);

    if (!Array.isArray(allReviews) || allReviews.length === 0) {
      section.style.display = "none";
      return;
    }

    section.style.display = "";

    const grid = section.querySelector(".reviews-grid");
    if (!grid) return;

    grid.innerHTML = "";
    allReviews.forEach((r) => {
      const card = document.createElement("div");
      card.className = "review-card";

      const rating = Number(r.rating) || 5;
      const starsDiv = document.createElement("div");
      starsDiv.className = "review-stars";
      starsDiv.setAttribute("aria-label", `${rating} out of 5 stars`);
      for (let i = 0; i < 5; i++) {
        const star = document.createElement("span");
        star.className = "icon i-star";
        star.setAttribute("aria-hidden", "true");
        star.style.color = i < rating ? "var(--accent)" : "var(--line)";
        starsDiv.appendChild(star);
      }
      card.appendChild(starsDiv);

      const quoteP = document.createElement("p");
      quoteP.className = "review-text";
      quoteP.textContent = `“${r.text || ''}”`;
      card.appendChild(quoteP);

      const authorDiv = document.createElement("div");
      authorDiv.className = "review-author";
      const nameEl = document.createElement("strong");
      nameEl.textContent = r.name || '';
      const projEl = document.createElement("span");
      projEl.textContent = r.project || '';
      authorDiv.appendChild(nameEl);
      authorDiv.appendChild(projEl);
      card.appendChild(authorDiv);

      grid.appendChild(card);
    });
  }

  window.renderReviews = renderReviews;

  if (window.SBData && window.SBData.ready) {
    window.SBData.ready.then(renderReviews);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderReviews);
  } else {
    renderReviews();
  }
})();
