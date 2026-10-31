/**
 * Signage Basket — Content Views: Designs, Projects, Reviews & Media
 */
import {
  api,
  toast,
  confirmDialog,
  openModal,
  openDrawer,
  h,
  esc,
  relTime,
  fmtDate,
  chipInput,
  photoUploader,
  slugify,
  go,
  state,
  navGuard
} from './core.js';

const CATEGORIES = [
  { key: 'home-nameplates', label: 'Home Nameplates' },
  { key: 'glow-signs', label: 'LED & Glow Signs' },
  { key: '3d-letters', label: '3D Letter Signs' },
  { key: 'office-boards', label: 'Acrylic Office Boards' },
  { key: 'wall-branding', label: 'Interior Wall Branding' }
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]));

// ==========================================
// 1. DESIGNS CATALOG
// ==========================================
export async function renderDesigns(root) {
  let activeCat = 'all';
  let activeStatus = 'all';
  let searchQuery = '';

  async function load() {
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'skeleton', style: 'height:360px; width:100%;' }));

    try {
      const url = `/api/admin/designs?category=${encodeURIComponent(activeCat)}&status=${encodeURIComponent(activeStatus)}&q=${encodeURIComponent(searchQuery)}`;
      const res = await api(url);
      const items = res.items || [];

      root.innerHTML = '';

      // Category Tabs Bar
      const tabsBar = h('div', { class: 'tabs-bar' });
      const allTab = h('button', {
        class: `tab-btn ${activeCat === 'all' ? 'active' : ''}`,
        onclick: () => { activeCat = 'all'; load(); }
      }, 'All');
      tabsBar.appendChild(allTab);

      CATEGORIES.forEach(c => {
        const btn = h('button', {
          class: `tab-btn ${activeCat === c.key ? 'active' : ''}`,
          onclick: () => { activeCat = c.key; load(); }
        }, c.label);
        tabsBar.appendChild(btn);
      });

      // Search & Actions Toolbar
      const searchInput = h('input', {
        type: 'text',
        class: 'form-input',
        style: 'max-width:280px;',
        placeholder: 'Search designs by name, material...',
        value: searchQuery
      });

      let timer;
      searchInput.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          searchQuery = searchInput.value.trim();
          load();
        }, 300);
      };

      const statusSelect = h('select', { class: 'form-select', style: 'width:auto;' },
        h('option', { value: 'all', selected: activeStatus === 'all', text: 'All Status' }),
        h('option', { value: 'published', selected: activeStatus === 'published', text: 'Published' }),
        h('option', { value: 'draft', selected: activeStatus === 'draft', text: 'Draft' })
      );
      statusSelect.onchange = () => {
        activeStatus = statusSelect.value;
        load();
      };

      const addBtn = h('button', {
        class: 'btn btn-ink btn-sm',
        onclick: () => go('designs/new')
      },
        h('span', { class: 'icon i-plate' }),
        h('span', { text: '+ Add design' })
      );

      const toolbar = h('div', {
        style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;'
      },
        h('div', { style: 'display:flex; gap:10px; align-items:center; flex-wrap:wrap;' }, searchInput, statusSelect),
        addBtn
      );

      // Card Grid
      const grid = h('div', { class: 'catalog-grid' });

      if (items.length === 0) {
        const empty = h('div', { class: 'card', style: 'text-align:center; padding:48px 24px; grid-column: 1 / -1;' },
          h('h3', { text: 'No designs found in this category' }),
          h('p', { class: 'form-hint', text: 'Add a custom design or import handcrafted starters from the dashboard.', style: 'margin:8px 0 20px;' }),
          h('div', { style: 'display:flex; gap:10px; justify-content:center; flex-wrap:wrap;' },
            h('button', { class: 'btn btn-ink btn-sm', onclick: () => go('designs/new') }, 'Add your first design'),
            h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('dashboard') }, 'Import starter designs')
          )
        );
        grid.appendChild(empty);
      } else {
        items.forEach(item => {
          const card = h('div', { class: 'catalog-card' });

          // Media container: Cover photo or drawn plate or initials
          const mediaEl = h('div', { class: 'card-media' });
          if (item.images && item.images.length > 0 && item.images[0].url) {
            mediaEl.appendChild(h('img', { src: item.images[0].url, alt: item.name, loading: 'lazy' }));
          } else if (item.plate && typeof window.renderPlate === 'function') {
            try {
              const plateHtml = window.renderPlate(item.plate, { zoom: 0.6 });
              mediaEl.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; transform:scale(0.65);">${plateHtml}</div>`;
            } catch (_) {
              renderInitialsFallback(mediaEl, item.name);
            }
          } else {
            renderInitialsFallback(mediaEl, item.name);
          }

          // Badges
          const badgesEl = h('div', { class: 'card-badges' });
          if (item.status === 'draft') {
            badgesEl.appendChild(h('span', { class: 'status-pill status-draft', text: 'Draft' }));
          }
          if (item.featured) {
            badgesEl.appendChild(h('span', { class: 'badge-featured', text: 'Featured' }));
          }
          mediaEl.appendChild(badgesEl);

          // Card Body
          const bodyEl = h('div', { class: 'card-body' },
            h('span', { class: 'card-eyebrow', text: CAT_MAP[item.category] || item.category }),
            h('h3', { class: 'card-title', text: item.name }),
            h('p', { class: 'card-meta', text: item.material || 'Handcrafted' }),
            h('div', {
              style: 'font-weight:600; font-size:14px; color:var(--bronze); margin-bottom:12px;',
              text: item.price !== null && item.price !== undefined ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'Price on request'
            })
          );

          // Actions
          const editBtn = h('button', {
            class: 'btn btn-outline btn-sm',
            onclick: () => go(`designs/${item._id}`)
          }, 'Edit');

          const dupBtn = h('button', {
            class: 'btn btn-outline btn-sm',
            title: 'Duplicate',
            onclick: async () => {
              try {
                await api(`/api/admin/designs/${item._id}/duplicate`, { method: 'POST' });
                toast('Design duplicated to drafts', 'success');
                load();
              } catch (err) {
                toast(err.message, 'error');
              }
            }
          }, 'Duplicate');

          const isPub = item.status === 'published';
          const pubBtn = h('button', {
            class: 'btn btn-outline btn-sm',
            onclick: async () => {
              try {
                await api(`/api/admin/designs/${item._id}`, {
                  method: 'PUT',
                  body: { status: isPub ? 'draft' : 'published' }
                });
                toast(`Marked as ${isPub ? 'draft' : 'published'}`, 'success');
                load();
              } catch (err) {
                toast(err.message, 'error');
              }
            }
          }, isPub ? 'Unpublish' : 'Publish');

          const delBtn = h('button', {
            class: 'btn btn-outline btn-sm',
            style: 'color:var(--danger); margin-left:auto;',
            title: 'Delete design',
            onclick: async () => {
              const ok = await confirmDialog({
                title: 'Delete Design',
                message: `Permanently delete "${item.name}"? This cannot be undone.`,
                confirmText: 'Delete',
                danger: true
              });
              if (ok) {
                try {
                  await api(`/api/admin/designs/${item._id}`, { method: 'DELETE' });
                  toast('Design deleted', 'info');
                  load();
                } catch (err) {
                  toast(err.message, 'error');
                }
              }
            }
          }, '✕');

          const actionsEl = h('div', { class: 'card-actions' }, editBtn, dupBtn, pubBtn, delBtn);
          bodyEl.appendChild(actionsEl);

          card.append(mediaEl, bodyEl);
          grid.appendChild(card);
        });
      }

      root.append(tabsBar, toolbar, grid);
    } catch (err) {
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'card' }, h('p', { class: 'form-error', text: err.message })));
    }
  }

  await load();
}

