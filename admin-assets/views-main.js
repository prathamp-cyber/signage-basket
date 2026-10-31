/**
 * Signage Basket — Main Views: Dashboard & Enquiries
 */
import {
  api,
  toast,
  confirmDialog,
  openDrawer,
  h,
  esc,
  relTime,
  fmtDate,
  go,
  state
} from './core.js';

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
export async function renderDashboard(root) {
  const [statsRes, enquiriesRes, settingsRes] = await Promise.all([
    api('/api/admin/stats').catch(() => ({ stats: {} })),
    api('/api/admin/enquiries?page=1').catch(() => ({ items: [] })),
    api('/api/admin/settings').catch(() => ({ settings: {} }))
  ]);

  const stats = statsRes.stats || {};
  const recentEnquiries = (enquiriesRes.items || []).slice(0, 5);
  const settings = settingsRes.settings || {};

  const username = state.user?.username || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Checklist items
  const hasDesigns = ((stats.designsPublished || 0) + (stats.designsDraft || 0)) > 0;
  const hasContact = Boolean(settings.phone && settings.email);
  const hasProjects = (stats.projects || 0) > 0;
  const hasReviews = (stats.reviews || 0) > 0;
  const hasPasswordChanged = Boolean(settings.updatedAt);

  const doneCount = [hasDesigns, hasContact, hasProjects, hasReviews, hasPasswordChanged].filter(Boolean).length;
  const progressPct = Math.round((doneCount / 5) * 100);

  // Layout tree
  const headEl = h('div', { style: 'margin-bottom:24px;' },
    h('h2', { style: 'font-size:24px; font-weight:600; margin-bottom:4px;', text: `${greeting}, ${username}` }),
    h('p', { class: 'form-hint', text: 'Welcome to your Signage Basket management dashboard.' })
  );

  // Quick Action Buttons
  const quickActions = h('div', { style: 'display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap;' },
    h('button', { class: 'btn btn-ink btn-sm', onclick: () => go('designs/new') },
      h('span', { class: 'icon i-plate' }),
      h('span', { text: 'Add design' })
    ),
    h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('projects') },
      h('span', { class: 'icon i-building' }),
      h('span', { text: 'Add project' })
    ),
    h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('reviews') },
      h('span', { class: 'icon i-star' }),
      h('span', { text: 'Add review' })
    )
  );

  // 4 Clickable Stat Cards
  const statsRow = h('div', { class: 'stats-row' },
    h('div', { class: 'stat-box', onclick: () => go('enquiries') },
      h('div', { class: 'stat-top' },
        h('span', { class: 'stat-name', text: 'New enquiries' }),
        stats.newEnquiries > 0 ? h('span', { class: 'status-pill status-new', text: `${stats.newEnquiries} Action` }) : null
      ),
      h('div', { class: 'stat-number', text: String(stats.newEnquiries || 0) })
    ),
    h('div', { class: 'stat-box', onclick: () => go('designs') },
      h('div', { class: 'stat-top' },
        h('span', { class: 'stat-name', text: 'Published designs' })
      ),
      h('div', { class: 'stat-number', text: String(stats.designsPublished || 0) })
    ),
    h('div', { class: 'stat-box', onclick: () => go('projects') },
      h('div', { class: 'stat-top' },
        h('span', { class: 'stat-name', text: 'Projects' })
      ),
      h('div', { class: 'stat-number', text: String(stats.projects || 0) })
    ),
    h('div', { class: 'stat-box', onclick: () => go('reviews') },
      h('div', { class: 'stat-top' },
        h('span', { class: 'stat-name', text: 'Reviews' })
      ),
      h('div', { class: 'stat-number', text: String(stats.reviews || 0) })
    )
  );

  // Checklist Card
  const importBtn = h('button', {
    class: 'btn btn-outline btn-sm',
    onclick: async () => {
      await importStarterCatalog();
      renderDashboard(root);
    }
  }, 'Import now');

  const checklistCard = h('div', { class: 'card' },
    h('div', { style: 'display:flex; justify-content:space-between; align-items:center;' },
      h('h3', { text: 'Getting Started Checklist', style: 'font-size:16px; font-weight:600;' }),
      h('span', { class: 'form-hint', text: `${doneCount} of 5 completed` })
    ),
    h('div', { class: 'checklist-bar' },
      h('div', { class: 'checklist-fill', style: `width: ${progressPct}%;` })
    ),
    h('div', { class: 'checklist-list' },
      h('div', { class: `checklist-row ${hasDesigns ? 'is-done' : ''}` },
        h('span', { class: 'check-tick', text: hasDesigns ? '✓' : '' }),
        h('span', { style: 'flex:1; font-weight:500;', text: 'Import starter designs into catalog' }),
        hasDesigns ? h('span', { class: 'form-hint', text: 'Done' }) : importBtn
      ),
      h('div', { class: `checklist-row ${hasContact ? 'is-done' : ''}` },
        h('span', { class: 'check-tick', text: hasContact ? '✓' : '' }),
        h('span', { style: 'flex:1; font-weight:500;', text: 'Add contact details in settings' }),
        h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('settings') }, hasContact ? 'Edit' : 'Configure')
      ),
      h('div', { class: `checklist-row ${hasProjects ? 'is-done' : ''}` },
        h('span', { class: 'check-tick', text: hasProjects ? '✓' : '' }),
        h('span', { style: 'flex:1; font-weight:500;', text: 'Add first project photos to gallery' }),
        h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('projects') }, hasProjects ? 'View' : 'Add')
      ),
      h('div', { class: `checklist-row ${hasReviews ? 'is-done' : ''}` },
        h('span', { class: 'check-tick', text: hasReviews ? '✓' : '' }),
        h('span', { style: 'flex:1; font-weight:500;', text: 'Add first real customer review' }),
        h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('reviews') }, hasReviews ? 'View' : 'Add')
      ),
      h('div', { class: `checklist-row ${hasPasswordChanged ? 'is-done' : ''}` },
        h('span', { class: 'check-tick', text: hasPasswordChanged ? '✓' : '' }),
        h('span', { style: 'flex:1; font-weight:500;', text: 'Change the starter default password' }),
        h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('settings') }, hasPasswordChanged ? 'Manage' : 'Change')
      )
    )
  );

  // Recent Enquiries Card
  const recentTable = h('div', { class: 'table-wrap' },
    h('table', { class: 'admin-table' },
      h('thead', {},
        h('tr', {},
          h('th', { text: 'Customer' }),
          h('th', { text: 'Phone' }),
          h('th', { text: 'Design / Source' }),
          h('th', { text: 'Date' }),
          h('th', { text: 'Status' })
        )
      ),
      h('tbody', {},
        recentEnquiries.length === 0
          ? h('tr', {}, h('td', { colspan: '5', class: 'form-hint', style: 'text-align:center; padding:24px;', text: 'No enquiries received yet.' }))
          : recentEnquiries.map(enq =>
              h('tr', { class: `row-click ${enq.status === 'new' ? 'row-new' : ''}`, onclick: () => go('enquiries') },
                h('td', {},
                  enq.status === 'new' ? h('span', { class: 'dot-bronze' }) : null,
                  enq.name
                ),
                h('td', { text: enq.phone }),
                h('td', { text: enq.design?.name || enq.source || 'Website' }),
                h('td', { title: fmtDate(enq.createdAt), text: relTime(enq.createdAt) }),
                h('td', {}, h('span', { class: `status-pill status-${enq.status}`, text: enq.status }))
              )
            )
      )
    )
  );

  const recentCard = h('div', { class: 'card' },
    h('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;' },
      h('h3', { text: 'Recent Enquiries', style: 'font-size:16px; font-weight:600;' }),
      h('button', { class: 'btn btn-outline btn-sm', onclick: () => go('enquiries') }, 'View all')
    ),
    recentTable
  );

  root.append(headEl, quickActions, statsRow, checklistCard, recentCard);
}

