/**
 * Signage Basket — Admin Core & SPA Engine
 */
import { renderDashboard, renderEnquiries } from './views-main.js';
import { renderSettings } from './views-settings.js';
import {
  renderDesigns,
  renderDesignForm,
  renderProjects,
  renderReviews,
  renderMedia
} from './views-content.js';

// Global shared state
export const state = {
  user: null,
  stats: null
};

// Navigation guard callback
let currentNavGuard = null;
export function navGuard(fn) {
  currentNavGuard = fn;
}

// Router navigation helper
export function go(hash) {
  if (currentNavGuard && typeof currentNavGuard === 'function') {
    const allowed = currentNavGuard();
    if (!allowed) return;
    currentNavGuard = null;
  }
  window.location.hash = hash.startsWith('#') ? hash : `#/${hash}`;
}

// HTML Escape helper
export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Slug generator
export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Relative time formatter
export function relTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Formatted full date string
export function fmtDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// DOM Creator Helper
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === 'class' || k === 'className') {
        el.className = v;
      } else if (k === 'text') {
        el.textContent = v;
      } else if (k === 'html') {
        el.innerHTML = v;
      } else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'dataset' && typeof v === 'object') {
        for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
      } else if (k.startsWith('data-')) {
        el.setAttribute(k, v);
      } else if (typeof v === 'boolean') {
        if (v) el.setAttribute(k, ''); else el.removeAttribute(k);
      } else {
        el.setAttribute(k, v);
      }
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

// API Fetch Helper
export async function api(path, { method = 'GET', body = null } = {}) {
  const headers = {
    'X-Requested-With': 'sb-admin'
  };

  const opts = {
    method,
    credentials: 'same-origin',
    headers
  };

  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(path, opts);

  if (res.status === 401) {
    state.user = null;
    showLoginScreen();
    throw new Error('Authentication required');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const msg = data.error || (res.status === 429 ? 'Too many attempts. Please try again later.' : `Request failed (${res.status})`);
    throw new Error(msg);
  }

  return data;
}

// Bottom Center Toast
export function toast(message, type = 'info') {
  let shelf = document.getElementById('toastShelf');
  if (!shelf) {
    shelf = h('div', { id: 'toastShelf', class: 'toast-shelf' });
    document.body.appendChild(shelf);
  }

  const toastEl = h('div', {
    class: `toast-msg ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`
  }, message);

  shelf.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toastEl.remove(), 250);
  }, 3500);
}

// Styled Confirmation Dialog
export function confirmDialog({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const backdrop = h('div', { class: 'modal-backdrop' });
    const card = h('div', { class: 'modal-card' });

    const head = h('div', { class: 'modal-head' },
      h('h3', { text: title, style: 'font-size:17px; font-weight:600;' }),
      h('button', {
        class: 'btn-outline',
        style: 'border:none; padding:4px; cursor:pointer;',
        onclick: () => cleanup(false)
      }, '✕')
    );

    const body = h('div', { class: 'modal-body' }, h('p', { text: message }));

    const cancelBtn = h('button', { class: 'btn btn-outline btn-sm', onclick: () => cleanup(false) }, 'Cancel');
    const okBtn = h('button', {
      class: `btn ${danger ? 'btn-danger' : 'btn-ink'} btn-sm`,
      onclick: () => cleanup(true)
    }, confirmText);

    const foot = h('div', { class: 'modal-actions' }, cancelBtn, okBtn);

    card.append(head, body, foot);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    function handleKey(e) {
      if (e.key === 'Escape') cleanup(false);
    }
    document.addEventListener('keydown', handleKey);

    function cleanup(val) {
      document.removeEventListener('keydown', handleKey);
      backdrop.remove();
      resolve(val);
    }
  });
}