function renderInitialsFallback(parent, name = '') {
  const letters = (name || 'SB').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const box = h('div', {
    style: 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#e8e8e8; color:#777; font-weight:700; font-size:24px;'
  }, letters);
  parent.appendChild(box);
}

// ==========================================
// 2. DESIGN EDITOR FORM (Add / Edit + Live Sticky Preview)
// ==========================================
export async function renderDesignForm(root, id = null) {
  root.innerHTML = '';
  root.appendChild(h('div', { class: 'skeleton', style: 'height:400px; width:100%;' }));

  let existing = null;
  if (id) {
    try {
      const res = await api(`/api/admin/designs/${id}`).catch(async () => {
        const list = await api('/api/admin/designs');
        return { item: (list.items || []).find(i => String(i._id) === id) };
      });
      existing = res.item;
    } catch (err) {
      toast(`Failed to load design: ${err.message}`, 'error');
      go('designs');
      return;
    }
  }

  root.innerHTML = '';

  const isEdit = Boolean(existing);
  let isDirty = false;
  navGuard(() => {
    if (!isDirty) return true;
    return confirm('You have unsaved changes. Discard them?');
  });

  // State buffers
  let photos = existing?.images ? [...existing.images] : [];
  const plateBackup = existing?.plate || null;
  let statusVal = existing?.status || 'published';

  // Back button
  const topNav = h('div', { style: 'margin-bottom:20px;' },
    h('button', {
      class: 'btn btn-outline btn-sm',
      onclick: () => { isDirty = false; go('designs'); }
    }, '← Back to Designs')
  );

  // Form Fields
  const nameInp = h('input', {
    type: 'text',
    class: 'form-input',
    required: true,
    placeholder: 'e.g. Modern Brass Villa Nameplate',
    value: existing?.name || ''
  });
  const nameErr = h('div', { class: 'form-error', style: 'display:none;' });

  const catSelect = h('select', { class: 'form-select', required: true },
    CATEGORIES.map(c => h('option', { value: c.key, selected: existing?.category === c.key, text: c.label }))
  );

  let slugManual = isEdit;
  const slugInp = h('input', {
    type: 'text',
    class: 'form-input',
    required: true,
    placeholder: 'modern-brass-villa-nameplate',
    value: existing?.slug || ''
  });
  const slugErr = h('div', { class: 'form-error', style: 'display:none;' });

  nameInp.oninput = () => {
    isDirty = true;
    if (!slugManual) {
      slugInp.value = slugify(nameInp.value);
    }
    updatePreview();
  };

  slugInp.oninput = () => {
    isDirty = true;
    slugManual = true;
    const v = slugInp.value.trim();
    if (v && !/^[a-z0-9-]{2,80}$/.test(v)) {
      slugErr.textContent = 'Slug must be 2-80 characters using only lowercase letters, numbers, and hyphens';
      slugErr.style.display = 'block';
    } else {
      slugErr.style.display = 'none';
    }
  };

  const matInp = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'e.g. Brass finish, outdoor lacquered',
    value: existing?.material || ''
  });
  matInp.oninput = () => { isDirty = true; updatePreview(); };

  // Tags chip input with suggestions
  function getSuggestions(catKey) {
    const list = [];
    const catData = window.CATALOG && window.CATALOG[catKey];
    if (catData && Array.isArray(catData.filters)) {
      catData.filters.forEach(f => {
        if (f.tag && f.tag !== 'all') list.push(f.tag);
      });
    }
    return list;
  }

  const tagsChips = chipInput({
    values: existing?.tags || [],
    suggestions: getSuggestions(catSelect.value),
    placeholder: 'Add tag...',
    onChange: () => { isDirty = true; }
  });

  catSelect.onchange = () => {
    isDirty = true;
    updatePreview();
  };

  // Description with character counter
  const descInp = h('textarea', {
    class: 'form-textarea',
    rows: 3,
    maxlength: 400,
    placeholder: 'Craftsmanship note, weather endurance and installation overview...',
    value: existing?.desc || ''
  });
  const descCount = h('span', { class: 'form-hint', text: `${descInp.value.length} / 400` });
  descInp.oninput = () => {
    isDirty = true;
    descCount.textContent = `${descInp.value.length} / 400`;
  };

  // Finishes & Sizes
  const finishesChips = chipInput({
    values: existing?.finishes || ['Antique brass', 'Polished brass'],
    placeholder: 'Add finish...',
    onChange: () => { isDirty = true; }
  });

  const sizesChips = chipInput({
    values: existing?.sizes || ['Small (12x6 in)', 'Medium (16x8 in)', 'Large (20x10 in)', 'Custom size'],
    placeholder: 'Add size...',
    onChange: () => { isDirty = true; }
  });

  // Price
  const priceInp = h('input', {
    type: 'number',
    class: 'form-input',
    min: 0,
    step: 1,
    placeholder: 'e.g. 3500',
    value: existing?.price !== null && existing?.price !== undefined ? existing.price : ''
  });
  priceInp.oninput = () => { isDirty = true; updatePreview(); };

  // Photos Uploader
  const uploader = photoUploader({
    images: photos,
    max: 15,
    onChange: (newImgs) => {
      isDirty = true;
      photos = newImgs;
      updatePreview();
    }
  });

  // Status Segmented Toggle
  const pubToggleBtn = h('button', {
    type: 'button',
    class: `btn ${statusVal === 'published' ? 'btn-ink' : 'btn-outline'} btn-sm`,
    onclick: () => {
      isDirty = true;
      statusVal = 'published';
      pubToggleBtn.className = 'btn btn-ink btn-sm';
      draftToggleBtn.className = 'btn btn-outline btn-sm';
    }
  }, 'Published');

  const draftToggleBtn = h('button', {
    type: 'button',
    class: `btn ${statusVal === 'draft' ? 'btn-ink' : 'btn-outline'} btn-sm`,
    onclick: () => {
      isDirty = true;
      statusVal = 'draft';
      draftToggleBtn.className = 'btn btn-ink btn-sm';
      pubToggleBtn.className = 'btn btn-outline btn-sm';
    }
  }, 'Draft');

  const featuredChk = h('input', {
    type: 'checkbox',
    checked: Boolean(existing?.featured),
    onchange: () => { isDirty = true; }
  });

  // Sticky Live Preview Card
  const prevMedia = h('div', { class: 'card-media' });
  const prevEyebrow = h('span', { class: 'card-eyebrow' });
  const prevTitle = h('h3', { class: 'card-title' });
  const prevMeta = h('p', { class: 'card-meta' });
  const prevPrice = h('div', { style: 'font-weight:600; font-size:14px; color:var(--bronze); margin-top:8px;' });

  const previewBox = h('div', { class: 'preview-box' },
    h('div', { class: 'preview-label', text: 'Live Website Card Preview' }),
    prevMedia,
    h('div', { class: 'card-body' }, prevEyebrow, prevTitle, prevMeta, prevPrice)
  );

  function updatePreview() {
    prevEyebrow.textContent = CAT_MAP[catSelect.value] || catSelect.value;
    prevTitle.textContent = nameInp.value.trim() || 'Design Name';
    prevMeta.textContent = matInp.value.trim() || 'Material Spec';

    const p = priceInp.value.trim();
    prevPrice.textContent = p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Price on request';

    prevMedia.innerHTML = '';
    if (photos.length > 0 && photos[0].url) {
      prevMedia.appendChild(h('img', { src: photos[0].url, alt: nameInp.value }));
    } else if (plateBackup && typeof window.renderPlate === 'function') {
      try {
        const pHtml = window.renderPlate(plateBackup, { zoom: 0.65 });
        prevMedia.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; transform:scale(0.65);">${pHtml}</div>`;
      } catch (_) {
        renderInitialsFallback(prevMedia, nameInp.value);
      }
    } else {
      renderInitialsFallback(prevMedia, nameInp.value);
    }
  }

  // Save execution
  async function performSave() {
    nameErr.style.display = 'none';
    slugErr.style.display = 'none';

    const name = nameInp.value.trim();
    if (!name) {
      nameErr.textContent = 'Please enter a design name';
      nameErr.style.display = 'block';
      nameInp.focus();
      return false;
    }

    const slug = slugInp.value.trim() || slugify(name);
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) {
      slugErr.textContent = 'Invalid slug. Must be 2-80 characters using lowercase letters, numbers, and hyphens';
      slugErr.style.display = 'block';
      slugInp.focus();
      return false;
    }

    const payload = {
      name,
      category: catSelect.value,
      slug,
      material: matInp.value.trim(),
      tags: tagsChips.getValues(),
      desc: descInp.value.trim(),
      finishes: finishesChips.getValues(),
      sizes: sizesChips.getValues(),
      price: priceInp.value.trim() ? Number(priceInp.value.trim()) : null,
      images: photos,
      plate: plateBackup,
      status: statusVal,
      featured: featuredChk.checked,
      order: existing?.order || 0
    };

    try {
      if (isEdit) {
        await api(`/api/admin/designs/${id}`, { method: 'PUT', body: payload });
        toast('Design updated successfully', 'success');
      } else {
        await api('/api/admin/designs', { method: 'POST', body: payload });
        toast('Design created successfully', 'success');
      }
      isDirty = false;
      return true;
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('slug')) {
        slugErr.textContent = err.message;
        slugErr.style.display = 'block';
        slugInp.focus();
      } else {
        toast(err.message, 'error');
      }
      return false;
    }
  }

  // Submit Buttons
  const saveBtn = h('button', {
    type: 'button',
    class: 'btn btn-ink',
    onclick: async () => {
      saveBtn.disabled = true;
      const ok = await performSave();
      saveBtn.disabled = false;
      if (ok) go('designs');
    }
  }, 'Save');

  const saveAnotherBtn = h('button', {
    type: 'button',
    class: 'btn btn-outline',
    onclick: async () => {
      const ok = await performSave();
      if (ok) {
        renderDesignForm(root, null);
      }
    }
  }, 'Save and add another');

  const cancelBtn = h('button', {
    type: 'button',
    class: 'btn btn-outline',
    onclick: () => {
      if (!isDirty || confirm('Discard changes?')) {
        isDirty = false;
        go('designs');
      }
    }
  }, 'Cancel');

  // Assemble Layout
  const formCard = h('div', { class: 'card', style: 'margin-bottom:0;' },
    h('h2', { style: 'font-size:20px; font-weight:600; margin-bottom:20px;', text: isEdit ? 'Edit Design' : 'Add New Design' }),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Name *' }),
      nameInp,
      nameErr
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Category *' }),
      catSelect
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'URL Slug *' }),
      slugInp,
      slugErr,
      h('span', { class: 'form-hint', text: 'Auto-generated from name. Path: /design/<slug>' })
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Material Specification' }),
      matInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Filter Tags' }),
      tagsChips,
      h('span', { class: 'form-hint', text: 'Tags match category filters on the website.' })
    ),
    h('div', { class: 'form-group' },
      h('div', { style: 'display:flex; justify-content:space-between;' },
        h('label', { class: 'form-label', text: 'Short Description' }),
        descCount
      ),
      descInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Available Finishes' }),
      finishesChips
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Standard Sizes' }),
      sizesChips
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Price (₹)' }),
      priceInp,
      h('span', { class: 'form-hint', text: 'Leave empty to show Price on request' })
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Photos' }),
      uploader,
      h('span', { class: 'form-hint', text: 'The first photo is the cover. Use clear, well-lit photos.' })
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Publishing Status' }),
      h('div', { style: 'display:flex; gap:8px;' }, pubToggleBtn, draftToggleBtn)
    ),
    h('div', { class: 'form-group' },
      h('label', { style: 'display:flex; align-items:center; gap:8px; cursor:pointer;' },
        featuredChk,
        h('span', { style: 'font-weight:600; font-size:14px;', text: 'Show a Popular badge' })
      )
    ),
    h('div', { style: 'display:flex; gap:10px; margin-top:24px; padding-top:16px; border-top:1px solid var(--border); flex-wrap:wrap;' },
      saveBtn,
      !isEdit ? saveAnotherBtn : null,
      cancelBtn
    )
  );

  const formWrap = h('div', { class: 'form-preview-layout' },
    formCard,
    h('div', { class: 'sticky-preview' }, previewBox)
  );

  updatePreview();
  root.append(topNav, formWrap);
}

