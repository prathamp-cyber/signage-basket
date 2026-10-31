/**
 * Signage Basket — Views: Settings, Password & Backups
 */
import { api, toast, confirmDialog, h, esc } from './core.js';
import { importStarterCatalog } from './views-main.js';

export async function renderSettings(root) {
  let settings = {};
  try {
    const res = await api('/api/admin/settings');
    settings = res.settings || {};
  } catch (err) {
    toast(`Failed to load settings: ${err.message}`, 'error');
  }

  const container = h('div', { style: 'max-width:760px; display:flex; flex-direction:column; gap:24px;' });

  // ------------------------------------------
  // 1. Business Contact Details Card
  // ------------------------------------------
  const phoneInp = h('input', {
    type: 'tel',
    class: 'form-input',
    placeholder: '9825000000',
    value: settings.phone || ''
  });
  const phoneErr = h('div', { class: 'form-error', style: 'display:none;' });

  const waInp = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: '919825000000',
    value: settings.whatsapp || ''
  });
  const waErr = h('div', { class: 'form-error', style: 'display:none;' });

  const emailInp = h('input', {
    type: 'email',
    class: 'form-input',
    placeholder: 'hello@signagebasket.in',
    value: settings.email || ''
  });
  const emailErr = h('div', { class: 'form-error', style: 'display:none;' });

  const addrInp = h('textarea', {
    class: 'form-textarea',
    rows: 2,
    placeholder: 'Workshop address in Gandhidham, Gujarat',
    value: settings.address || ''
  });

  const hoursInp = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'Mon – Sat: 9:30 AM – 7:30 PM',
    value: settings.hours || ''
  });

  // ------------------------------------------
  // 2. Social Links Card
  // ------------------------------------------
  const instaInp = h('input', {
    type: 'url',
    class: 'form-input',
    placeholder: 'https://instagram.com/signagebasket',
    value: settings.instagram || ''
  });

  const fbInp = h('input', {
    type: 'url',
    class: 'form-input',
    placeholder: 'https://facebook.com/signagebasket',
    value: settings.facebook || ''
  });

  const ytInp = h('input', {
    type: 'url',
    class: 'form-input',
    placeholder: 'https://youtube.com/@signagebasket',
    value: settings.youtube || ''
  });

  const saveSettingsBtn = h('button', {
    type: 'button',
    class: 'btn btn-ink btn-sm',
    style: 'margin-top:14px;',
    onclick: async () => {
      phoneErr.style.display = 'none';
      waErr.style.display = 'none';
      emailErr.style.display = 'none';

      const phone = phoneInp.value.trim().replace(/\D/g, '');
      if (phone && phone.length !== 10) {
        phoneErr.textContent = 'Phone number must be exactly 10 digits';
        phoneErr.style.display = 'block';
        return;
      }

      const wa = waInp.value.trim().replace(/\D/g, '');
      if (wa && (wa.length < 10 || wa.length > 15)) {
        waErr.textContent = 'Enter WhatsApp digits with country code (e.g. 919876543210)';
        waErr.style.display = 'block';
        return;
      }

      const email = emailInp.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailErr.textContent = 'Please enter a valid email address';
        emailErr.style.display = 'block';
        return;
      }

      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = 'Saving...';

      try {
        await api('/api/admin/settings', {
          method: 'PUT',
          body: {
            phone,
            whatsapp: wa,
            email,
            address: addrInp.value.trim(),
            hours: hoursInp.value.trim(),
            instagram: instaInp.value.trim(),
            facebook: fbInp.value.trim(),
            youtube: ytInp.value.trim()
          }
        });
        toast('Settings saved successfully', 'success');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = 'Save details';
      }
    }
  }, 'Save details');

  const businessCard = h('div', { class: 'card' },
    h('h3', { text: 'Business details', style: 'font-size:17px; font-weight:600; margin-bottom:6px;' }),
    h('p', { class: 'form-hint', style: 'margin-bottom:18px;', text: 'Displayed in public footer, contact page, and quote enquiries.' }),

    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Phone number' }),
      phoneInp,
      phoneErr,
      h('span', { class: 'form-hint', text: '10 digits' })
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'WhatsApp number' }),
      waInp,
      waErr,
      h('span', { class: 'form-hint', text: 'Digits with country code, e.g. 919876543210' })
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Email' }),
      emailInp,
      emailErr
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Address' }),
      addrInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Working hours' }),
      hoursInp
    ),
    h('div', { style: 'margin-top:20px; padding-top:16px; border-top:1px solid var(--border);' },
      h('h4', { style: 'font-size:15px; font-weight:600; margin-bottom:12px;', text: 'Social links' }),
      h('div', { class: 'form-group' },
        h('label', { class: 'form-label', text: 'Instagram URL' }),
        instaInp
      ),
      h('div', { class: 'form-group' },
        h('label', { class: 'form-label', text: 'Facebook URL' }),
        fbInp
      ),
      h('div', { class: 'form-group' },
        h('label', { class: 'form-label', text: 'YouTube URL' }),
        ytInp
      )
    ),
    saveSettingsBtn
  );

  // ------------------------------------------
  // 3. Change Password Card
  // ------------------------------------------
  const currentPassInp = h('input', { type: 'password', class: 'form-input', required: true });
  const newPassInp = h('input', { type: 'password', class: 'form-input', required: true, minlength: 10 });
  const confirmPassInp = h('input', { type: 'password', class: 'form-input', required: true });

  const strengthBar = h('div', { class: 'checklist-bar', style: 'margin:8px 0 4px;' });
  const strengthFill = h('div', { class: 'checklist-fill', style: 'width:0%;' });
  strengthBar.appendChild(strengthFill);

  const strengthText = h('div', { class: 'form-hint', text: 'Minimum 10 characters' });

  newPassInp.oninput = () => {
    const val = newPassInp.value;
    let score = 0;
    if (val.length >= 10) score += 30;
    if (/[A-Z]/.test(val)) score += 20;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;

    strengthFill.style.width = `${Math.min(100, score)}%`;
    if (score < 50) {
      strengthFill.style.backgroundColor = 'var(--danger)';
      strengthText.textContent = 'Weak (add numbers/symbols)';
    } else if (score < 75) {
      strengthFill.style.backgroundColor = '#f59e0b';
      strengthText.textContent = 'Medium strength';
    } else {
      strengthFill.style.backgroundColor = 'var(--success)';
      strengthText.textContent = 'Strong password';
    }
  };

  const passErr = h('div', { class: 'form-error', style: 'display:none; margin-bottom:10px;' });

  const passForm = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      passErr.style.display = 'none';

      const cur = currentPassInp.value;
      const next = newPassInp.value;
      const conf = confirmPassInp.value;

      if (next.length < 10) {
        passErr.textContent = 'New password must be at least 10 characters long';
        passErr.style.display = 'block';
        return;
      }
      if (next !== conf) {
        passErr.textContent = 'New passwords do not match';
        passErr.style.display = 'block';
        return;
      }

      try {
        await api('/api/auth/change-password', {
          method: 'POST',
          body: { current: cur, next }
        });
        toast('Password updated successfully', 'success');
        currentPassInp.value = '';
        newPassInp.value = '';
        confirmPassInp.value = '';
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Minimum 10 characters';
      } catch (err) {
        passErr.textContent = err.message;
        passErr.style.display = 'block';
      }
    }
  },
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Current password' }),
      currentPassInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'New password' }),
      newPassInp,
      strengthBar,
      strengthText
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Confirm new password' }),
      confirmPassInp
    ),
    passErr,
    h('button', { type: 'submit', class: 'btn btn-outline btn-sm' }, 'Change password')
  );

  const passCard = h('div', { class: 'card' },
    h('h3', { text: 'Change password', style: 'font-size:17px; font-weight:600; margin-bottom:6px;' }),
    h('p', { class: 'form-hint', style: 'margin-bottom:18px;', text: 'Change your admin credentials (scrypt-hashed with salt).' }),
    passForm
  );

  // ------------------------------------------
  // 4. Starter Designs Card
  // ------------------------------------------
  const starterCard = h('div', { class: 'card' },
    h('h3', { text: 'Starter designs', style: 'font-size:17px; font-weight:600; margin-bottom:6px;' }),
    h('p', { class: 'form-hint', style: 'margin-bottom:14px;', text: 'Import catalog items from /js/catalog.js into your MongoDB database.' }),
    h('button', {
      type: 'button',
      class: 'btn btn-ink btn-sm',
      onclick: () => importStarterCatalog()
    },
      h('span', { class: 'icon i-plate' }),
      h('span', { text: 'Import starter designs' })
    )
  );

  // ------------------------------------------
  // 5. Data Backup Card
  // ------------------------------------------
  const backupCard = h('div', { class: 'card' },
    h('h3', { text: 'Backup', style: 'font-size:17px; font-weight:600; margin-bottom:6px;' }),
    h('p', { class: 'form-hint', style: 'margin-bottom:14px;', text: 'Export all designs, projects, client reviews, and enquiries as a single JSON file.' }),
    h('a', {
      href: '/api/admin/export',
      download: `signage-basket-backup-${new Date().toISOString().slice(0, 10)}.json`,
      class: 'btn btn-outline btn-sm'
    },
      h('span', { class: 'icon i-arrow-up' }),
      h('span', { text: 'Download all data (JSON)' })
    )
  );

  container.append(businessCard, passCard, starterCard, backupCard);
  root.appendChild(container);
}
