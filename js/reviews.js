/**
 * Signage Basket — Client Reviews / Testimonials
 *
 * HOW TO ADD REAL REVIEWS:
 * Add objects to the REVIEWS array below. Each object must have:
 *   name    {string}  — client's first name or initials
 *   text    {string}  — the review quote (their words, not yours)
 *   project {string}  — short description, e.g. "Home nameplate, Adipur"
 *   rating  {number}  — 1–5 stars
 *
 * When the array is EMPTY the entire "What our clients say" section
 * is not rendered on the page. Only add genuine reviews here.
 *
 * Example (remove the block comment to activate):
 *
 * { name: "Ramesh P.", text: "Very happy with the nameplate. The 3D preview was exactly what we got.", project: "Villa nameplate, Gandhidham", rating: 5 },
 */

window.SIGNAGE_REVIEWS = [
  // Add real client reviews here
];

(function () {
  function renderReviews() {
    const section = document.getElementById("reviewsSection");
    if (!section) return;

    const reviews = window.SIGNAGE_REVIEWS || [];
    if (!reviews.length) {
      section.style.display = "none";
      return;
    }

    section.style.display = "";

    const grid = section.querySelector(".reviews-grid");
    if (!grid) return;

    grid.innerHTML = reviews.map((r) => {
      const stars = Array(5).fill(0).map((_, i) =>
        `<span class="icon i-star" aria-hidden="true" style="${i < r.rating ? "color:var(--accent)" : "color:var(--line)"}"></span>`
      ).join("");

      return `
        <div class="review-card">
          <div class="review-stars" aria-label="${r.rating} out of 5 stars">${stars}</div>
          <p class="review-text">&ldquo;${r.text}&rdquo;</p>
          <div class="review-author">
            <strong>${r.name}</strong>
            <span>${r.project}</span>
          </div>
        </div>`;
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderReviews);
  } else {
    renderReviews();
  }
})();