// ==========================================
// 3. PROJECTS GALLERY
// ==========================================
export async function renderProjects(root) {
  root.innerHTML = '';
  root.appendChild(h('div', { class: 'skeleton', style: 'height:300px; width:100%;' }));

  try {
    const res = await api('/api/admin/projects');
    let projects = res.items || [];

    root.innerHTML = '';

    const saveOrderBtn = h('button', {
      class: 'btn btn-ink btn-sm',
      style: 'display:none;',
      onclick: async () => {
        try {
          await api('/api/admin/projects/reorder', {
            method: 'PUT',
            body: { ids: projects.map(p => p._id) }
          });
          toast('Project order updated', 'success');
          saveOrderBtn.style.display = 'none';
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    }, 'Save order');

    const addBtn = h('button', {
      class: 'btn btn-ink btn-sm',
      onclick: () => openProjectDrawer(null, () => renderProjects(root))
    },
      h('span', { class: 'icon i-building' }),
      h('span', { text: '+ Add project' })
    );

    const toolbar = h('div', {
      style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;'
    },
      h('div', {},
        h('h2', { style: 'font-size:18px; font-weight:600;', text: `Installation Projects (${projects.length})` }),
        h('p', { class: 'form-hint', text: 'These photos appear in Our Work and Recent Installations on the website.' })
      ),
      h('div', { style: 'display:flex; gap:10px;' }, saveOrderBtn, addBtn)
    );

    const grid = h('div', { class: 'catalog-grid' });

    if (projects.length === 0) {
      grid.appendChild(h('div', { class: 'card', style: 'text-align:center; padding:48px 24px; grid-column:1/-1;' },
        h('h3', { text: 'No projects added yet' }),
        h('p', { class: 'form-hint', text: 'These photos appear in Our Work and Recent Installations on the website.', style: 'margin:8px 0 16px;' }),
        h('button', { class: 'btn btn-ink btn-sm', onclick: () => openProjectDrawer(null, () => renderProjects(root)) }, 'Add your first project')
      ));
    } else {
      projects.forEach((proj, idx) => {
        const card = h('div', { class: 'catalog-card' });

        const media = h('div', { class: 'card-media' });
        if (proj.images && proj.images.length > 0 && proj.images[0].url) {
          media.appendChild(h('img', { src: proj.images[0].url, alt: proj.title, loading: 'lazy' }));
        } else {
          renderInitialsFallback(media, proj.title);
        }

        const badges = h('div', { class: 'card-badges' });
        badges.appendChild(h('span', { class: `status-pill status-${proj.status}`, text: proj.status }));
        media.appendChild(badges);

        const body = h('div', { class: 'card-body' },
          h('span', { class: 'card-eyebrow', text: `${proj.type} · ${proj.location || 'Gujarat'}` }),
          h('h3', { class: 'card-title', text: proj.title }),
          h('p', { class: 'card-meta', text: proj.description || 'On-site installation' })
        );

        // Actions: Reorder up/down + Edit + Delete
        const upBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          disabled: idx === 0,
          title: 'Move earlier',
          onclick: () => {
            const temp = projects[idx];
            projects[idx] = projects[idx - 1];
            projects[idx - 1] = temp;
            saveOrderBtn.style.display = 'inline-flex';
            renderList();
          }
        }, '▲');

        const downBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          disabled: idx === projects.length - 1,
          title: 'Move later',
          onclick: () => {
            const temp = projects[idx];
            projects[idx] = projects[idx + 1];
            projects[idx + 1] = temp;
            saveOrderBtn.style.display = 'inline-flex';
            renderList();
          }
        }, '▼');

        const editBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          onclick: () => openProjectDrawer(proj, () => renderProjects(root))
        }, 'Edit');

        const delBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          style: 'color:var(--danger); margin-left:auto;',
          onclick: async () => {
            const ok = await confirmDialog({
              title: 'Delete Project',
              message: `Delete installation project "${proj.title}"?`,
              confirmText: 'Delete',
              danger: true
            });
            if (ok) {
              try {
                await api(`/api/admin/projects/${proj._id}`, { method: 'DELETE' });
                toast('Project deleted', 'info');
                renderProjects(root);
              } catch (err) {
                toast(err.message, 'error');
              }
            }
          }
        }, '✕');

        const actions = h('div', { class: 'card-actions' }, upBtn, downBtn, editBtn, delBtn);
        body.appendChild(actions);

        card.append(media, body);
        grid.appendChild(card);
      });
    }

    function renderList() {
      renderProjects(root);
    }

    root.append(toolbar, grid);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card' }, h('p', { class: 'form-error', text: err.message })));
  }
}