// Modal Dialog
export function openModal({ title = '', content, actions = [] }) {
  const backdrop = h('div', { class: 'modal-backdrop' });
  const card = h('div', { class: 'modal-card' });

  function close() {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);

  const head = h('div', { class: 'modal-head' },
    h('h3', { text: title, style: 'font-size:17px; font-weight:600;' }),
    h('button', {
      class: 'btn-outline',
      style: 'border:none; padding:4px; cursor:pointer;',
      onclick: close
    }, '✕')
  );

  const bodyEl = h('div', { class: 'modal-body' });
  if (typeof content === 'string') {
    bodyEl.innerHTML = content;
  } else if (content instanceof Node) {
    bodyEl.appendChild(content);
  }

  const foot = h('div', { class: 'modal-actions' });
  for (const act of actions) {
    const btn = h('button', {
      class: `btn ${act.danger ? 'btn-danger' : act.primary ? 'btn-ink' : 'btn-outline'} btn-sm`,
      onclick: () => {
        if (typeof act.onClick === 'function') act.onClick({ close });
        else close();
      }
    }, act.label || 'Action');
    foot.appendChild(btn);
  }

  card.append(head, bodyEl, foot);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  return { close };
}

// Slide-in Drawer
export function openDrawer({ title = '', content }) {
  let overlay = document.getElementById('drawerOverlay');
  let drawer = document.getElementById('adminDrawer');

  if (!overlay || !drawer) {
    overlay = h('div', { id: 'drawerOverlay', class: 'drawer-overlay' });
    drawer = h('aside', { id: 'adminDrawer', class: 'admin-drawer' });
    document.body.append(overlay, drawer);
  }

  function close() {
    drawer.classList.remove('is-open');
    overlay.style.display = 'none';
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  overlay.onclick = close;

  function setContent(newContent) {
    drawer.innerHTML = '';
    const head = h('div', { class: 'drawer-head' },
      h('h3', { text: title, style: 'font-size:18px; font-weight:600;' }),
      h('button', { class: 'btn-outline', style: 'border:none; padding:6px; cursor:pointer;', onclick: close }, '✕')
    );
    const body = h('div', { class: 'drawer-content' });
    if (typeof newContent === 'string') {
      body.innerHTML = newContent;
    } else if (newContent instanceof Node) {
      body.appendChild(newContent);
    }
    drawer.append(head, body);
  }

  setContent(content);
  overlay.style.display = 'block';
  drawer.classList.add('is-open');

  return { close, setContent };
}

// Chip Input Component
export function chipInput({ values = [], suggestions = [], placeholder = 'Type & press Enter...', onChange }) {
  const current = [...values];
  const box = h('div', { class: 'chip-box' });
  const input = h('input', {
    type: 'text',
    class: 'chip-input-field',
    placeholder
  });

  function render() {
    box.innerHTML = '';
    current.forEach((val, idx) => {
      const chip = h('span', { class: 'chip-tag' },
        val,
        h('button', {
          type: 'button',
          class: 'chip-del',
          onclick: (e) => {
            e.stopPropagation();
            current.splice(idx, 1);
            render();
            if (onChange) onChange(current);
          }
        }, '×')
      );
      box.appendChild(chip);
    });
    box.appendChild(input);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value.trim();
      if (v && !current.includes(v)) {
        current.push(v);
        input.value = '';
        render();
        if (onChange) onChange(current);
      }
    } else if (e.key === 'Backspace' && !input.value && current.length > 0) {
      current.pop();
      render();
      if (onChange) onChange(current);
    }
  });

  box.onclick = () => input.focus();
  render();

  box.getValues = () => [...current];
  return box;
}

