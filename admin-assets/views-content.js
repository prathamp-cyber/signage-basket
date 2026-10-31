/**
 * Signage Basket — Views: Designs, Projects, Reviews & Media
 */
import { api, esc, formatRelative, showToast, confirmDialog, openDrawer, closeDrawer, setUnsavedChanges } from './core.js';

// Browser image compression helper: max 1600px, WebP .82 with JPEG fallback
async function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxSide = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w > h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        let dataUrl = canvas.toDataURL('image/webp', 0.82);
        let contentType = 'image/webp';
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          contentType = 'image/jpeg';
        }

        const dataBase64 = dataUrl.split(',')[1];
        resolve({ contentType, dataBase64, filename: file.name });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Upload file to Blob storage
async function uploadMedia(file, onProgress) {
  if (onProgress) onProgress(30);
  const compressed = await compressImageFile(file);
  if (onProgress) onProgress(70);

  const res = await api('/api/admin/media', {
    method: 'POST',
    body: {
      filename: compressed.filename,
      contentType: compressed.contentType,
      dataBase64: compressed.dataBase64
    }
  });

  if (onProgress) onProgress(100);
  return res.url;
}

// Category mappings
const CATEGORY_NAMES = {
  'home-nameplates': 'Home Nameplates',
  'glow-signs': 'LED & Glow Signs',
  '3d-letters': '3D Letter Signs',
  'office-boards': 'Acrylic Office Boards',
  'wall-branding': 'Interior Wall Branding'
};