function openProjectDrawer(proj, onReload) {
  const isEdit = Boolean(proj);
  let photos = proj?.images ? [...proj.images] : [];

  const titleInp = h('input', {
    type: 'text',
    class: 'form-input',
    required: true,
    placeholder: 'e.g. Orbit Studio Halo-Lit Fascia',
    value: proj?.title || ''
  });

  const typeSelect = h('select', { class: 'form-select' },
    ['Glow Sign', 'Nameplate', 'Office & Interiors', 'Board', 'Other'].map(t =>
      h('option', { value: t, selected: proj?.type === t, text: t })
    )
  );

  const locInp = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'e.g. Gandhidham, Gujarat',
    value: proj?.location || ''
  });

  const descInp = h('textarea', {
    class: 'form-textarea',
    rows: 3,
    placeholder: 'Details about the materials, dimensions, and mounting...',
    value: proj?.description || ''
  });

  const statusSelect = h('select', { class: 'form-select' },
    h('option', { value: 'published', selected: proj?.status === 'published' || !isEdit, text: 'Published' }),
    h('option', { value: 'draft', selected: proj?.status === 'draft', text: 'Draft' })
  );

  const uploader = photoUploader({
    images: photos,
    max: 10,
    onChange: (imgs) => { photos = imgs; }
  });

  const saveBtn = h('button', {
    type: 'button',
    class: 'btn btn-ink',
    onclick: async () => {
      const title = titleInp.value.trim();
      if (!title) {
        toast('Project title is required', 'error');
        titleInp.focus();
        return;
      }

      const payload = {
        title,
        type: typeSelect.value,
        location: locInp.value.trim(),
        description: descInp.value.trim(),
        images: photos,
        status: statusSelect.value,
        order: proj?.order || 0
      };

      try {
        if (isEdit) {
          await api(`/api/admin/projects/${proj._id}`, { method: 'PUT', body: payload });
          toast('Project updated', 'success');
        } else {
          await api('/api/admin/projects', { method: 'POST', body: payload });
          toast('Project added', 'success');
        }
        drawer.close();
        if (onReload) onReload();
      } catch (err) {
        toast(err.message, 'error');
      }
    }
  }, 'Save Project');

  const content = h('div', { style: 'display:flex; flex-direction:column; gap:16px;' },
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Project Title *' }),
      titleInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Category Type' }),
      typeSelect
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Location' }),
      locInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Description' }),
      descInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Photos' }),
      uploader
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Status' }),
      statusSelect
    ),
    h('div', { style: 'margin-top:10px;' }, saveBtn)
  );

  const drawer = openDrawer({
    title: isEdit ? 'Edit Installation Project' : 'Add Installation Project',
    content
  });
}