// Browser Canvas Image Compression (max 1600px long side, WebP .82 quality with JPEG fallback)
function compressFile(file) {
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
        resolve({
          filename: file.name,
          contentType,
          dataBase64: dataUrl.split(',')[1]
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Photo Uploader Component
export function photoUploader({ images = [], onChange, max = 20 }) {
  let photoList = images.map(img => (typeof img === 'string' ? { url: img, alt: '' } : { url: img.url, alt: img.alt || '' }));
  const wrap = h('div', { class: 'photo-uploader' });

  const fileInput = h('input', {
    type: 'file',
    multiple: true,
    accept: 'image/jpeg,image/png,image/webp',
    style: 'display:none;'
  });

  const progressWrap = h('div', {
    class: 'checklist-bar',
    style: 'display:none; margin:10px 0 0;'
  });
  const progressBar = h('div', { class: 'checklist-fill', style: 'width:0%;' });
  progressWrap.appendChild(progressBar);

  const errorEl = h('div', { class: 'form-error', style: 'display:none;' });

  const dropzone = h('div', { class: 'uploader-dropzone' },
    h('p', { html: 'Drag photos here or <strong style="color:var(--bronze); text-decoration:underline;">Choose photos</strong>' }),
    h('span', { class: 'form-hint', text: 'Max 1600px WebP compressed automatically' })
  );

  const thumbGrid = h('div', { class: 'thumb-grid' });

  function renderThumbs() {
    thumbGrid.innerHTML = '';
    photoList.forEach((photo, idx) => {
      const card = h('div', { class: 'thumb-card' });
      const imgEl = h('img', { src: photo.url, alt: photo.alt || '' });
      card.appendChild(imgEl);

      if (idx === 0) {
        card.appendChild(h('span', { class: 'thumb-cover-tag', text: 'Cover' }));
      }

      const altInput = h('input', {
        type: 'text',
        class: 'thumb-alt-input',
        value: photo.alt || '',
        placeholder: 'Alt text',
        title: 'Alt text for SEO',
        oninput: (e) => {
          photo.alt = e.target.value;
          if (onChange) onChange([...photoList]);
        }
      });
      card.appendChild(altInput);

      const controls = h('div', { class: 'thumb-controls' });
      if (idx > 0) {
        controls.appendChild(h('button', {
          type: 'button',
          class: 'thumb-btn',
          title: 'Move up',
          onclick: () => {
            const temp = photoList[idx];
            photoList[idx] = photoList[idx - 1];
            photoList[idx - 1] = temp;
            renderThumbs();
            if (onChange) onChange([...photoList]);
          }
        }, '◀'));
      }
      if (idx < photoList.length - 1) {
        controls.appendChild(h('button', {
          type: 'button',
          class: 'thumb-btn',
          title: 'Move down',
          onclick: () => {
            const temp = photoList[idx];
            photoList[idx] = photoList[idx + 1];
            photoList[idx + 1] = temp;
            renderThumbs();
            if (onChange) onChange([...photoList]);
          }
        }, '▶'));
      }
      controls.appendChild(h('button', {
        type: 'button',
        class: 'thumb-btn',
        style: 'color:#f87171;',
        title: 'Remove',
        onclick: () => {
          photoList.splice(idx, 1);
          renderThumbs();
          if (onChange) onChange([...photoList]);
        }
      }, '✕'));

      card.appendChild(controls);
      thumbGrid.appendChild(card);
    });
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    errorEl.style.display = 'none';
    progressWrap.style.display = 'block';
    progressBar.style.width = '10%';

    for (let i = 0; i < files.length; i++) {
      if (photoList.length >= max) {
        toast(`Max limit of ${max} photos reached`, 'error');
        break;
      }
      const file = files[i];
      try {
        const compressed = await compressFile(file);
        progressBar.style.width = `${Math.round(((i + 0.5) / files.length) * 100)}%`;
        const res = await api('/api/admin/media', {
          method: 'POST',
          body: compressed
        });
        photoList.push({ url: res.url, alt: '' });
        progressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
        renderThumbs();
        if (onChange) onChange([...photoList]);
      } catch (err) {
        errorEl.textContent = `Upload failed for ${file.name}: ${err.message}`;
        errorEl.style.display = 'block';
      }
    }

    setTimeout(() => {
      progressWrap.style.display = 'none';
      progressBar.style.width = '0%';
    }, 400);
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

  renderThumbs();
  wrap.append(dropzone, fileInput, progressWrap, errorEl, thumbGrid);
  return wrap;
}

// ------------------------------------------
// Login Screen
// ------------------------------------------
function showLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const wrap = h('div', { class: 'login-wrap' });
  const card = h('div', { class: 'login-card' });

  const head = h('div', { class: 'login-header' },
    h('img', { src: '/assets/logo/logo-wordmark.svg', alt: 'Signage Basket', class: 'login-logo' }),
    h('p', { class: 'form-hint', text: 'Admin Portal Sign In' })
  );

  const errorEl = h('div', { class: 'form-error', style: 'display:none; margin-bottom:14px;' });

  const userInp = h('input', {
    type: 'text',
    class: 'form-input',
    required: true,
    autocomplete: 'username'
  });

  const passInp = h('input', {
    type: 'password',
    class: 'form-input',
    required: true,
    autocomplete: 'current-password'
  });

  const toggleBtn = h('button', {
    type: 'button',
    class: 'pwd-toggle',
    title: 'Show/Hide password',
    onclick: () => {
      passInp.type = passInp.type === 'password' ? 'text' : 'password';
    }
  }, '👁');

  const submitBtn = h('button', {
    type: 'submit',
    class: 'btn btn-ink btn-lg',
    style: 'width:100%; margin-top:8px;'
  }, 'Sign in');

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await api('/api/auth/login', {
          method: 'POST',
          body: {
            username: userInp.value.trim(),
            password: passInp.value
          }
        });
        state.user = res.user;
        toast('Signed in successfully', 'success');
        mountAppShell();
        navigate();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
      }
    }
  },
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Username' }),
      userInp
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label', text: 'Password' }),
      h('div', { class: 'pwd-wrap' }, passInp, toggleBtn)
    ),
    errorEl,
    submitBtn
  );

  card.append(head, form);
  wrap.appendChild(card);
  app.appendChild(wrap);
}

