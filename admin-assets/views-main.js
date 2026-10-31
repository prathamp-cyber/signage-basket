/**
 * Signage Basket — Views: Login, Dashboard & Enquiries
 */
import { api, esc, formatRelative, showToast, confirmDialog, openDrawer, closeDrawer, updateBadge } from './core.js';

// ==========================================
// 1. LOGIN VIEW
// ==========================================
export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="login-card">
      <div class="login-header">
        <img src="/assets/logo/logo-wordmark-light.svg" alt="Signage Basket" class="login-logo">
        <p class="login-sub">Management Portal Sign In</p>
      </div>

      <form id="loginForm">
        <div class="form-group">
          <label class="form-label" for="loginUsername">Username</label>
          <input type="text" id="loginUsername" class="form-input" required autocomplete="username" autofocus>
        </div>

        <div class="form-group">
          <label class="form-label" for="loginPassword">Password</label>
          <div class="input-password-wrapper">
            <input type="password" id="loginPassword" class="form-input" required autocomplete="current-password">
            <button type="button" id="togglePasswordBtn" class="pwd-toggle-btn" aria-label="Toggle password visibility">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div id="loginError" class="form-error" style="display: none; margin-bottom: 16px;"></div>

        <button type="submit" id="loginSubmitBtn" class="btn btn-ink btn-lg" style="width: 100%;">
          <span>Sign In</span>
        </button>
      </form>
    </div>
  `;

  const form = container.querySelector('#loginForm');
  const userInp = container.querySelector('#loginUsername');
  const passInp = container.querySelector('#loginPassword');
  const errBox = container.querySelector('#loginError');
  const submitBtn = container.querySelector('#loginSubmitBtn');
  const togglePassBtn = container.querySelector('#togglePasswordBtn');

  togglePassBtn.onclick = () => {
    const isPass = passInp.type === 'password';
    passInp.type = isPass ? 'text' : 'password';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    errBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing in...</span>';

    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: {
          username: userInp.value.trim(),
          password: passInp.value
        }
      });
      showToast('Signed in successfully', 'success');
      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      errBox.textContent = err.message || 'Login failed';
      errBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span>';
    }
  };
}

// ==========================================
// 2. DASHBOARD VIEW
// ==========================================
export async function renderDashboard(container) {
  try {
    const [statsRes, enquiriesRes, settingsRes] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/enquiries?page=1'),
      api('/api/admin/settings')
    ]);

    const stats = statsRes.stats || {};
    const recentEnquiries = (enquiriesRes.items || []).slice(0, 5);
    const settings = settingsRes.settings || {};

    updateBadge(stats.newEnquiries || 0);

    // Checklist calculations
    const hasDesigns = (stats.designsPublished || 0) + (stats.designsDraft || 0) > 0;
    const hasContact = Boolean(settings.phone && settings.email);
    const hasProjects = (stats.projects || 0) > 0;
    const hasReviews = (stats.reviews || 0) > 0;
    const hasChangedPassword = Boolean(settings.updatedAt); // auto ticks if settings or admin doc updated

    const checklistTotal = 5;
    const checklistDone = [hasDesigns, hasContact, hasProjects, hasReviews, hasChangedPassword].filter(Boolean).length;
    const progressPercent = Math.round((checklistDone / checklistTotal) * 100);

    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 4px;">${greeting}, Admin</h2>
        <p style="color: var(--text-muted);">Overview of inquiries, design catalog and website activity.</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-bar">
        <a href="#/designs/new" class="btn btn-ink btn-sm">
          <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Design</span>
        </a>
        <a href="#/projects" class="btn btn-outline btn-sm">
          <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Project</span>
        </a>
        <a href="#/reviews" class="btn btn-outline btn-sm">
          <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Review</span>
        </a>
      </div>

      <!-- 4 Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card" onclick="location.hash='#/enquiries'">
          <div class="stat-header">
            <span class="stat-title">New Enquiries</span>
            ${stats.newEnquiries > 0 ? `<span class="stat-pill">${stats.newEnquiries} Action</span>` : ''}
          </div>
          <div class="stat-val">${stats.newEnquiries || 0}</div>
        </div>

        <div class="stat-card" onclick="location.hash='#/designs'">
          <div class="stat-header">
            <span class="stat-title">Published Designs</span>
          </div>
          <div class="stat-val">${stats.designsPublished || 0}</div>
        </div>

        <div class="stat-card" onclick="location.hash='#/projects'">
          <div class="stat-header">
            <span class="stat-title">Projects</span>
          </div>
          <div class="stat-val">${stats.projects || 0}</div>
        </div>

        <div class="stat-card" onclick="location.hash='#/reviews'">
          <div class="stat-header">
            <span class="stat-title">Reviews</span>
          </div>
          <div class="stat-val">${stats.reviews || 0}</div>
        </div>
      </div>

      <!-- Getting Started Checklist -->
      <div class="card checklist-card">
        <div class="checklist-header">
          <h3 style="font-size: 16px; font-weight: 600;">Setup Checklist</h3>
          <span style="font-size: 13px; font-weight: 600; color: var(--bronze);">${checklistDone} of ${checklistTotal} completed</span>
        </div>
        <div class="checklist-progress-bar">
          <div class="checklist-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="checklist-items">
          <div class="checklist-item ${hasDesigns ? 'done' : ''}">
            <span class="checklist-check">${hasDesigns ? '✓' : ''}</span>
            <span class="checklist-title">Import starter catalog designs</span>
            ${hasDesigns ? '<span style="font-size: 12px; color: var(--text-muted);">Completed</span>' : `<button id="btnImportStarterDash" class="btn btn-outline btn-sm">Import now</button>`}
          </div>
          <div class="checklist-item ${hasContact ? 'done' : ''}">
            <span class="checklist-check">${hasContact ? '✓' : ''}</span>
            <span class="checklist-title">Configure workshop contact info</span>
            <a href="#/settings" class="btn btn-outline btn-sm">${hasContact ? 'Edit' : 'Configure'}</a>
          </div>
          <div class="checklist-item ${hasProjects ? 'done' : ''}">
            <span class="checklist-check">${hasProjects ? '✓' : ''}</span>
            <span class="checklist-title">Add first installation project photos</span>
            <a href="#/projects" class="btn btn-outline btn-sm">${hasProjects ? 'View' : 'Add'}</a>
          </div>
          <div class="checklist-item ${hasReviews ? 'done' : ''}">
            <span class="checklist-check">${hasReviews ? '✓' : ''}</span>
            <span class="checklist-title">Add real client reviews</span>
            <a href="#/reviews" class="btn btn-outline btn-sm">${hasReviews ? 'View' : 'Add'}</a>
          </div>
          <div class="checklist-item ${hasChangedPassword ? 'done' : ''}">
            <span class="checklist-check">${hasChangedPassword ? '✓' : ''}</span>
            <span class="checklist-title">Set a strong custom admin password</span>
            <a href="#/settings" class="btn btn-outline btn-sm">${hasChangedPassword ? 'Manage' : 'Change'}</a>
          </div>
        </div>
      </div>

      <!-- Recent Enquiries -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 16px; font-weight: 600;">Recent Enquiries</h3>
          <a href="#/enquiries" class="btn btn-outline btn-sm">View all</a>
        </div>

        ${recentEnquiries.length === 0 ? `
          <div class="empty-state">
            <p>No customer enquiries yet.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Design / Source</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentEnquiries.map(enq => `
                  <tr class="clickable ${enq.status === 'new' ? 'is-new' : ''}" onclick="location.hash='#/enquiries'">
                    <td>${enq.status === 'new' ? '<span class="row-new-dot"></span>' : ''}${esc(enq.name)}</td>
                    <td>${esc(enq.phone)}</td>
                    <td>${esc(enq.design?.name || enq.source || 'Website')}</td>
                    <td><span title="${new Date(enq.createdAt).toLocaleString()}">${formatRelative(enq.createdAt)}</span></td>
                    <td><span class="status-pill status-${esc(enq.status)}">${esc(enq.status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    const dashImportBtn = container.querySelector('#btnImportStarterDash');
    if (dashImportBtn) {
      dashImportBtn.onclick = async () => {
        location.hash = '#/settings';
      };
    }
  } catch (err) {
    container.innerHTML = `<div class="card"><p class="form-error">Failed to load dashboard: ${esc(err.message)}</p></div>`;
  }
}

// ==========================================
// 3. ENQUIRIES VIEW
// ==========================================
export async function renderEnquiries(container) {
  let activeTab = 'all';
  let searchQuery = '';

  async function loadData() {
    container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';

    try {
      const url = `/api/admin/enquiries?status=${encodeURIComponent(activeTab)}&q=${encodeURIComponent(searchQuery)}`;
      const res = await api(url);
      const items = res.items || [];
      const counts = res.counts || { all: 0, new: 0, contacted: 0, quoted: 0, won: 0, closed: 0 };

      updateBadge(counts.new || 0);

      container.innerHTML = `
        <!-- Filter Tabs -->
        <div class="filter-tabs">
          ${['all', 'new', 'contacted', 'quoted', 'won', 'closed'].map(tab => `
            <button class="filter-tab ${activeTab === tab ? 'active' : ''}" data-tab="${tab}">
              <span style="text-transform: capitalize;">${tab}</span>
              <span class="tab-badge">${counts[tab] !== undefined ? counts[tab] : 0}</span>
            </button>
          `).join('')}
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-search">
            <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="enqSearchInput" class="form-input" placeholder="Search name, phone, design..." value="${esc(searchQuery)}">
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div id="bulkActions" style="display: none; align-items: center; gap: 6px;">
              <select id="bulkStatusSelect" class="form-select" style="width: auto; padding: 6px 10px; font-size: 13px;">
                <option value="">Mark as...</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="won">Won</option>
                <option value="closed">Closed</option>
              </select>
              <button id="bulkApplyBtn" class="btn btn-ink btn-sm">Apply</button>
            </div>
            <button id="exportCsvBtn" class="btn btn-outline btn-sm">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- Table View -->
        ${items.length === 0 ? `
          <div class="card empty-state">
            <div class="empty-state-icon">
              <svg class="svg-icon" style="width: 48px; height: 48px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h3>No enquiries found</h3>
            <p>Try switching status tabs or changing the search filter.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 40px;"><input type="checkbox" id="selectAllCheckbox"></th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Design / Source</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="enquiriesTableBody">
                ${items.map(enq => `
                  <tr class="clickable ${enq.status === 'new' ? 'is-new' : ''}" data-id="${enq._id}">
                    <td onclick="event.stopPropagation();">
                      <input type="checkbox" class="row-select-checkbox" data-id="${enq._id}">
                    </td>
                    <td>${enq.status === 'new' ? '<span class="row-new-dot"></span>' : ''}${esc(enq.name)}</td>
                    <td>${esc(enq.phone)}</td>
                    <td>${esc(enq.city || '—')}</td>
                    <td>${esc(enq.design?.name || enq.source || 'Website')}</td>
                    <td><span title="${new Date(enq.createdAt).toLocaleString()}">${formatRelative(enq.createdAt)}</span></td>
                    <td><span class="status-pill status-${esc(enq.status)}">${esc(enq.status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;

      // Tab clicks
      container.querySelectorAll('.filter-tab').forEach(btn => {
        btn.onclick = () => {
          activeTab = btn.getAttribute('data-tab');
          loadData();
        };
      });

      // Search input debounce
      const searchInput = container.querySelector('#enqSearchInput');
      let searchTimer;
      searchInput.oninput = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = searchInput.value.trim();
          loadData();
        }, 300);
      };

      // Select All Checkbox
      const selectAll = container.querySelector('#selectAllCheckbox');
      const rowCheckboxes = container.querySelectorAll('.row-select-checkbox');
      const bulkActions = container.querySelector('#bulkActions');

      function updateBulkVisibility() {
        const checkedCount = container.querySelectorAll('.row-select-checkbox:checked').length;
        if (bulkActions) {
          bulkActions.style.display = checkedCount > 0 ? 'flex' : 'none';
        }
      }

      if (selectAll) {
        selectAll.onchange = () => {
          rowCheckboxes.forEach(cb => cb.checked = selectAll.checked);
          updateBulkVisibility();
        };
      }

      rowCheckboxes.forEach(cb => {
        cb.onchange = () => {
          if (selectAll && !cb.checked) selectAll.checked = false;
          updateBulkVisibility();
        };
      });

      // Bulk Status Apply
      const bulkApplyBtn = container.querySelector('#bulkApplyBtn');
      const bulkStatusSelect = container.querySelector('#bulkStatusSelect');
      if (bulkApplyBtn) {
        bulkApplyBtn.onclick = async () => {
          const selectedStatus = bulkStatusSelect.value;
          if (!selectedStatus) {
            showToast('Please select a status', 'error');
            return;
          }
          const checkedIds = Array.from(container.querySelectorAll('.row-select-checkbox:checked')).map(cb => cb.getAttribute('data-id'));
          try {
            await api('/api/admin/enquiries', {
              method: 'PATCH',
              body: { ids: checkedIds, status: selectedStatus }
            });
            showToast(`Updated ${checkedIds.length} enquiries to ${selectedStatus}`, 'success');
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      // Export CSV
      const exportCsvBtn = container.querySelector('#exportCsvBtn');
      if (exportCsvBtn) {
        exportCsvBtn.onclick = () => {
          if (items.length === 0) {
            showToast('No enquiries to export', 'error');
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

          const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `signage-basket-enquiries-${new Date().toISOString().slice(0, 10)}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        };
      }

      // Row click to open right drawer
      container.querySelectorAll('#enquiriesTableBody tr').forEach(row => {
        row.onclick = () => {
          const id = row.getAttribute('data-id');
          const enq = items.find(i => String(i._id) === id);
          if (enq) openEnquiryDrawer(enq, () => loadData());
        };
      });

    } catch (err) {
      container.innerHTML = `<div class="card"><p class="form-error">Failed to load enquiries: ${esc(err.message)}</p></div>`;
    }
  }

  await loadData();
}

function openEnquiryDrawer(enq, onUpdate) {
  const detailsHtml = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Customer Information Card -->
      <div style="background-color: var(--surface); padding: 16px; border-radius: var(--radius);">
        <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: var(--text-muted);">Customer</h4>
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${esc(enq.name)}</div>
        <div style="font-size: 14px; margin-bottom: 4px;">📞 <a href="tel:${esc(enq.phone)}" style="text-decoration: underline;">+91 ${esc(enq.phone)}</a></div>
        ${enq.email ? `<div style="font-size: 14px; margin-bottom: 4px;">✉️ <a href="mailto:${esc(enq.email)}">${esc(enq.email)}</a></div>` : ''}
        ${enq.city ? `<div style="font-size: 14px; margin-bottom: 4px;">📍 City: <strong>${esc(enq.city)}</strong></div>` : ''}
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Received: ${new Date(enq.createdAt).toLocaleString()}</div>
      </div>

      <!-- Design / Requirements Card -->
      <div style="background-color: var(--surface); padding: 16px; border-radius: var(--radius);">
        <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: var(--text-muted);">Design & Specifications</h4>
        ${enq.design ? `
          <div style="font-weight: 600; margin-bottom: 6px;">${esc(enq.design.name || enq.design.slug)}</div>
          <div style="font-size: 13px; color: var(--bronze); margin-bottom: 8px;">Category: ${esc(enq.design.category || '—')}</div>
        ` : `<div style="font-size: 14px; font-style: italic;">General website enquiry</div>`}

        ${enq.details && Object.keys(enq.details).length > 0 ? `
          <div style="font-size: 13px; border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 8px;">
            ${Object.entries(enq.details).map(([k, v]) => `
              <div style="margin-bottom: 4px;"><strong>${esc(k)}:</strong> ${Array.isArray(v) ? esc(v.join(' / ')) : esc(v)}</div>
            `).join('')}
          </div>
        ` : ''}

        ${enq.message ? `
          <div style="margin-top: 12px; padding: 10px; background: #ffffff; border-radius: var(--radius); font-size: 13px;">
            <strong>Customer Message:</strong>
            <p style="margin-top: 4px; white-space: pre-wrap;">${esc(enq.message)}</p>
          </div>
        ` : ''}
      </div>

      <!-- Status Dropdown -->
      <div>
        <label class="form-label" for="drawerStatusSelect">Lead Status</label>
        <select id="drawerStatusSelect" class="form-select">
          <option value="new" ${enq.status === 'new' ? 'selected' : ''}>New Lead</option>
          <option value="contacted" ${enq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
          <option value="quoted" ${enq.status === 'quoted' ? 'selected' : ''}>Quoted</option>
          <option value="won" ${enq.status === 'won' ? 'selected' : ''}>Won (Order Placed)</option>
          <option value="closed" ${enq.status === 'closed' ? 'selected' : ''}>Closed / Not Interested</option>
        </select>
      </div>

      <!-- Workshop Notes -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label class="form-label" for="drawerNotesText" style="margin-bottom: 0;">Internal Notes</label>
          <span id="notesSavedTick" style="font-size: 12px; color: var(--success); display: none;">Saved ✓</span>
        </div>
        <textarea id="drawerNotesText" class="form-textarea" rows="4" placeholder="Add sizing, site visit notes, pricing estimate...">${esc(enq.notes || '')}</textarea>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
        <a id="drawerWhatsAppBtn" href="#" target="_blank" rel="noopener" class="btn btn-ink" style="background-color: #25D366; border-color: #25D366;">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span>Reply on WhatsApp</span>
        </a>

        <a href="tel:${esc(enq.phone)}" class="btn btn-outline">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>Call Customer</span>
        </a>

        <button id="drawerCopyBtn" class="btn btn-outline">
          <svg class="svg-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy Lead Details</span>
        </button>

        <button id="drawerDeleteBtn" class="btn btn-danger btn-sm" style="margin-top: 10px;">
          <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Delete Enquiry</span>
        </button>
      </div>
    </div>
  `;

  openDrawer(`Enquiry: ${enq.name}`, detailsHtml, (drawerEl) => {
    // WhatsApp prefilled message
    const designName = enq.design?.name || 'signage';
    const waText = encodeURIComponent(`Hello ${enq.name}, thank you for contacting Signage Basket regarding ${designName}. How can we assist you today?`);
    const waBtn = drawerEl.querySelector('#drawerWhatsAppBtn');
    waBtn.href = `https://wa.me/91${enq.phone}?text=${waText}`;

    // Copy Lead Details
    const copyBtn = drawerEl.querySelector('#drawerCopyBtn');
    copyBtn.onclick = () => {
      const summary = `Signage Basket Enquiry\nCustomer: ${enq.name}\nPhone: ${enq.phone}\nDesign: ${enq.design?.name || 'General'}\nCity: ${enq.city || 'N/A'}\nMessage: ${enq.message || 'N/A'}`;
      navigator.clipboard.writeText(summary).then(() => {
        showToast('Lead details copied to clipboard', 'success');
      });
    };

    // Status Change
    const statusSelect = drawerEl.querySelector('#drawerStatusSelect');
    statusSelect.onchange = async () => {
      try {
        await api(`/api/admin/enquiries/${enq._id}`, {
          method: 'PATCH',
          body: { status: statusSelect.value }
        });
        showToast(`Status updated to ${statusSelect.value}`, 'success');
        if (typeof onUpdate === 'function') onUpdate();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Notes auto-save on blur
    const notesText = drawerEl.querySelector('#drawerNotesText');
    const savedTick = drawerEl.querySelector('#notesSavedTick');
    notesText.onblur = async () => {
      try {
        await api(`/api/admin/enquiries/${enq._id}`, {
          method: 'PATCH',
          body: { notes: notesText.value }
        });
        savedTick.style.display = 'inline';
        setTimeout(() => savedTick.style.display = 'none', 2000);
      } catch (err) {
        showToast('Failed to save notes: ' + err.message, 'error');
      }
    };

    // Delete Enquiry
    const deleteBtn = drawerEl.querySelector('#drawerDeleteBtn');
    deleteBtn.onclick = async () => {
      const confirmed = await confirmDialog({
        title: 'Delete Enquiry',
        message: `Are you sure you want to permanently delete the enquiry from ${enq.name}?`,
        confirmText: 'Delete',
        danger: true
      });
      if (confirmed) {
        try {
          await api(`/api/admin/enquiries/${enq._id}`, { method: 'DELETE' });
          showToast('Enquiry deleted', 'info');
          closeDrawer();
          if (typeof onUpdate === 'function') onUpdate();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };
  });
}
