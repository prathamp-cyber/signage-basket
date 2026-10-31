/**
 * Signage Basket — Views: Settings, Password, Backup & Starter Import
 */
import { api, esc, showToast, confirmDialog } from './core.js';

export async function renderSettings(container) {
  container.innerHTML = '<div class="skeleton" style="height: 350px; width: 100%;"></div>';

  try {
    const res = await api('/api/admin/settings');
    const settings = res.settings || {};

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 32px; max-width: 800px;">

        <!-- 1. Business Contact Details -->
        <div class="card">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Workshop & Contact Information</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
            These details are displayed on the public website footer, header, and contact pages.
          </p>

          <form id="contactSettingsForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label" for="setPhone">Phone Number</label>
                <input type="tel" id="setPhone" class="form-input" value="${esc(settings.phone || '')}" placeholder="9825000000">
                <div class="form-hint">10-digit Indian phone number</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="setWhatsapp">WhatsApp Number</label>
                <input type="text" id="setWhatsapp" class="form-input" value="${esc(settings.whatsapp || '')}" placeholder="919825000000">
                <div class="form-hint">Digits with country code, e.g. 919876543210</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="setEmail">Email Address</label>
              <input type="email" id="setEmail" class="form-input" value="${esc(settings.email || '')}" placeholder="hello@signagebasket.in">
            </div>

            <div class="form-group">
              <label class="form-label" for="setAddress">Workshop Address</label>
              <textarea id="setAddress" class="form-textarea" rows="2" placeholder="Street, Industrial Area, Gandhidham, Gujarat">${esc(settings.address || '')}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="setHours">Working Hours</label>
              <input type="text" id="setHours" class="form-input" value="${esc(settings.hours || '')}" placeholder="Mon – Sat: 9:30 AM – 7:30 PM">
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
              <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 14px;">Social Media Profiles</h3>
              <div class="form-group">
                <label class="form-label" for="setInstagram">Instagram URL</label>
                <input type="url" id="setInstagram" class="form-input" value="${esc(settings.instagram || '')}" placeholder="https://instagram.com/signagebasket">
              </div>

              <div class="form-group">
                <label class="form-label" for="setFacebook">Facebook URL</label>
                <input type="url" id="setFacebook" class="form-input" value="${esc(settings.facebook || '')}" placeholder="https://facebook.com/signagebasket">
              </div>

              <div class="form-group">
                <label class="form-label" for="setYoutube">YouTube URL</label>
                <input type="url" id="setYoutube" class="form-input" value="${esc(settings.youtube || '')}" placeholder="https://youtube.com/@signagebasket">
              </div>
            </div>

            <button type="submit" id="btnSaveSettings" class="btn btn-ink btn-sm" style="margin-top: 10px;">
              <span>Save Contact Details</span>
            </button>
          </form>
        </div>

        <!-- 2. Change Password -->
        <div class="card">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Change Admin Password</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
            Update the scrypt-hashed credentials used to sign in to this portal.
          </p>

          <form id="changePasswordForm">
            <div class="form-group">
              <label class="form-label" for="pwdCurrent">Current Password</label>
              <input type="password" id="pwdCurrent" class="form-input" required autocomplete="current-password">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label" for="pwdNext">New Password (min 10 chars)</label>
                <input type="password" id="pwdNext" class="form-input" required minlength="10" autocomplete="new-password">
                <div class="form-hint" id="pwdStrengthHint">Use a combination of letters, numbers, and symbols.</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="pwdConfirm">Confirm New Password</label>
                <input type="password" id="pwdConfirm" class="form-input" required minlength="10" autocomplete="new-password">
              </div>
            </div>

            <button type="submit" id="btnChangePassword" class="btn btn-outline btn-sm">
              <span>Update Password</span>
            </button>
          </form>
        </div>

        <!-- 3. Starter Catalog Importer -->
        <div class="card">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Starter Designs Catalog</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            Import the 33 handcrafted nameplate, LED glow sign, and 3D letters starter designs into MongoDB Atlas. Existing slugs will not be overwritten.
          </p>

          <button type="button" id="btnImportCatalog" class="btn btn-ink btn-sm">
            <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            <span>Import Starter Designs</span>
          </button>
        </div>

        <!-- 4. Data Backup -->
        <div class="card">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Export Data Backup</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            Download an offline JSON copy of all designs, projects, client reviews, and customer enquiries.
          </p>

          <a href="/api/admin/export" download class="btn btn-outline btn-sm">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Download All Data (JSON)</span>
          </a>
        </div>

      </div>
    `;

    // 1. Contact Form Submit
    const contactForm = container.querySelector('#contactSettingsForm');
    contactForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        phone: container.querySelector('#setPhone').value.trim(),
        whatsapp: container.querySelector('#setWhatsapp').value.trim(),
        email: container.querySelector('#setEmail').value.trim(),
        address: container.querySelector('#setAddress').value.trim(),
        hours: container.querySelector('#setHours').value.trim(),
        instagram: container.querySelector('#setInstagram').value.trim(),
        facebook: container.querySelector('#setFacebook').value.trim(),
        youtube: container.querySelector('#setYoutube').value.trim()
      };

      try {
        await api('/api/admin/settings', {
          method: 'PUT',
          body: payload
        });
        showToast('Settings saved successfully', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // 2. Change Password Submit
    const pwdForm = container.querySelector('#changePasswordForm');
    pwdForm.onsubmit = async (e) => {
      e.preventDefault();
      const current = container.querySelector('#pwdCurrent').value;
      const next = container.querySelector('#pwdNext').value;
      const confirm = container.querySelector('#pwdConfirm').value;

      if (next !== confirm) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (next.length < 10) {
        showToast('Password must be at least 10 characters', 'error');
        return;
      }

      try {
        await api('/api/auth/change-password', {
          method: 'POST',
          body: { current, next }
        });
        showToast('Password changed successfully', 'success');
        pwdForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // 3. Import Starter Designs
    const importBtn = container.querySelector('#btnImportCatalog');
    importBtn.onclick = async () => {
      const items = [];
      if (window.CATALOG) {
        for (const [categoryKey, catData] of Object.entries(window.CATALOG)) {
          if (Array.isArray(catData.items)) {
            for (const it of catData.items) {
              items.push({
                category: categoryKey,
                slug: it.slug,
                name: it.name,
                material: it.material || '',
                desc: it.desc || '',
                finishes: it.finishes || catData.defaults?.finishes || [],
                sizes: it.sizes || catData.defaults?.sizes || [],
                tags: it.tags || [],
                price: it.price || null,
                plate: it.plate || null,
                status: 'published',
                featured: false
              });
            }
          }
        }
      }

      if (items.length === 0) {
        showToast('Starter catalog data not loaded from /js/catalog.js', 'error');
        return;
      }

      const confirmed = await confirmDialog({
        title: 'Import Starter Designs',
        message: `Found ${items.length} starter designs across 5 categories. Proceed with import? Existing designs with matching slugs will not be changed.`,
        confirmText: `Import ${items.length} Designs`
      });

      if (confirmed) {
        importBtn.disabled = true;
        importBtn.innerHTML = '<span>Importing...</span>';
        try {
          const res = await api('/api/admin/designs/import', {
            method: 'POST',
            body: { items }
          });
          showToast(`Imported ${res.imported} new designs (${res.skipped} skipped)`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          importBtn.disabled = false;
          importBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            <span>Import Starter Designs</span>
          `;
        }
      }
    };

  } catch (err) {
    container.innerHTML = `<div class="card"><p class="form-error">Failed to load settings: ${esc(err.message)}</p></div>`;
  }
}