// ------------------------------------------
// App Shell Layout
// ------------------------------------------
function mountAppShell() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const shell = h('div', { class: 'admin-shell' });
  const backdrop = h('div', { id: 'sidebarBackdrop', class: 'sidebar-backdrop' });

  // Sidebar
  const sidebar = h('aside', { id: 'sidebar', class: 'admin-sidebar' },
    h('div', { class: 'sidebar-brand' },
      h('a', { href: '#/dashboard' },
        h('img', { src: '/assets/logo/logo-wordmark-light.svg', alt: 'Signage Basket', class: 'sidebar-logo' })
      ),
      h('button', {
        class: 'btn-outline',
        style: 'color:#fff; border:none; display:none;',
        id: 'sidebarCloseBtn',
        onclick: () => {
          sidebar.classList.remove('open');
          backdrop.classList.remove('open');
        }
      }, '✕')
    ),
    h('nav', { class: 'sidebar-nav' },
      createNavLink('dashboard', 'Dashboard', 'home'),
      createNavLink('enquiries', 'Enquiries', 'mail', true),
      createNavLink('designs', 'Designs', 'plate'),
      createNavLink('projects', 'Projects', 'building'),
      createNavLink('reviews', 'Reviews', 'star'),
      createNavLink('media', 'Media', 'layers'),
      createNavLink('settings', 'Settings', null, false, 'gear')
    ),
    h('div', { class: 'sidebar-footer' },
      h('a', { href: '/', target: '_blank', rel: 'noopener', class: 'sidebar-btn' },
        h('svg', { class: 'svg-icon', viewBox: '0 0 24 24' },
          h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
          h('polyline', { points: '15 3 21 3 21 9' }),
          h('line', { x1: '10', y1: '14', x2: '21', y2: '3' })
        ),
        h('span', { text: 'View website' })
      ),
      h('button', {
        type: 'button',
        class: 'sidebar-btn',
        onclick: async () => {
          const ok = await confirmDialog({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            confirmText: 'Sign out'
          });
          if (ok) {
            try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
            state.user = null;
            showLoginScreen();
          }
        }
      },
        h('svg', { class: 'svg-icon', viewBox: '0 0 24 24' },
          h('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
          h('polyline', { points: '16 17 21 12 16 7' }),
          h('line', { x1: '21', y1: '12', x2: '9', y2: '12' })
        ),
        h('span', { text: 'Logout' })
      )
    )
  );

  backdrop.onclick = () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  };

  // Main stage
  const main = h('div', { class: 'admin-main' },
    h('header', { class: 'admin-topbar' },
      h('div', { class: 'topbar-left' },
        h('button', {
          id: 'hamburgerBtn',
          class: 'hamburger-btn',
          title: 'Toggle menu',
          onclick: () => {
            sidebar.classList.add('open');
            backdrop.classList.add('open');
          }
        },
          h('svg', { class: 'svg-icon', viewBox: '0 0 24 24' },
            h('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
            h('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
            h('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
          )
        ),
        h('h1', { id: 'pageTitle', class: 'topbar-title', text: 'Dashboard' })
      ),
      h('div', {},
        h('a', { href: '/', target: '_blank', rel: 'noopener', class: 'btn btn-outline btn-sm' }, 'View website')
      )
    ),
    h('main', { id: 'adminContent', class: 'admin-content' })
  );

  shell.append(backdrop, sidebar, main);
  app.appendChild(shell);
}

function createNavLink(route, label, iconName, withBadge = false, customSvg = null) {
  let iconEl;
  if (customSvg === 'gear') {
    iconEl = h('svg', { class: 'svg-icon', viewBox: '0 0 24 24' },
      h('circle', { cx: '12', cy: '12', r: '3' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' })
    );
  } else {
    iconEl = h('span', { class: `icon i-${iconName}` });
  }

  const link = h('a', {
    href: `#/${route}`,
    class: 'nav-link',
    dataset: { route }
  },
    iconEl,
    h('span', { class: 'nav-label', text: label })
  );

  if (withBadge) {
    const badge = h('span', { id: 'enquiriesNavBadge', class: 'nav-badge', style: 'display:none;' }, '0');
    link.appendChild(badge);
  }

  return link;
}

// ------------------------------------------
// SPA Router
// ------------------------------------------
async function navigate() {
  if (currentNavGuard && typeof currentNavGuard === 'function') {
    const allowed = currentNavGuard();
    if (!allowed) return;
    currentNavGuard = null;
  }

  const raw = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
  const parts = raw.split('/');
  const route = parts[0];
  const param = parts[1] || null;

  const content = document.getElementById('adminContent');
  const pageTitle = document.getElementById('pageTitle');
  if (!content) return;

  // Active state in sidebar
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === route);
  });

  const titles = {
    dashboard: 'Dashboard',
    enquiries: 'Customer Enquiries',
    designs: 'Design Catalog',
    projects: 'Projects Gallery',
    reviews: 'Customer Reviews',
    media: 'Media Storage',
    settings: 'Site Settings'
  };
  if (pageTitle) pageTitle.textContent = titles[route] || 'Admin';

  // Skeleton shimmer
  content.innerHTML = '';
  const skeletonEl = h('div', { class: 'skeleton', style: 'height:320px; width:100%;' });
  content.appendChild(skeletonEl);

  // Update badge in background
  try {
    const statsRes = await api('/api/admin/stats');
    state.stats = statsRes.stats;
    const badge = document.getElementById('enquiriesNavBadge');
    if (badge && statsRes.stats?.newEnquiries > 0) {
      badge.textContent = statsRes.stats.newEnquiries;
      badge.style.display = 'inline-block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  } catch (_) {}

  try {
    content.innerHTML = '';
    switch (route) {
      case 'dashboard':
        await renderDashboard(content);
        break;
      case 'enquiries':
        await renderEnquiries(content);
        break;
      case 'designs':
        if (param === 'new') {
          await renderDesignForm(content, null);
        } else if (param) {
          await renderDesignForm(content, param);
        } else {
          await renderDesigns(content);
        }
        break;
      case 'projects':
        await renderProjects(content);
        break;
      case 'reviews':
        await renderReviews(content);
        break;
      case 'media':
        await renderMedia(content);
        break;
      case 'settings':
        await renderSettings(content);
        break;
      default:
        go('dashboard');
        break;
    }
  } catch (err) {
    content.innerHTML = '';
    const errBox = h('div', { class: 'card', style: 'text-align:center; padding:40px 20px;' },
      h('h3', { text: 'Failed to load this section' }),
      h('p', { class: 'form-hint', text: err.message, style: 'margin:8px 0 16px;' }),
      h('button', {
        class: 'btn btn-ink btn-sm',
        onclick: () => navigate()
      }, 'Retry')
    );
    content.appendChild(errBox);
  }
}

// ------------------------------------------
// Initialization
// ------------------------------------------
async function init() {
  try {
    const res = await api('/api/auth/me');
    state.user = res.user;
    mountAppShell();
    window.addEventListener('hashchange', navigate);
    navigate();
  } catch (_) {
    showLoginScreen();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