// ==========================================
// 4. REVIEWS MANAGEMENT
// ==========================================
export async function renderReviews(root) {
  root.innerHTML = '';
  root.appendChild(h('div', { class: 'skeleton', style: 'height:300px; width:100%;' }));

  try {
    const [reviewsRes, designsRes] = await Promise.all([
      api('/api/admin/reviews'),
      api('/api/admin/designs?status=published').catch(() => ({ items: [] }))
    ]);
    const reviews = reviewsRes.items || [];
    const publishedDesigns = designsRes.items || [];

    root.innerHTML = '';

    const toolbar = h('div', {
      style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;'
    },
      h('div', {},
        h('h2', { style: 'font-size:18px; font-weight:600;', text: `Client Reviews (${reviews.length})` }),
        h('p', { class: 'form-hint', text: 'Only add real customer reviews.' })
      ),
      h('button', {
        class: 'btn btn-ink btn-sm',
        onclick: () => openReviewModal(null, publishedDesigns, () => renderReviews(root))
      },
        h('span', { class: 'icon i-star' }),
        h('span', { text: '+ Add review' })
      )
    );

    const list = h('div', { style: 'display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:18px;' });

    if (reviews.length === 0) {
      list.appendChild(h('div', { class: 'card', style: 'text-align:center; padding:48px 24px; grid-column:1/-1;' },
        h('h3', { text: 'No customer reviews added' }),
        h('p', { class: 'form-hint', text: 'Real client testimonials highlight craft quality and build buyer trust on the website.', style: 'margin:8px 0 16px;' }),
        h('button', {
          class: 'btn btn-ink btn-sm',
          onclick: () => openReviewModal(null, publishedDesigns, () => renderReviews(root))
        }, 'Add review')
      ));
    } else {
      reviews.forEach(rev => {
        const card = h('div', { class: 'card', style: 'display:flex; flex-direction:column; margin-bottom:0;' });

        const stars = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
        const head = h('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;' },
          h('span', { style: 'color:#d97706; font-size:17px; letter-spacing:1px;', text: stars }),
          h('span', { class: `status-pill status-${rev.status}`, text: rev.status })
        );

        const quote = h('p', {
          style: 'font-style:italic; font-size:14px; margin-bottom:14px; flex:1;',
          text: `"${rev.text}"`
        });

        const meta = h('div', { style: 'border-top:1px solid var(--border); padding-top:10px; font-size:13px;' },
          h('strong', { text: rev.name }),
          rev.project ? h('div', { class: 'form-hint', text: rev.project }) : null,
          h('div', { class: 'form-hint', style: 'font-size:11px; margin-top:2px;', text: relTime(rev.createdAt) })
        );

        const editBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          onclick: () => openReviewModal(rev, publishedDesigns, () => renderReviews(root))
        }, 'Edit');

        const isPub = rev.status === 'published';
        const toggleBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          onclick: async () => {
            try {
              await api(`/api/admin/reviews/${rev._id}`, {
                method: 'PUT',
                body: { ...rev, status: isPub ? 'draft' : 'published' }
              });
              toast(`Marked as ${isPub ? 'draft' : 'published'}`, 'success');
              renderReviews(root);
            } catch (err) {
              toast(err.message, 'error');
            }
          }
        }, isPub ? 'Unpublish' : 'Publish');

        const delBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          style: 'color:var(--danger); margin-left:auto;',
          onclick: async () => {
            const ok = await confirmDialog({
              title: 'Delete Review',
              message: `Delete review from ${rev.name}?`,
              confirmText: 'Delete',
              danger: true
            });
            if (ok) {
              try {
                await api(`/api/admin/reviews/${rev._id}`, { method: 'DELETE' });
                toast('Review deleted', 'info');
                renderReviews(root);
              } catch (err) {
                toast(err.message, 'error');
              }
            }
          }
        }, '✕');

        const foot = h('div', { style: 'display:flex; gap:8px; margin-top:12px; align-items:center;' }, editBtn, toggleBtn, delBtn);

        card.append(head, quote, meta, foot);
        list.appendChild(card);
      });
    }

    root.append(toolbar, list);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card' }, h('p', { class: 'form-error', text: err.message })));
  }
}