// Starter Catalog Importer helper shared across dashboard and settings
export async function importStarterCatalog() {
  const items = [];
  if (window.CATALOG) {
    for (const [catKey, catData] of Object.entries(window.CATALOG)) {
      if (Array.isArray(catData.items)) {
        for (const it of catData.items) {
          items.push({
            category: catKey,
            slug: it.slug,
            name: it.name,
            material: it.material || '',
            desc: it.desc || '',
            finishes: it.finishes || catData.defaults?.finishes || [],
            sizes: it.sizes || catData.defaults?.sizes || [],
            tags: it.tags || [],
            price: it.price !== undefined ? it.price : null,
            plate: it.plate || null,
            status: 'published',
            featured: false
          });
        }
      }
    }
  }

  if (items.length === 0) {
    toast('No starter designs found in catalog.js', 'error');
    return;
  }

  const ok = await confirmDialog({
    title: 'Import Starter Catalog',
    message: `Ready to import ${items.length} starter designs across 5 categories into MongoDB Atlas. Existing slugs will be preserved. Proceed?`,
    confirmText: `Import ${items.length} Designs`
  });

  if (!ok) return;

  try {
    const res = await api('/api/admin/designs/import', {
      method: 'POST',
      body: { items }
    });
    toast(`Imported ${res.imported} new designs (${res.skipped} skipped)`, 'success');
  } catch (err) {
    toast(`Import failed: ${err.message}`, 'error');
  }
}