// ==========================================
// 1. DESIGNS VIEW (Catalog List & Editor)
// ==========================================
export async function renderDesigns(container, param) {
  if (param === 'new' || (param && param.length > 0)) {
    await renderDesignForm(container, param === 'new' ? null : param);
    return;
  }

  let activeCategory = 'all';
  let activeStatus = 'all';
  let searchQuery = '';

  async function loadList() {
    container.innerHTML = '<div class="skeleton" style="height: 350px; width: 100%;"></div>';

    try {
      const url = `/api/admin/designs?category=${encodeURIComponent(activeCategory)}&status=${encodeURIComponent(activeStatus)}&q=${encodeURIComponent(searchQuery)}`;
      const res = await api(url);
      const items = res.items || [];

      container.innerHTML = `
        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button class="filter-tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">All Designs</button>
          ${Object.entries(CATEGORY_NAMES).map(([slug, label]) => `
            <button class="filter-tab ${activeCategory === slug ? 'active' : ''}" data-cat="${slug}">${label}</button>
          `).join('')}
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-search">
            <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="designSearchInput" class="form-input" placeholder="Search designs by name, material..." value="${esc(searchQuery)}">
          </div>

          <div style="display: flex; gap: 12px; align-items: center;">
            <select id="designStatusFilter" class="form-select" style="width: auto;">
              <option value="all" ${activeStatus === 'all' ? 'selected' : ''}>All Status</option>
              <option value="published" ${activeStatus === 'published' ? 'selected' : ''}>Published</option>
              <option value="draft" ${activeStatus === 'draft' ? 'selected' : ''}>Draft</option>
            </select>

            <a href="#/designs/new" class="btn btn-ink">
              <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Design</span>
            </a>
          </div>
        </div>

        <!-- Catalog Grid -->
        ${items.length === 0 ? `
          <div class="card empty-state">
            <h3>No designs found</h3>
            <p>Start by adding your first design or import starter designs in Settings.</p>
            <div style="margin-top: 16px;">
              <a href="#/designs/new" class="btn btn-ink btn-sm">Add Design</a>
            </div>
          </div>
        ` : `
          <div class="catalog-grid">
            ${items.map(d => {
              const coverUrl = d.images && d.images[0] ? d.images[0].url : '';
              let plateHtml = '';
              if (!coverUrl && d.plate && typeof window.renderPlate === 'function') {
                try {
                  plateHtml = window.renderPlate(d.plate, { zoom: 0.5 });
                } catch (_) {}
              }

              return `
                <div class="catalog-card" data-id="${d._id}">
                  <div class="card-media">
                    ${coverUrl ? `<img src="${esc(coverUrl)}" alt="${esc(d.name)}" loading="lazy">` : (plateHtml ? `<div style="width:100%; height:100%; transform: scale(0.65); transform-origin: center center;">${plateHtml}</div>` : `<div style="color:var(--text-muted); font-size:13px;">No Photo</div>`)}
                    <div class="card-badges">
                      <span class="status-pill status-${esc(d.status)}">${esc(d.status)}</span>
                      ${d.featured ? `<span class="badge-featured">Featured</span>` : ''}
                    </div>
                  </div>
                  <div class="card-body">
                    <span class="card-eyebrow">${esc(CATEGORY_NAMES[d.category] || d.category)}</span>
                    <h3 class="card-title">${esc(d.name)}</h3>
                    <p class="card-meta">${esc(d.material || 'Custom crafted')}</p>
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 12px; color: var(--bronze);">
                      ${d.price ? `₹${d.price.toLocaleString('en-IN')}` : 'Price on request'}
                    </div>

                    <div class="card-actions">
                      <a href="#/designs/${d._id}" class="btn btn-outline btn-sm" title="Edit">
                        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Edit</span>
                      </a>
                      <button class="btn btn-outline btn-sm btn-duplicate" data-id="${d._id}" title="Duplicate">
                        <svg class="svg-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button class="btn btn-outline btn-sm btn-toggle-publish" data-id="${d._id}" data-status="${d.status}" title="${d.status === 'published' ? 'Unpublish' : 'Publish'}">
                        ${d.status === 'published' ? `Unpublish` : `Publish`}
                      </button>
                      <button class="btn btn-outline btn-sm btn-delete" data-id="${d._id}" title="Delete" style="margin-left: auto; color: var(--danger);">
                        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;

      // Category tab switching
      container.querySelectorAll('.filter-tab').forEach(b => {
        b.onclick = () => {
          activeCategory = b.getAttribute('data-cat');
          loadList();
        };
      });

      // Status dropdown
      const statusFilter = container.querySelector('#designStatusFilter');
      if (statusFilter) {
        statusFilter.onchange = () => {
          activeStatus = statusFilter.value;
          loadList();
        };
      }

      // Search debounce
      const sInput = container.querySelector('#designSearchInput');
      let searchTimer;
      sInput.oninput = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = sInput.value.trim();
          loadList();
        }, 300);
      };

      // Per-card: Duplicate
      container.querySelectorAll('.btn-duplicate').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api(`/api/admin/designs/${id}/duplicate`, { method: 'POST' });
            showToast('Design duplicated into draft', 'success');
            loadList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      });

      // Per-card: Publish / Unpublish Toggle
      container.querySelectorAll('.btn-toggle-publish').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const currentStatus = btn.getAttribute('data-status');
          const newStatus = currentStatus === 'published' ? 'draft' : 'published';
          try {
            await api(`/api/admin/designs/${id}`, {
              method: 'PUT',
              body: { status: newStatus }
            });
            showToast(`Design marked as ${newStatus}`, 'success');
            loadList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      });

      // Per-card: Delete
      container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const ok = await confirmDialog({
            title: 'Delete Design',
            message: 'Are you sure you want to delete this design? This cannot be undone.',
            confirmText: 'Delete',
            danger: true
          });
          if (ok) {
            try {
              await api(`/api/admin/designs/${id}`, { method: 'DELETE' });
              showToast('Design deleted', 'info');
              loadList();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        };
      });

    } catch (err) {
      container.innerHTML = `<div class="card"><p class="form-error">Failed to load designs: ${esc(err.message)}</p></div>`;
    }
  }

  await loadList();
}

// ------------------------------------------
// DESIGN FORM (Add / Edit + Live Sticky Preview)
// ------------------------------------------
async function renderDesignForm(container, designId) {
  let design = null;
  if (designId) {
    try {
      const res = await api(`/api/admin/designs/${designId}`);
      design = res.item;
    } catch (err) {
      showToast('Failed to load design: ' + err.message, 'error');
      location.hash = '#/designs';
      return;
    }
  }

  const isEdit = Boolean(design);
  let tags = design?.tags ? [...design.tags] : [];
  let finishes = design?.finishes ? [...design.finishes] : ['Antique brass', 'Polished brass'];
  let sizes = design?.sizes ? [...design.sizes] : ['Small', 'Medium', 'Large', 'Custom'];
  let images = design?.images ? [...design.images] : [];
  let plate = design?.plate || null;

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <a href="#/designs" class="btn btn-outline btn-sm">
        <svg class="svg-icon" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        <span>Back to Designs</span>
      </a>
    </div>

    <div class="form-preview-layout">
      <!-- Left Column: Form Fields -->
      <div class="card">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
          ${isEdit ? 'Edit Design' : 'Create New Design'}
        </h2>

        <form id="designEditorForm">
          <!-- Name -->
          <div class="form-group">
            <label class="form-label" for="designName">Design Name *</label>
            <input type="text" id="designName" class="form-input" required maxlength="150" value="${esc(design?.name || '')}" placeholder="e.g. Round Brass House Number Plate">
            <div id="nameError" class="form-error" style="display:none;"></div>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label class="form-label" for="designCategory">Category *</label>
            <select id="designCategory" class="form-select" required>
              ${Object.entries(CATEGORY_NAMES).map(([slug, label]) => `
                <option value="${slug}" ${design?.category === slug ? 'selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </div>

          <!-- Slug -->
          <div class="form-group">
            <label class="form-label" for="designSlug">URL Slug *</label>
            <input type="text" id="designSlug" class="form-input" required pattern="^[a-z0-9-]{2,80}$" value="${esc(design?.slug || '')}" placeholder="round-brass-house-number-plate">
            <div class="form-hint">Path: /design/<span id="slugPreview">${esc(design?.slug || 'slug')}</span></div>
            <div id="slugError" class="form-error" style="display:none;"></div>
          </div>

          <!-- Material -->
          <div class="form-group">
            <label class="form-label" for="designMaterial">Material / Build Spec</label>
            <input type="text" id="designMaterial" class="form-input" maxlength="100" value="${esc(design?.material || '')}" placeholder="e.g. Brass finish on solid acrylic base">
          </div>

          <!-- Description -->
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label" for="designDesc">Short Description</label>
              <span id="descCount" style="font-size: 12px; color: var(--text-muted);">0 / 400</span>
            </div>
            <textarea id="designDesc" class="form-textarea" rows="3" maxlength="400" placeholder="A brief craft note shown on the product card...">${esc(design?.desc || '')}</textarea>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Filter Tags</label>
            <div id="tagsChipBox" class="chip-container">
              <input type="text" id="tagInput" placeholder="Type tag & press Enter...">
            </div>
            <div id="tagSuggestions" class="chip-suggestions"></div>
          </div>

          <!-- Finishes -->
          <div class="form-group">
            <label class="form-label">Available Finishes</label>
            <div id="finishesChipBox" class="chip-container">
              <input type="text" id="finishInput" placeholder="Add finish & press Enter...">
            </div>
          </div>

          <!-- Sizes -->
          <div class="form-group">
            <label class="form-label">Standard Sizes</label>
            <div id="sizesChipBox" class="chip-container">
              <input type="text" id="sizeInput" placeholder="Add size & press Enter...">
            </div>
          </div>

          <!-- Price -->
          <div class="form-group">
            <label class="form-label" for="designPrice">Starting Price (₹)</label>
            <input type="number" id="designPrice" class="form-input" min="0" step="1" value="${design?.price || ''}" placeholder="Leave empty for 'Price on request'">
            <div class="form-hint">Leave empty to display "Price on request" on the website.</div>
          </div>

          <!-- Photos Uploader -->
          <div class="form-group">
            <label class="form-label">Product Photos</label>
            <div id="photoDropzone" class="dropzone">
              <svg class="svg-icon" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--text-muted);" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p>Drag photos here or <span style="text-decoration: underline; color: var(--bronze);">browse files</span></p>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Compressed to WebP max 1600px automatically</p>
              <input type="file" id="photoFileInput" multiple accept="image/jpeg,image/png,image/webp" style="display: none;">
            </div>
            <div id="uploadProgressBar" class="checklist-progress-bar" style="display: none; margin-top: 10px;">
              <div id="uploadProgressFill" class="checklist-progress-fill" style="width: 0%;"></div>
            </div>
            <div id="photosList" class="photo-list"></div>
          </div>

          <!-- Toggles: Status & Featured -->
          <div style="display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="designPublished" ${design?.status === 'published' ? 'checked' : (!isEdit ? 'checked' : '')}>
              <span style="font-weight: 600; font-size: 14px;">Publish on Website</span>
            </label>

            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="designFeatured" ${design?.featured ? 'checked' : ''}>
              <span style="font-weight: 600; font-size: 14px;">Feature on Homepage</span>
            </label>
          </div>

          <!-- Form Actions -->
          <div style="display: flex; gap: 12px; border-top: 1px solid var(--border); padding-top: 20px;">
            <button type="submit" id="btnSaveDesign" class="btn btn-ink">
              <span>Save Design</span>
            </button>
            ${!isEdit ? `
              <button type="button" id="btnSaveAndAddAnother" class="btn btn-outline">
                <span>Save & Add Another</span>
              </button>
            ` : ''}
            <a href="#/designs" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </div>

      <!-- Right Column: Sticky Live Preview -->
      <div class="sticky-preview">
        <div class="preview-box">
          <div class="preview-label">Website Card Preview</div>
          <div class="card-media" id="previewMediaBox">
            <div style="color: var(--text-muted); font-size: 13px;">No Photo</div>
          </div>
          <div class="card-body">
            <span class="card-eyebrow" id="previewCategory">Category</span>
            <h3 class="card-title" id="previewTitle">Design Name</h3>
            <p class="card-meta" id="previewMaterial">Material Spec</p>
            <div style="font-weight: 600; font-size: 14px; color: var(--bronze);" id="previewPrice">
              Price on request
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setUnsavedChanges(true);

  // Form Elements
  const form = container.querySelector('#designEditorForm');
  const nameInput = container.querySelector('#designName');
  const catSelect = container.querySelector('#designCategory');
  const slugInput = container.querySelector('#designSlug');
  const slugPreview = container.querySelector('#slugPreview');
  const materialInput = container.querySelector('#designMaterial');
  const descInput = container.querySelector('#designDesc');
  const descCount = container.querySelector('#descCount');
  const priceInput = container.querySelector('#designPrice');
  const publishedCheckbox = container.querySelector('#designPublished');
  const featuredCheckbox = container.querySelector('#designFeatured');

  // Preview Elements
  const previewMediaBox = container.querySelector('#previewMediaBox');
  const previewCategory = container.querySelector('#previewCategory');
  const previewTitle = container.querySelector('#previewTitle');
  const previewMaterial = container.querySelector('#previewMaterial');
  const previewPrice = container.querySelector('#previewPrice');

  function updateLivePreview() {
    previewCategory.textContent = CATEGORY_NAMES[catSelect.value] || catSelect.value;
    previewTitle.textContent = nameInput.value || 'Design Name';
    previewMaterial.textContent = materialInput.value || 'Material Spec';
    const p = priceInput.value.trim();
    previewPrice.textContent = p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Price on request';

    if (images.length > 0) {
      previewMediaBox.innerHTML = `<img src="${esc(images[0].url)}" alt="${esc(images[0].alt || nameInput.value)}">`;
    } else if (plate && typeof window.renderPlate === 'function') {
      try {
        previewMediaBox.innerHTML = `<div style="width:100%; height:100%; transform: scale(0.65); transform-origin: center center;">${window.renderPlate(plate)}</div>`;
      } catch (_) {
        previewMediaBox.innerHTML = `<div style="color:var(--text-muted); font-size:13px;">No Photo</div>`;
      }
    } else {
      previewMediaBox.innerHTML = `<div style="color:var(--text-muted); font-size:13px;">No Photo</div>`;
    }
  }

  // Name to auto slug generator
  let slugManuallyEdited = isEdit;
  nameInput.oninput = () => {
    if (!slugManuallyEdited) {
      slugInput.value = nameInput.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').slice(0, 80);
      slugPreview.textContent = slugInput.value || 'slug';
    }
    updateLivePreview();
  };

  slugInput.oninput = () => {
    slugManuallyEdited = true;
    slugPreview.textContent = slugInput.value || 'slug';
  };

  catSelect.onchange = () => {
    updateLivePreview();
    updateTagSuggestions();
  };
  materialInput.oninput = updateLivePreview;
  priceInput.oninput = updateLivePreview;

  // Description character counter
  descInput.oninput = () => {
    descCount.textContent = `${descInput.value.length} / 400`;
  };
  descCount.textContent = `${descInput.value.length} / 400`;

  // Chip helpers
  function renderChips(containerEl, list, onRemove) {
    containerEl.querySelectorAll('.chip').forEach(c => c.remove());
    list.forEach((item, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${esc(item)}<button type="button" class="chip-remove" data-idx="${idx}">×</button>`;
      containerEl.insertBefore(chip, containerEl.querySelector('input'));
    });
    containerEl.querySelectorAll('.chip-remove').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        onRemove(idx);
      };
    });
  }

  // Tag Chips Setup
  const tagsBox = container.querySelector('#tagsChipBox');
  const tagInput = container.querySelector('#tagInput');
  const tagSuggestionsEl = container.querySelector('#tagSuggestions');

  function updateTagSuggestions() {
    tagSuggestionsEl.innerHTML = '';
    const catalogData = window.CATALOG && window.CATALOG[catSelect.value];
    if (catalogData && catalogData.filters) {
      catalogData.filters.forEach(f => {
        if (f.tag !== 'all' && !tags.includes(f.tag)) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'chip-suggest-btn';
          btn.textContent = `+ ${f.label}`;
          btn.onclick = () => {
            tags.push(f.tag);
            renderChips(tagsBox, tags, (i) => { tags.splice(i, 1); updateTagSuggestions(); });
            updateTagSuggestions();
          };
          tagSuggestionsEl.appendChild(btn);
        }
      });
    }
  }

  tagInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.value.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        tags.push(val);
        tagInput.value = '';
        renderChips(tagsBox, tags, (i) => { tags.splice(i, 1); updateTagSuggestions(); });
        updateTagSuggestions();
      }
    }
  };

  renderChips(tagsBox, tags, (i) => { tags.splice(i, 1); updateTagSuggestions(); });
  updateTagSuggestions();

  // Finishes Chips Setup
  const finishesBox = container.querySelector('#finishesChipBox');
  const finishInput = container.querySelector('#finishInput');
  finishInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = finishInput.value.trim();
      if (val && !finishes.includes(val)) {
        finishes.push(val);
        finishInput.value = '';
        renderChips(finishesBox, finishes, (i) => finishes.splice(i, 1));
      }
    }
  };
  renderChips(finishesBox, finishes, (i) => finishes.splice(i, 1));

  // Sizes Chips Setup
  const sizesBox = container.querySelector('#sizesChipBox');
  const sizeInput = container.querySelector('#sizeInput');
  sizeInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = sizeInput.value.trim();
      if (val && !sizes.includes(val)) {
        sizes.push(val);
        sizeInput.value = '';
        renderChips(sizesBox, sizes, (i) => sizes.splice(i, 1));
      }
    }
  };
  renderChips(sizesBox, sizes, (i) => sizes.splice(i, 1));

  // Photos Uploader Setup
  const dropzone = container.querySelector('#photoDropzone');
  const fileInput = container.querySelector('#photoFileInput');
  const progressBar = container.querySelector('#uploadProgressBar');
  const progressFill = container.querySelector('#uploadProgressFill');
  const photosList = container.querySelector('#photosList');

  function renderPhotos() {
    photosList.innerHTML = images.map((img, idx) => `
      <div class="photo-item" data-idx="${idx}">
        <img src="${esc(img.url)}" alt="${esc(img.alt || '')}">
        ${idx === 0 ? `<span class="photo-badge-cover">Cover</span>` : ''}
        <div class="photo-actions">
          ${idx > 0 ? `<button type="button" class="photo-action-btn btn-move-up" data-idx="${idx}" title="Move left">◀</button>` : ''}
          ${idx < images.length - 1 ? `<button type="button" class="photo-action-btn btn-move-down" data-idx="${idx}" title="Move right">▶</button>` : ''}
          <button type="button" class="photo-action-btn btn-remove-photo" data-idx="${idx}" title="Remove">✕</button>
        </div>
      </div>
    `).join('');

    photosList.querySelectorAll('.btn-move-up').forEach(b => {
      b.onclick = () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        const temp = images[i];
        images[i] = images[i - 1];
        images[i - 1] = temp;
        renderPhotos();
        updateLivePreview();
      };
    });

    photosList.querySelectorAll('.btn-move-down').forEach(b => {
      b.onclick = () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        const temp = images[i];
        images[i] = images[i + 1];
        images[i + 1] = temp;
        renderPhotos();
        updateLivePreview();
      };
    });

    photosList.querySelectorAll('.btn-remove-photo').forEach(b => {
      b.onclick = () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        images.splice(i, 1);
        renderPhotos();
        updateLivePreview();
      };
    });
  }

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    progressBar.style.display = 'block';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const uploadedUrl = await uploadMedia(file, (p) => {
          progressFill.style.width = `${p}%`;
        });
        images.push({ url: uploadedUrl, alt: nameInput.value });
        renderPhotos();
        updateLivePreview();
      } catch (err) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    progressBar.style.display = 'none';
    progressFill.style.width = '0%';
  }

  dropzone.onclick = () => fileInput.click();
  fileInput.onchange = () => handleFiles(fileInput.files);

  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  renderPhotos();
  updateLivePreview();

  // Save handler
  async function saveDesign() {
    const slugErr = container.querySelector('#slugError');
    slugErr.style.display = 'none';

    const payload = {
      name: nameInput.value.trim(),
      category: catSelect.value,
      slug: slugInput.value.trim(),
      material: materialInput.value.trim(),
      desc: descInput.value.trim(),
      tags,
      finishes,
      sizes,
      price: priceInput.value.trim() ? Number(priceInput.value.trim()) : null,
      images,
      plate,
      status: publishedCheckbox.checked ? 'published' : 'draft',
      featured: featuredCheckbox.checked
    };

    try {
      if (isEdit) {
        await api(`/api/admin/designs/${designId}`, {
          method: 'PUT',
          body: payload
        });
        showToast('Design updated successfully', 'success');
      } else {
        await api('/api/admin/designs', {
          method: 'POST',
          body: payload
        });
        showToast('Design created successfully', 'success');
      }
      setUnsavedChanges(false);
      return true;
    } catch (err) {
      if (err.message.includes('slug')) {
        slugErr.textContent = err.message;
        slugErr.style.display = 'block';
      } else {
        showToast(err.message, 'error');
      }
      return false;
    }
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const ok = await saveDesign();
    if (ok) {
      location.hash = '#/designs';
    }
  };

  const saveAnotherBtn = container.querySelector('#btnSaveAndAddAnother');
  if (saveAnotherBtn) {
    saveAnotherBtn.onclick = async () => {
      const ok = await saveDesign();
      if (ok) {
        renderDesignForm(container, null);
      }
    };
  }
}

// ==========================================
// 2. PROJECTS VIEW (Gallery & Reordering)
// ==========================================
export async function renderProjects(container) {
  container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';

  try {
    const res = await api('/api/admin/projects');
    const projects = res.items || [];

    container.innerHTML = `
      <div class="toolbar">
        <h2 style="font-size: 18px; font-weight: 600;">Client Installations (${projects.length})</h2>
        <div style="display: flex; gap: 8px;">
          <button id="btnSaveProjectOrder" class="btn btn-outline btn-sm" style="display: none;">Save Order</button>
          <button id="btnAddProject" class="btn btn-ink btn-sm">
            <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Project</span>
          </button>
        </div>
      </div>

      ${projects.length === 0 ? `
        <div class="card empty-state">
          <h3>No projects yet</h3>
          <p>Add photos of completed signs to build trust on the Our Work gallery.</p>
        </div>
      ` : `
        <div class="catalog-grid" id="projectGrid">
          ${projects.map((p, idx) => `
            <div class="catalog-card project-card" data-id="${p._id}" data-idx="${idx}">
              <div class="card-media">
                ${p.images && p.images[0] ? `<img src="${esc(p.images[0].url)}" alt="${esc(p.title)}">` : `<div style="color:var(--text-muted); font-size:13px;">No Photo</div>`}
                <div class="card-badges">
                  <span class="status-pill status-${esc(p.status)}">${esc(p.status)}</span>
                </div>
              </div>
              <div class="card-body">
                <span class="card-eyebrow">${esc(p.type)} · ${esc(p.location || 'Gujarat')}</span>
                <h3 class="card-title">${esc(p.title)}</h3>
                <p class="card-meta">${esc(p.description || '')}</p>

                <div class="card-actions">
                  <button class="btn btn-outline btn-sm btn-edit-proj" data-id="${p._id}">Edit</button>
                  <button class="btn btn-outline btn-sm btn-move-proj-up" data-idx="${idx}" title="Move up">▲</button>
                  <button class="btn btn-outline btn-sm btn-move-proj-down" data-idx="${idx}" title="Move down">▼</button>
                  <button class="btn btn-outline btn-sm btn-del-proj" data-id="${p._id}" style="margin-left: auto; color: var(--danger);">✕</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    const saveOrderBtn = container.querySelector('#btnSaveProjectOrder');

    function notifyOrderChanged() {
      if (saveOrderBtn) saveOrderBtn.style.display = 'inline-flex';
    }

    // Up / Down project order
    container.querySelectorAll('.btn-move-proj-up').forEach(b => {
      b.onclick = () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        if (i > 0) {
          const temp = projects[i];
          projects[i] = projects[i - 1];
          projects[i - 1] = temp;
          notifyOrderChanged();
          renderProjects(container);
        }
      };
    });

    container.querySelectorAll('.btn-move-proj-down').forEach(b => {
      b.onclick = () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        if (i < projects.length - 1) {
          const temp = projects[i];
          projects[i] = projects[i + 1];
          projects[i + 1] = temp;
          notifyOrderChanged();
          renderProjects(container);
        }
      };
    });

    if (saveOrderBtn) {
      saveOrderBtn.onclick = async () => {
        const ids = projects.map(p => p._id);
        try {
          await api('/api/admin/projects/reorder', {
            method: 'PUT',
            body: { ids }
          });
          showToast('Project display order saved', 'success');
          saveOrderBtn.style.display = 'none';
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
    }

    // Add Project
    container.querySelector('#btnAddProject').onclick = () => {
      openProjectDrawer(null, () => renderProjects(container));
    };

    // Edit Project
    container.querySelectorAll('.btn-edit-proj').forEach(b => {
      b.onclick = () => {
        const id = b.getAttribute('data-id');
        const proj = projects.find(p => String(p._id) === id);
        if (proj) openProjectDrawer(proj, () => renderProjects(container));
      };
    });

    // Delete Project
    container.querySelectorAll('.btn-del-proj').forEach(b => {
      b.onclick = async () => {
        const id = b.getAttribute('data-id');
        const ok = await confirmDialog({
          title: 'Delete Project',
          message: 'Are you sure you want to remove this project?',
          confirmText: 'Delete',
          danger: true
        });
        if (ok) {
          try {
            await api(`/api/admin/projects/${id}`, { method: 'DELETE' });
            showToast('Project deleted', 'info');
            renderProjects(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      };
    });

  } catch (err) {
    container.innerHTML = `<div class="card"><p class="form-error">Failed to load projects: ${esc(err.message)}</p></div>`;
  }
}

function openProjectDrawer(proj, onSaved) {
  const isEdit = Boolean(proj);
  let pImages = proj?.images ? [...proj.images] : [];

  const contentHtml = `
    <form id="projectDrawerForm" style="display:flex; flex-direction:column; gap:16px;">
      <div>
        <label class="form-label" for="projTitle">Project Title *</label>
        <input type="text" id="projTitle" class="form-input" required maxlength="150" value="${esc(proj?.title || '')}" placeholder="e.g. Modern Brass Villa Nameplate">
      </div>

      <div>
        <label class="form-label" for="projType">Category Type</label>
        <select id="projType" class="form-select">
          <option value="Nameplate" ${proj?.type === 'Nameplate' ? 'selected' : ''}>Nameplate</option>
          <option value="Glow Sign" ${proj?.type === 'Glow Sign' ? 'selected' : ''}>Glow Sign</option>
          <option value="Office & Interiors" ${proj?.type === 'Office & Interiors' ? 'selected' : ''}>Office & Interiors</option>
          <option value="Board" ${proj?.type === 'Board' ? 'selected' : ''}>Board</option>
          <option value="Other" ${proj?.type === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>

      <div>
        <label class="form-label" for="projLocation">Location</label>
        <input type="text" id="projLocation" class="form-input" maxlength="100" value="${esc(proj?.location || '')}" placeholder="e.g. Gandhidham, Gujarat">
      </div>

      <div>
        <label class="form-label" for="projDesc">Description</label>
        <textarea id="projDesc" class="form-textarea" rows="3" maxlength="1000" placeholder="Details about dimensions, client and installation...">${esc(proj?.description || '')}</textarea>
      </div>

      <div>
        <label class="form-label">Project Photos</label>
        <div id="projDropzone" class="dropzone" style="padding: 20px;">
          <p style="font-size: 13px;">Click to upload photos (WebP compressed)</p>
          <input type="file" id="projFileInput" multiple accept="image/jpeg,image/png,image/webp" style="display:none;">
        </div>
        <div id="projPhotosList" class="photo-list"></div>
      </div>

      <div>
        <label class="form-label" for="projStatus">Status</label>
        <select id="projStatus" class="form-select">
          <option value="published" ${proj?.status === 'published' ? 'selected' : (!isEdit ? 'selected' : '')}>Published</option>
          <option value="draft" ${proj?.status === 'draft' ? 'selected' : ''}>Draft</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button type="submit" class="btn btn-ink" style="flex: 1;">Save Project</button>
        <button type="button" id="btnCancelProj" class="btn btn-outline">Cancel</button>
      </div>
    </form>
  `;

  openDrawer(isEdit ? 'Edit Project' : 'New Installation Project', contentHtml, (bodyEl) => {
    const pList = bodyEl.querySelector('#projPhotosList');
    const pDrop = bodyEl.querySelector('#projDropzone');
    const pFileInput = bodyEl.querySelector('#projFileInput');

    function renderProjPhotos() {
      pList.innerHTML = pImages.map((img, idx) => `
        <div class="photo-item">
          <img src="${esc(img.url)}">
          <div class="photo-actions">
            <button type="button" class="photo-action-btn btn-del-img" data-idx="${idx}">✕</button>
          </div>
        </div>
      `).join('');

      pList.querySelectorAll('.btn-del-img').forEach(b => {
        b.onclick = () => {
          pImages.splice(parseInt(b.getAttribute('data-idx'), 10), 1);
          renderProjPhotos();
        };
      });
    }

    pDrop.onclick = () => pFileInput.click();
    pFileInput.onchange = async () => {
      for (const file of pFileInput.files) {
        try {
          const url = await uploadMedia(file);
          pImages.push({ url, alt: bodyEl.querySelector('#projTitle').value });
          renderProjPhotos();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };

    renderProjPhotos();

    bodyEl.querySelector('#btnCancelProj').onclick = closeDrawer;

    bodyEl.querySelector('#projectDrawerForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: bodyEl.querySelector('#projTitle').value.trim(),
        type: bodyEl.querySelector('#projType').value,
        location: bodyEl.querySelector('#projLocation').value.trim(),
        description: bodyEl.querySelector('#projDesc').value.trim(),
        images: pImages,
        status: bodyEl.querySelector('#projStatus').value
      };

      try {
        if (isEdit) {
          await api(`/api/admin/projects/${proj._id}`, { method: 'PUT', body: payload });
          showToast('Project updated', 'success');
        } else {
          await api('/api/admin/projects', { method: 'POST', body: payload });
          showToast('Project created', 'success');
        }
        closeDrawer();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });
}

// ==========================================
// 3. REVIEWS VIEW
// ==========================================
export async function renderReviews(container) {
  container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';

  try {
    const res = await api('/api/admin/reviews');
    const reviews = res.items || [];

    container.innerHTML = `
      <!-- Notice Banner -->
      <div style="background-color: var(--bronze-light); border: 1px solid var(--border); padding: 12px 18px; border-radius: var(--radius); margin-bottom: 24px; font-size: 13px;">
        💡 <strong>Notice:</strong> Only add real customer reviews from completed orders and satisfied clients.
      </div>

      <div class="toolbar">
        <h2 style="font-size: 18px; font-weight: 600;">Customer Reviews (${reviews.length})</h2>
        <button id="btnAddReview" class="btn btn-ink btn-sm">
          <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Review</span>
        </button>
      </div>

      ${reviews.length === 0 ? `
        <div class="card empty-state">
          <h3>No reviews yet</h3>
          <p>Add your first client testimonial to display on the homepage.</p>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
          ${reviews.map(r => `
            <div class="card" style="display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="color: #f59e0b; font-size: 16px;">
                  ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}
                </div>
                <span class="status-pill status-${esc(r.status)}">${esc(r.status)}</span>
              </div>
              <p style="font-size: 14px; font-style: italic; margin-bottom: 12px; flex: 1;">"${esc(r.text)}"</p>
              <div style="border-top: 1px solid var(--border-light); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 14px;">${esc(r.name)}</strong>
                  <div style="font-size: 12px; color: var(--text-muted);">${esc(r.project || 'Residential client')}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-outline btn-sm btn-edit-review" data-id="${r._id}">Edit</button>
                  <button class="btn btn-outline btn-sm btn-del-review" data-id="${r._id}" style="color: var(--danger);">✕</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    container.querySelector('#btnAddReview').onclick = () => {
      openReviewModal(null, () => renderReviews(container));
    };

    container.querySelectorAll('.btn-edit-review').forEach(b => {
      b.onclick = () => {
        const id = b.getAttribute('data-id');
        const rev = reviews.find(r => String(r._id) === id);
        if (rev) openReviewModal(rev, () => renderReviews(container));
      };
    });

    container.querySelectorAll('.btn-del-review').forEach(b => {
      b.onclick = async () => {
        const id = b.getAttribute('data-id');
        const ok = await confirmDialog({
          title: 'Delete Review',
          message: 'Are you sure you want to delete this customer review?',
          confirmText: 'Delete',
          danger: true
        });
        if (ok) {
          try {
            await api(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            showToast('Review deleted', 'info');
            renderReviews(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      };
    });

  } catch (err) {
    container.innerHTML = `<div class="card"><p class="form-error">Failed to load reviews: ${esc(err.message)}</p></div>`;
  }
}

function openReviewModal(rev, onSaved) {
  const isEdit = Boolean(rev);
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = isEdit ? 'Edit Review' : 'Add Client Review';
  body.innerHTML = `
    <form id="reviewModalForm">
      <div class="form-group">
        <label class="form-label" for="revName">Customer Name *</label>
        <input type="text" id="revName" class="form-input" required maxlength="100" value="${esc(rev?.name || '')}" placeholder="e.g. Rajesh Patel">
      </div>

      <div class="form-group">
        <label class="form-label" for="revText">Review Text * (Max 600 chars)</label>
        <textarea id="revText" class="form-textarea" rows="3" required maxlength="600" placeholder="Feedback on quality, finish and installation...">${esc(rev?.text || '')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="revRating">Rating (1 to 5 Stars)</label>
        <select id="revRating" class="form-select">
          <option value="5" ${rev?.rating === 5 || !isEdit ? 'selected' : ''}>★★★★★ 5 Stars</option>
          <option value="4" ${rev?.rating === 4 ? 'selected' : ''}>★★★★☆ 4 Stars</option>
          <option value="3" ${rev?.rating === 3 ? 'selected' : ''}>★★★☆☆ 3 Stars</option>
          <option value="2" ${rev?.rating === 2 ? 'selected' : ''}>★★☆☆☆ 2 Stars</option>
          <option value="1" ${rev?.rating === 1 ? 'selected' : ''}>★☆☆☆☆ 1 Star</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="revProject">Project or Design Name</label>
        <input type="text" id="revProject" class="form-input" maxlength="120" value="${esc(rev?.project || '')}" placeholder="e.g. Classic Brass Wall Plate">
      </div>

      <div class="form-group">
        <label class="form-label" for="revStatus">Status</label>
        <select id="revStatus" class="form-select">
          <option value="published" ${rev?.status === 'published' || !isEdit ? 'selected' : ''}>Published</option>
          <option value="draft" ${rev?.status === 'draft' ? 'selected' : ''}>Draft</option>
        </select>
      </div>
    </form>
  `;

  footer.innerHTML = `
    <button id="modalRevCancelBtn" class="btn btn-outline btn-sm">Cancel</button>
    <button id="modalRevSaveBtn" class="btn btn-ink btn-sm">Save Review</button>
  `;

  overlay.style.display = 'flex';

  function close() {
    overlay.style.display = 'none';
  }

  document.getElementById('modalRevCancelBtn').onclick = close;

  document.getElementById('modalRevSaveBtn').onclick = async () => {
    const nameVal = body.querySelector('#revName').value.trim();
    const textVal = body.querySelector('#revText').value.trim();
    if (!nameVal || !textVal) {
      showToast('Name and review text are required', 'error');
      return;
    }

    const payload = {
      name: nameVal,
      text: textVal,
      rating: parseInt(body.querySelector('#revRating').value, 10),
      project: body.querySelector('#revProject').value.trim(),
      status: body.querySelector('#revStatus').value
    };

    try {
      if (isEdit) {
        await api(`/api/admin/reviews/${rev._id}`, { method: 'PUT', body: payload });
        showToast('Review updated', 'success');
      } else {
        await api('/api/admin/reviews', { method: 'POST', body: payload });
        showToast('Review created', 'success');
      }
      close();
      if (typeof onSaved === 'function') onSaved();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

// ==========================================
// 4. MEDIA VIEW (Blob Storage Browser)
// ==========================================
export async function renderMedia(container) {
  container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';

  try {
    const res = await api('/api/admin/media');
    const blobs = res.blobs || [];

    container.innerHTML = `
      <div class="toolbar">
        <h2 style="font-size: 18px; font-weight: 600;">Media Library (${blobs.length})</h2>
        <button id="btnUploadMediaFile" class="btn btn-ink btn-sm">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Upload Image</span>
        </button>
        <input type="file" id="mediaDirectInput" multiple accept="image/jpeg,image/png,image/webp" style="display:none;">
      </div>

      <!-- Drag & Drop Uploader Banner -->
      <div id="mediaDropzone" class="dropzone" style="margin-bottom: 24px;">
        <p>Drop images here to upload directly to Vercel Blob (JPEG, PNG, WebP compressed to max 1600px)</p>
      </div>

      ${blobs.length === 0 ? `
        <div class="card empty-state">
          <h3>No media files in storage</h3>
          <p>Photos uploaded to designs and projects will show up here.</p>
        </div>
      ` : `
        <div class="catalog-grid">
          ${blobs.map(b => `
            <div class="catalog-card">
              <div class="card-media">
                <img src="${esc(b.url)}" alt="${esc(b.pathname || 'Photo')}" loading="lazy">
              </div>
              <div class="card-body">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${esc(b.pathname ? b.pathname.split('/').pop() : 'Image')}
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                  ${b.size ? `${Math.round(b.size / 1024)} KB` : ''} · ${b.uploadedAt ? formatRelative(b.uploadedAt) : ''}
                </div>
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm btn-copy-url" data-url="${esc(b.url)}">Copy URL</button>
                  <button class="btn btn-outline btn-sm btn-del-blob" data-url="${esc(b.url)}" style="margin-left: auto; color: var(--danger);">✕</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    const directInput = container.querySelector('#mediaDirectInput');
    const uploadBtn = container.querySelector('#btnUploadMediaFile');
    const dropzone = container.querySelector('#mediaDropzone');

    uploadBtn.onclick = () => directInput.click();
    dropzone.onclick = () => directInput.click();

    async function handleMediaUpload(files) {
      if (!files || files.length === 0) return;
      showToast('Uploading images...', 'info');
      for (const file of files) {
        try {
          await uploadMedia(file);
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      }
      showToast('Upload finished', 'success');
      renderMedia(container);
    }

    directInput.onchange = () => handleMediaUpload(directInput.files);

    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files) handleMediaUpload(e.dataTransfer.files);
    };

    // Copy URL
    container.querySelectorAll('.btn-copy-url').forEach(b => {
      b.onclick = () => {
        const url = b.getAttribute('data-url');
        navigator.clipboard.writeText(url).then(() => {
          showToast('Image URL copied to clipboard', 'success');
        });
      };
    });

    // Delete Blob
    container.querySelectorAll('.btn-del-blob').forEach(b => {
      b.onclick = async () => {
        const url = b.getAttribute('data-url');
        const ok = await confirmDialog({
          title: 'Delete Image',
          message: 'Are you sure you want to permanently delete this photo from Blob storage?',
          confirmText: 'Delete',
          danger: true
        });
        if (ok) {
          try {
            await api('/api/admin/media', { method: 'DELETE', body: { url } });
            showToast('Image deleted', 'info');
            renderMedia(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      };
    });

  } catch (err) {
    container.innerHTML = `<div class="card"><p class="form-error">Failed to load media: ${esc(err.message)}</p></div>`;
  }
}