function openReviewModal(rev, publishedDesigns, onReload) {
  const isEdit = Boolean(rev);
  let rating = rev?.rating || 5;

  const nameInp = h('input', {
    type: 'text',
    class: 'form-input',
    required: true,
    placeholder: 'Customer or business name',
    value: rev?.name || ''
  });

  const textInp = h('textarea', {
    class: 'form-textarea',
    rows: 4,
    maxlength: 600,
    required: true,
    placeholder: 'Real feedback regarding finish quality, packaging or site installation...',
    value: rev?.text || ''
  });
  const textCounter = h('span', { class: 'form-hint', text: `${textInp.value.length} / 600` });
  textInp.oninput = () => { textCounter.textContent = `${textInp.value.length} / 600`; };

  // Star selector
  const starsWrap = h('div', { style: 'display:flex; gap:4px; font-size:24px; cursor:pointer; color:#d97706;' });
  function renderStars() {
    starsWrap.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const s = h('span', {
        text: i <= rating ? '★' : '☆',
        onclick: () => { rating = i; renderStars(); }
      });
      starsWrap.appendChild(s);
    }
  }
  renderStars();

  // Published design selector + Free text project
  const designSelect = h('select', { class: 'form-select' },
    h('option', { value: '', text: '— Select linked catalog design (optional) —' }),
    publishedDesigns.map(d =>
      h('option', { value: d.slug, selected: rev?.designSlug === d.slug, text: d.name })
    )
  );

  const projectInp = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'e.g. Shanti Villa Nameplate or Custom Office Fascia',
    value: rev?.project || ''
  });

  designSelect.onchange = () => {
    if (designSelect.value && !projectInp.value) {
      const match = publishedDesigns.find(d => d.slug === designSelect.value);
      if (match) projectInp.value = match.name;
    }
  };

  const statusSelect = h('select', { class: 'form-select' },
    h('option', { value: 'published', selected: rev?.status === 'published' || !isEdit, text: 'Published' }),
    h('option', { value: 'draft', selected: rev?.status === 'draft', text: 'Draft' })
  );

  const formBody = h('div', { style: 'display:flex; flex-direction:column; gap:14px;' },
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Customer Name *' }),
      nameInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Rating' }),
      starsWrap
    ),
    h('div', { class: 'form-group' },
      h('div', { style: 'display:flex; justify-content:space-between;' },
        h('label', { class: 'form-label', text: 'Review Text *' }),
        textCounter
      ),
      textInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Linked Design' }),
      designSelect
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Project / Client Reference' }),
      projectInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Status' }),
      statusSelect
    )
  );

  openModal({
    title: isEdit ? 'Edit Customer Review' : 'Add Customer Review',
    content: formBody,
    actions: [
      {
        label: 'Cancel',
        onClick: ({ close }) => close()
      },
      {
        label: 'Save Review',
        primary: true,
        onClick: async ({ close }) => {
          const name = nameInp.value.trim();
          const text = textInp.value.trim();
          if (!name || !text) {
            toast('Name and review text are required', 'error');
            return;
          }

          const payload = {
            name,
            text,
            rating,
            designSlug: designSelect.value || '',
            project: projectInp.value.trim(),
            status: statusSelect.value
          };

          try {
            if (isEdit) {
              await api(`/api/admin/reviews/${rev._id}`, { method: 'PUT', body: payload });
              toast('Review updated', 'success');
            } else {
              await api('/api/admin/reviews', { method: 'POST', body: payload });
              toast('Review added', 'success');
            }
            close();
            if (onReload) onReload();
          } catch (err) {
            toast(err.message, 'error');
          }
        }
      }
    ]
  });
}