// ==========================================
// 2. ENQUIRIES VIEW
// ==========================================
export async function renderEnquiries(root) {
  let currentTab = 'all';
  let searchQuery = '';
  let currentPage = 1;
  let selectedIds = new Set();

  async function load() {
    root.innerHTML = '';
    const skel = h('div', { class: 'skeleton', style: 'height:300px; width:100%;' });
    root.appendChild(skel);

    try {
      const url = `/api/admin/enquiries?status=${encodeURIComponent(currentTab)}&q=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
      const res = await api(url);
      const items = res.items || [];
      const counts = res.counts || { all: 0, new: 0, contacted: 0, quoted: 0, won: 0, closed: 0 };

      root.innerHTML = '';

      // Status Tabs Bar
      const tabs = ['all', 'new', 'contacted', 'quoted', 'won', 'closed'];
      const tabsBar = h('div', { class: 'tabs-bar' });
      tabs.forEach(tab => {
        const btn = h('button', {
          class: `tab-btn ${currentTab === tab ? 'active' : ''}`,
          onclick: () => {
            currentTab = tab;
            currentPage = 1;
            selectedIds.clear();
            load();
          }
        },
          h('span', { text: tab.charAt(0).toUpperCase() + tab.slice(1) }),
          h('span', { class: 'tab-counter', text: String(counts[tab] || 0) })
        );
        tabsBar.appendChild(btn);
      });

      // Search & Bulk Toolbar
      const searchInput = h('input', {
        type: 'text',
        class: 'form-input',
        style: 'max-width:320px;',
        placeholder: 'Search customer, phone, design...',
        value: searchQuery
      });

      let debounceTimer;
      searchInput.oninput = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchQuery = searchInput.value.trim();
          currentPage = 1;
          load();
        }, 300);
      };

      const bulkBar = h('div', { style: 'display:none; align-items:center; gap:8px;' });
      const bulkStatusSelect = h('select', { class: 'form-select', style: 'width:auto;' },
        h('option', { value: '', text: 'Mark as...' }),
        h('option', { value: 'new', text: 'New' }),
        h('option', { value: 'contacted', text: 'Contacted' }),
        h('option', { value: 'quoted', text: 'Quoted' }),
        h('option', { value: 'won', text: 'Won' }),
        h('option', { value: 'closed', text: 'Closed' })
      );

      const bulkApplyBtn = h('button', {
        class: 'btn btn-ink btn-sm',
        onclick: async () => {
          const status = bulkStatusSelect.value;
          if (!status) return;
          try {
            await api('/api/admin/enquiries', {
              method: 'PATCH',
              body: { ids: Array.from(selectedIds), status }
            });
            toast(`Updated ${selectedIds.size} enquiries`, 'success');
            selectedIds.clear();
            load();
          } catch (err) {
            toast(err.message, 'error');
          }
        }
      }, 'Apply');

      const bulkDeleteBtn = h('button', {
        class: 'btn btn-danger btn-sm',
        onclick: async () => {
          const ok = await confirmDialog({
            title: 'Delete Enquiries',
            message: `Permanently delete ${selectedIds.size} selected enquiries?`,
            confirmText: 'Delete',
            danger: true
          });
          if (ok) {
            try {
              await api('/api/admin/enquiries', {
                method: 'DELETE',
                body: { ids: Array.from(selectedIds) }
              });
              toast('Deleted selected enquiries', 'info');
              selectedIds.clear();
              load();
            } catch (err) {
              toast(err.message, 'error');
            }
          }
        }
      }, 'Delete');

      bulkBar.append(bulkStatusSelect, bulkApplyBtn, bulkDeleteBtn);

      const exportCsvBtn = h('button', {
        class: 'btn btn-outline btn-sm',
        onclick: () => exportFilteredCsv(items)
      },
        h('span', { class: 'icon i-arrow-up' }),
        h('span', { text: 'Export CSV' })
      );

      const toolbar = h('div', {
        style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;'
      },
        searchInput,
        h('div', { style: 'display:flex; align-items:center; gap:10px;' }, bulkBar, exportCsvBtn)
      );

      function updateBulkBar() {
        if (selectedIds.size > 0) {
          bulkBar.style.display = 'inline-flex';
        } else {
          bulkBar.style.display = 'none';
        }
      }

      // Desktop Table
      const selectAll = h('input', {
        type: 'checkbox',
        onchange: (e) => {
          if (e.target.checked) {
            items.forEach(it => selectedIds.add(String(it._id)));
          } else {
            selectedIds.clear();
          }
          root.querySelectorAll('.row-chk').forEach(c => c.checked = e.target.checked);
          updateBulkBar();
        }
      });

      const tableEl = h('div', { class: 'table-wrap' },
        h('table', { class: 'admin-table' },
          h('thead', {},
            h('tr', {},
              h('th', { style: 'width:36px;' }, selectAll),
              h('th', { text: 'Customer' }),
              h('th', { text: 'Phone' }),
              h('th', { text: 'City' }),
              h('th', { text: 'Design / Source' }),
              h('th', { text: 'Date' }),
              h('th', { text: 'Status' })
            )
          ),
          h('tbody', {},
            items.length === 0
              ? h('tr', {}, h('td', { colspan: '7', class: 'form-hint', style: 'text-align:center; padding:32px;', text: 'No enquiries found matching this filter.' }))
              : items.map(enq => {
                  const idStr = String(enq._id);
                  const isNew = enq.status === 'new' && !enq.seen;
                  const chk = h('input', {
                    type: 'checkbox',
                    class: 'row-chk',
                    checked: selectedIds.has(idStr),
                    onclick: (e) => e.stopPropagation(),
                    onchange: (e) => {
                      if (e.target.checked) selectedIds.add(idStr);
                      else selectedIds.delete(idStr);
                      updateBulkBar();
                    }
                  });

                  return h('tr', {
                    class: `row-click ${isNew ? 'row-new' : ''}`,
                    onclick: () => openEnquiryDetail(enq, load)
                  },
                    h('td', {}, chk),
                    h('td', {},
                      isNew ? h('span', { class: 'dot-bronze' }) : null,
                      enq.name
                    ),
                    h('td', { text: enq.phone }),
                    h('td', { text: enq.city || '—' }),
                    h('td', { text: enq.design?.name || enq.source || 'Website' }),
                    h('td', { title: fmtDate(enq.createdAt), text: relTime(enq.createdAt) }),
                    h('td', {}, h('span', { class: `status-pill status-${enq.status}`, text: enq.status }))
                  );
                })
          )
        )
      );

      // Mobile Stacked Cards
      const mobileList = h('div', { class: 'mobile-cards' },
        items.map(enq => {
          const isNew = enq.status === 'new' && !enq.seen;
          return h('div', {
            class: 'mobile-card-row',
            onclick: () => openEnquiryDetail(enq, load)
          },
            h('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;' },
              h('strong', { style: 'font-size:15px;' },
                isNew ? h('span', { class: 'dot-bronze' }) : null,
                enq.name
              ),
              h('span', { class: `status-pill status-${enq.status}`, text: enq.status })
            ),
            h('div', { class: 'form-hint', text: `📞 ${enq.phone} · 📍 ${enq.city || 'Gandhidham'}` }),
            h('div', { style: 'font-size:13px; margin:4px 0;' }, enq.design?.name || enq.source || 'General enquiry'),
            h('div', { class: 'form-hint', style: 'font-size:11px;', text: relTime(enq.createdAt) })
          );
        })
      );

      root.append(tabsBar, toolbar, tableEl, mobileList);
    } catch (err) {
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'card' }, h('p', { class: 'form-error', text: err.message })));
    }
  }

  await load();
}

function openEnquiryDetail(enq, onReload) {
  // Mark seen immediately
  if (!enq.seen) {
    api(`/api/admin/enquiries/${enq._id}`, {
      method: 'PATCH',
      body: { seen: true }
    }).catch(() => {});
    enq.seen = true;
  }

  const drawerContent = h('div', { style: 'display:flex; flex-direction:column; gap:20px;' });

  // Customer block
  const custBlock = h('div', { class: 'card', style: 'margin-bottom:0;' },
    h('h4', { class: 'form-label', text: 'Customer Details' }),
    h('div', { style: 'font-size:17px; font-weight:700; margin-bottom:4px;', text: enq.name }),
    h('div', { style: 'font-size:14px; margin-bottom:4px;' },
      '📞 ', h('a', { href: `tel:${enq.phone}`, style: 'text-decoration:underline;' }, `+91 ${enq.phone}`)
    ),
    enq.email ? h('div', { style: 'font-size:14px; margin-bottom:4px;' },
      '✉️ ', h('a', { href: `mailto:${enq.email}` }, enq.email)
    ) : null,
    enq.city ? h('div', { style: 'font-size:14px;' }, `📍 City: ${enq.city}`) : null,
    h('div', { class: 'form-hint', style: 'margin-top:6px;', text: `Received: ${fmtDate(enq.createdAt)} (${relTime(enq.createdAt)})` })
  );

  // Requirements & Design
  const designBlock = h('div', { class: 'card', style: 'margin-bottom:0;' },
    h('h4', { class: 'form-label', text: 'Design & Requirements' }),
    enq.design?.slug ? h('div', { style: 'font-weight:600; margin-bottom:6px;' },
      h('a', {
        href: `/design/${enq.design.slug}`,
        target: '_blank',
        rel: 'noopener',
        style: 'color:var(--bronze); text-decoration:underline;'
      }, enq.design.name || enq.design.slug)
    ) : h('div', { style: 'font-style:italic;', text: 'General enquiry' }),

    enq.details && Object.keys(enq.details).length > 0 ? h('div', { style: 'margin-top:8px; font-size:13px;' },
      Object.entries(enq.details).map(([k, v]) =>
        h('div', { style: 'margin-bottom:3px;' },
          h('strong', { text: `${k}: ` }),
          Array.isArray(v) ? v.join(', ') : String(v)
        )
      )
    ) : null,

    enq.message ? h('div', {
      style: 'background:#fff; border:1px solid var(--border); padding:10px; border-radius:var(--radius); margin-top:10px; font-size:13px;'
    },
      h('strong', { text: 'Message:' }),
      h('p', { style: 'white-space:pre-wrap; margin-top:4px;', text: enq.message })
    ) : null
  );

  // Status Select
  const statusSelect = h('select', { class: 'form-select' },
    h('option', { value: 'new', selected: enq.status === 'new', text: 'New Lead' }),
    h('option', { value: 'contacted', selected: enq.status === 'contacted', text: 'Contacted' }),
    h('option', { value: 'quoted', selected: enq.status === 'quoted', text: 'Quoted' }),
    h('option', { value: 'won', selected: enq.status === 'won', text: 'Won (Order)' }),
    h('option', { value: 'closed', selected: enq.status === 'closed', text: 'Closed' })
  );

  statusSelect.onchange = async () => {
    try {
      await api(`/api/admin/enquiries/${enq._id}`, {
        method: 'PATCH',
        body: { status: statusSelect.value }
      });
      enq.status = statusSelect.value;
      toast(`Status updated to ${statusSelect.value}`, 'success');
      if (onReload) onReload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Notes with Auto-Save on Blur
  const savedTick = h('span', { style: 'font-size:12px; color:var(--success); display:none;', text: 'Saved ✓' });
  const notesText = h('textarea', {
    class: 'form-textarea',
    rows: 4,
    placeholder: 'Add sizing, site visit notes, pricing estimate...',
    value: enq.notes || ''
  });

  notesText.onblur = async () => {
    try {
      await api(`/api/admin/enquiries/${enq._id}`, {
        method: 'PATCH',
        body: { notes: notesText.value.trim() }
      });
      savedTick.style.display = 'inline';
      setTimeout(() => savedTick.style.display = 'none', 1800);
      if (onReload) onReload();
    } catch (err) {
      toast('Failed to save notes', 'error');
    }
  };

  // Action Buttons
  const waDesign = enq.design?.name || 'signage';
  const waMsg = encodeURIComponent(`Hello ${enq.name}, thank you for contacting Signage Basket regarding ${waDesign}. How can we assist you with the design and sizing today?`);

  const waBtn = h('a', {
    href: `https://wa.me/91${enq.phone}?text=${waMsg}`,
    target: '_blank',
    rel: 'noopener',
    class: 'btn btn-ink',
    style: 'background-color:#25D366; border-color:#25D366;'
  },
    h('span', { class: 'icon i-whatsapp' }),
    h('span', { text: 'Reply on WhatsApp' })
  );

  const callBtn = h('a', { href: `tel:${enq.phone}`, class: 'btn btn-outline' },
    h('span', { class: 'icon i-phone' }),
    h('span', { text: 'Call Customer' })
  );

  const copyBtn = h('button', {
    class: 'btn btn-outline',
    onclick: () => {
      const summary = `Signage Basket Enquiry\nName: ${enq.name}\nPhone: ${enq.phone}\nDesign: ${enq.design?.name || 'General'}\nCity: ${enq.city || 'N/A'}\nMessage: ${enq.message || 'N/A'}`;
      navigator.clipboard.writeText(summary);
      toast('Lead details copied to clipboard', 'success');
    }
  }, 'Copy details');

  const deleteBtn = h('button', {
    class: 'btn btn-danger btn-sm',
    style: 'margin-top:10px;',
    onclick: async () => {
      const ok = await confirmDialog({
        title: 'Delete Enquiry',
        message: `Delete enquiry from ${enq.name}?`,
        confirmText: 'Delete',
        danger: true
      });
      if (ok) {
        try {
          await api(`/api/admin/enquiries/${enq._id}`, { method: 'DELETE' });
          toast('Enquiry deleted', 'info');
          drawer.close();
          if (onReload) onReload();
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    }
  }, 'Delete');

  drawerContent.append(
    custBlock,
    designBlock,
    h('div', {},
      h('label', { class: 'form-label', text: 'Status' }),
      statusSelect
    ),
    h('div', {},
      h('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;' },
        h('label', { class: 'form-label', style: 'margin:0;', text: 'Internal Workshop Notes' }),
        savedTick
      ),
      notesText
    ),
    h('div', { style: 'display:flex; flex-direction:column; gap:8px;' },
      waBtn,
      callBtn,
      copyBtn,
      deleteBtn
    )
  );

  const drawer = openDrawer({
    title: `Enquiry: ${enq.name}`,
    content: drawerContent
  });
}

function exportFilteredCsv(items) {
  if (!items || items.length === 0) {
    toast('No enquiries to export', 'error');
    return;
  }

  const headers = ['Date', 'Name', 'Phone', 'Email', 'City', 'Status', 'Design', 'Source', 'Message', 'Notes'];
  const rows = items.map(it => [
    new Date(it.createdAt).toISOString(),
    `"${(it.name || '').replace(/"/g, '""')}"`,
    `"${it.phone || ''}"`,
    `"${it.email || ''}"`,
    `"${(it.city || '').replace(/"/g, '""')}"`,
    it.status,
    `"${(it.design?.name || '').replace(/"/g, '""')}"`,
    `"${(it.source || '').replace(/"/g, '""')}"`,
    `"${(it.message || '').replace(/"/g, '""')}"`,
    `"${(it.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const uri = encodeURI(csv);
  const a = document.createElement('a');
  a.setAttribute('href', uri);
  a.setAttribute('download', `signage-basket-enquiries-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}
