/**
 * Signage Basket — Admin Core & SPA Router
 */
import { renderLogin, renderDashboard, renderEnquiries } from './views-main.js';
import { renderDesigns, renderProjects, renderReviews, renderMedia } from './views-content.js';
import { renderSettings } from './views-settings.js';

// Global state
let currentUser = null;
let currentRoute = '';
let unsavedChangesWarning = false;

// Escape HTML helper
export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Relative date helper
export function formatRelative(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Global API Helper
export async function api(path, options = {}) {
  const headers = {
    'X-Requested-With': 'sb-admin',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(path, config);

    if (res.status === 401) {
      currentUser = null;
      if (location.hash !== '#/login') {
        location.hash = '#/login';
      }
      throw new Error('Session expired. Please sign in again.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const errMsg = data.error || `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Toast notification
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${esc(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// Styled Confirmation Dialog (Promise-based)
export function confirmDialog({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${esc(message)}</p>`;
    modalFooter.innerHTML = `
      <button id="modalCancelBtn" class="btn btn-outline btn-sm">Cancel</button>
      <button id="modalConfirmBtn" class="btn ${danger ? 'btn-danger' : 'btn-ink'} btn-sm">${esc(confirmText)}</button>
    `;

    overlay.style.display = 'flex';

    function cleanup() {
      overlay.style.display = 'none';
      document.removeEventListener('keydown', handleKey);
    }

    function handleKey(e) {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    }

    document.getElementById('modalCancelBtn').onclick = () => { cleanup(); resolve(false); };
    modalCloseBtn.onclick = () => { cleanup(); resolve(false); };
    document.getElementById('modalConfirmBtn').onclick = () => { cleanup(); resolve(true); };
    document.addEventListener('keydown', handleKey);
  });
}

// Slide-in Drawer Controls
export function openDrawer(title, htmlContent, onMounted) {
  const drawer = document.getElementById('adminDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const titleEl = document.getElementById('drawerTitle');
  const bodyEl = document.getElementById('drawerBody');

  titleEl.textContent = title;
  bodyEl.innerHTML = htmlContent;

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.style.display = 'block';

  if (typeof onMounted === 'function') {
    onMounted(bodyEl);
  }
}

export function closeDrawer() {
  const drawer = document.getElementById('adminDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (backdrop) backdrop.style.display = 'none';
}

// Unsaved changes state setter
export function setUnsavedChanges(val) {
  unsavedChangesWarning = Boolean(val);
}

// Badge Update Helper
export function updateBadge(count) {
  const badge = document.getElementById('navEnquiriesBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// Fetch Unread Enquiries Count
async function refreshNavBadge() {
  try {
    const data = await api('/api/admin/stats');
    if (data.ok && data.stats) {
      updateBadge(data.stats.newEnquiries || 0);
    }
  } catch (_) {}
}

// Router
async function handleRouting() {
  if (unsavedChangesWarning) {
    if (!confirm('You have unsaved changes. Discard them?')) {
      location.hash = currentRoute;
      return;
    }
    unsavedChangesWarning = false;
  }

  closeDrawer();
  const rawHash = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [route, param] = rawHash.split('/');
  currentRoute = `#/${route}${param ? '/' + param : ''}`;

  const adminLayout = document.getElementById('adminLayout');
  const loginLayout = document.getElementById('loginLayout');
  const mainContainer = document.getElementById('mainContainer');
  const pageTitle = document.getElementById('pageTitle');

  // Check auth
  if (!currentUser && route !== 'login') {
    try {
      const meData = await api('/api/auth/me');
      currentUser = meData.user;
    } catch (_) {
      location.hash = '#/login';
      return;
    }
  }

  // Handle Login Screen
  if (route === 'login') {
    adminLayout.style.display = 'none';
    loginLayout.style.display = 'flex';
    renderLogin(loginLayout, () => {
      loginLayout.style.display = 'none';
      adminLayout.style.display = 'flex';
      location.hash = '#/dashboard';
    });
    return;
  }

  // Show Admin Shell
  loginLayout.style.display = 'none';
  adminLayout.style.display = 'flex';

  // Highlight Nav Item
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    const elRoute = el.getAttribute('data-route');
    if (elRoute === route) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Set Topbar Title
  const titles = {
    dashboard: 'Dashboard',
    enquiries: 'Customer Enquiries',
    designs: 'Design Catalog',
    projects: 'Projects Gallery',
    reviews: 'Customer Reviews',
    media: 'Media Storage',
    settings: 'Site Settings'
  };
  pageTitle.textContent = titles[route] || 'Admin';

  // Dispatch route view
  mainContainer.innerHTML = '<div class="skeleton" style="height: 200px; width: 100%;"></div>';

  refreshNavBadge();

  switch (route) {
    case 'dashboard':
      await renderDashboard(mainContainer);
      break;
    case 'enquiries':
      await renderEnquiries(mainContainer);
      break;
    case 'designs':
      await renderDesigns(mainContainer, param);
      break;
    case 'projects':
      await renderProjects(mainContainer);
      break;
    case 'reviews':
      await renderReviews(mainContainer);
      break;
    case 'media':
      await renderMedia(mainContainer);
      break;
    case 'settings':
      await renderSettings(mainContainer);
      break;
    default:
      location.hash = '#/dashboard';
      break;
  }
}

// Initialise App Event Listeners
function initApp() {
  // Mobile Hamburger Toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarBackdrop.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('open');
  }

  if (hamburgerBtn) hamburgerBtn.onclick = openSidebar;
  if (sidebarCloseBtn) sidebarCloseBtn.onclick = closeSidebar;
  if (sidebarBackdrop) sidebarBackdrop.onclick = closeSidebar;

  // Drawer Close Button & Backdrop
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (drawerCloseBtn) drawerCloseBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

  // Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeSidebar();
      const modal = document.getElementById('modalOverlay');
      if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    }
  });

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      const ok = await confirmDialog({
        title: 'Sign Out',
        message: 'Are you sure you want to log out of the admin panel?',
        confirmText: 'Sign out'
      });
      if (ok) {
        try {
          await api('/api/auth/logout', { method: 'POST' });
        } catch (_) {}
        currentUser = null;
        location.hash = '#/login';
      }
    };
  }

  // Window beforeunload warning
  window.addEventListener('beforeunload', (e) => {
    if (unsavedChangesWarning) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Hash Navigation
  window.addEventListener('hashchange', handleRouting);
  handleRouting();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