// ==========================================
// 5. MEDIA STORAGE
// ==========================================
export async function renderMedia(root) {
  root.innerHTML = '';
  root.appendChild(h('div', { class: 'skeleton', style: 'height:300px; width:100%;' }));

  try {
    const res = await api('/api/admin/media');
    const blobs = res.blobs || [];

    root.innerHTML = '';

    const hiddenFile = h('input', {
      type: 'file',
      multiple: true,
      accept: 'image/jpeg,image/png,image/webp',
      style: 'display:none;'
    });

    const dropzone = h('div', {
      class: 'uploader-dropzone',
      style: 'margin-bottom:24px;',
      onclick: () => hiddenFile.click()
    },
      h('p', { html: 'Drag & drop photos here or <strong style="color:var(--bronze); text-decoration:underline;">Browse files</strong>' }),
      h('span', { class: 'form-hint', text: 'Upload directly to Vercel Blob (JPEG, PNG, WebP up to 3 MB)' })
    );

    hiddenFile.onchange = () => handleUpload(hiddenFile.files);

    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
    };

    async function handleUpload(files) {
      if (!files || files.length === 0) return;
      toast('Uploading photos...', 'info');

      for (const file of files) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });
          const dataBase64 = await base64Promise;
          await api('/api/admin/media', {
            method: 'POST',
            body: {
              filename: file.name,
              contentType: file.type || 'image/jpeg',
              dataBase64
            }
          });
        } catch (err) {
          toast(`Failed ${file.name}: ${err.message}`, 'error');
        }
      }
      toast('Uploaded successfully', 'success');
      renderMedia(root);
    }

    const toolbar = h('div', {
      style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;'
    },
      h('h2', { style: 'font-size:18px; font-weight:600;', text: `Vercel Blob Storage (${blobs.length})` }),
      h('button', {
        class: 'btn btn-ink btn-sm',
        onclick: () => hiddenFile.click()
      },
        h('span', { class: 'icon i-layers' }),
        h('span', { text: 'Upload photo' })
      )
    );

    const grid = h('div', { class: 'catalog-grid' });

    if (blobs.length === 0) {
      grid.appendChild(h('div', { class: 'card', style: 'text-align:center; padding:48px 24px; grid-column:1/-1;' },
        h('h3', { text: 'No media uploaded' }),
        h('p', { class: 'form-hint', text: 'Photos added to designs or uploaded directly will be stored in your Vercel Blob bucket.', style: 'margin:8px 0;' })
      ));
    } else {
      blobs.forEach(b => {
        const card = h('div', { class: 'catalog-card' });

        const media = h('div', { class: 'card-media' },
          h('img', { src: b.url, alt: b.pathname || 'Media photo', loading: 'lazy' })
        );

        const fileName = (b.pathname || b.url).split('/').pop();
        const sizeStr = b.size ? `${Math.round(b.size / 1024)} KB` : '';

        const body = h('div', { class: 'card-body' },
          h('div', {
            style: 'font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px;',
            title: fileName,
            text: fileName
          }),
          h('div', { class: 'form-hint', text: `${sizeStr} · ${relTime(b.uploadedAt)}` })
        );

        const copyBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          onclick: () => {
            navigator.clipboard.writeText(b.url);
            toast('URL copied to clipboard', 'success');
          }
        }, 'Copy URL');

        const delBtn = h('button', {
          class: 'btn btn-outline btn-sm',
          style: 'color:var(--danger); margin-left:auto;',
          onclick: async () => {
            const ok = await confirmDialog({
              title: 'Delete Photo',
              message: 'Permanently remove this photo from Blob storage?',
              confirmText: 'Delete',
              danger: true
            });
            if (ok) {
              try {
                await api('/api/admin/media', {
                  method: 'DELETE',
                  body: { url: b.url }
                });
                toast('Photo deleted', 'info');
                renderMedia(root);
              } catch (err) {
                toast(err.message, 'error');
              }
            }
          }
        }, '✕');

        const actions = h('div', { class: 'card-actions' }, copyBtn, delBtn);
        body.appendChild(actions);

        card.append(media, body);
        grid.appendChild(card);
      });
    }

    root.append(toolbar, dropzone, hiddenFile, grid);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card' }, h('p', { class: 'form-error', text: err.message })));
  }
}
