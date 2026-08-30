import { animateCounters, initIcons, initThemeEngine, showToast } from '../modules/ui.js';
import { getAuthUser, login, logout } from '../modules/auth.js';
import { initialProjectsData } from '../modules/data.js';

// Organizational Structure Tab Switcher
function initStructureTabs() {
  const tabs = document.querySelectorAll('.struct-tab-btn');
  const panels = document.querySelectorAll('.struct-panel');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      // Update active tab button style
      tabs.forEach(t => {
        t.className = 'struct-tab-btn px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#1E0A38] text-[#C9A4F6] hover:bg-[#0F051D] border border-[#561F99] transition-all';
      });

      tab.className = 'struct-tab-btn px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#9B5CE8] text-white font-bold border border-[#9B5CE8] transition-all shadow-sm';

      // Show/Hide Panels
      panels.forEach(panel => {
        if (target === 'all') {
          panel.classList.remove('hidden');
        } else if (panel.id === `panel-${target}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      initIcons();
    });
  });
}

// Live Statistics Fetcher & Counter Animator
async function initLiveStats() {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
    const res = await fetch(`${API_BASE}/members/`);
    if (res.ok) {
      const members = await res.json();
      if (Array.isArray(members) && members.length > 0) {
        const memberCountEl = document.getElementById('stat-member-counter');
        if (memberCountEl) {
          memberCountEl.setAttribute('data-target', String(members.length));
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch live member count, using default target:', err);
  }

  animateCounters();
}

// Project Showcase Renderer & Filter Engine
function initProjectShowcase() {
  const grid = document.getElementById('projects-grid');
  const searchInput = document.getElementById('project-search');
  const filterBtns = document.querySelectorAll('.project-filter-btn');

  if (!grid) return;

  let currentFilter = 'all';
  let searchQuery = '';

  function renderProjects() {
    const filtered = initialProjectsData.filter(item => {
      const matchFilter = currentFilter === 'all' || item.category === currentFilter;
      const query = searchQuery.toLowerCase();
      const matchSearch = item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.techStack.some(t => t.toLowerCase().includes(query));
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-[#D8B4FE] font-mono">
          <i data-lucide="folder-kanban" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
          <p class="text-xs">Tidak ada proyek yang sesuai dengan filter.</p>
        </div>
      `;
      initIcons();
      return;
    }

    grid.innerHTML = filtered.map(proj => `
      <div class="card-glowing flex flex-col justify-between group h-full">
        <!-- Project Asset Image Preview -->
        <div class="w-full h-48 bg-[#090312] overflow-hidden relative border-b border-[#561F99]">
          <img src="${proj.image}" alt="${proj.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
          <div class="absolute top-3 right-3">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#0F051D]/90 backdrop-blur-sm text-[#C9A4F6] border border-[#561F99] shadow-sm">
              ${proj.categoryLabel}
            </span>
          </div>
        </div>

        <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 class="text-base font-bold text-white group-hover:text-[#C9A4F6] transition-colors">${proj.title}</h3>
            <p class="text-xs text-gray-400 mt-2 leading-relaxed">${proj.description}</p>
          </div>

          <div class="pt-4 border-t border-[#561F99] space-y-3">
            <div class="flex flex-wrap gap-1.5">
              ${proj.techStack.map(tech => `
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#090312] text-[#E9D8FD] border border-[#561F99]">${tech}</span>
              `).join('')}
            </div>

            <a href="${proj.repoUrl}" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#C9A4F6] hover:text-white transition-colors">
              <i data-lucide="github" class="w-3.5 h-3.5"></i>
              <span>Lihat Repositori GitHub</span>
              <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
            </a>
          </div>
        </div>
      </div>
    `).join('');

    initIcons();
  }

  // Filter Buttons Click
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => {
        b.className = 'project-filter-btn px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#1E0A38] text-[#C9A4F6] hover:bg-[#0F051D] border border-[#561F99] transition-all';
      });
      btn.className = 'project-filter-btn px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#9B5CE8] text-white font-bold border border-[#9B5CE8] transition-all shadow-sm';
      renderProjects();
    });
  });

  // Search Input Listener
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderProjects();
  });

  // Initial Project Rendering
  renderProjects();
}

// Main DOM Content Loaded Initializer
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initThemeEngine();
  initStructureTabs();
  initLiveStats();
  initProjectShowcase();

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login_required') === '1') {
    showToast('Akses Dibatasi: Silakan login sebagai Pengurus KSM untuk masuk CRM.', 'error');
  }

  // Update Navbar UI based on active login session
  const currentUser = getAuthUser();
  const desktopLoginArea = document.getElementById('desktop-login-area');
  const mobileLoginArea = document.getElementById('mobile-login-area');

  if (currentUser) {
    if (desktopLoginArea) {
      desktopLoginArea.innerHTML = `
        <div class="flex items-center space-x-2">
          <a href="/pages/selection.html"
            class="text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-[#301057] hover:bg-purple-50 transition-colors flex items-center space-x-1.5 shadow-sm">
            <i data-lucide="layout-dashboard" class="w-3.5 h-3.5 text-[#301057]"></i>
            <span>Dashboard </span>
          </a>
          <button type="button" id="btn-quick-logout" title="Logout"
            class="p-1.5 rounded-lg bg-white/10 text-purple-100 hover:text-white hover:bg-red-900/60 border border-white/20 transition-colors">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
    }
    if (mobileLoginArea) {
      mobileLoginArea.innerHTML = `
        <a href="/pages/selection.html"
          class="w-full text-center py-2 rounded-lg bg-white text-[#301057] font-bold text-xs block">
          Masuk Dashboard
        </a>
      `;
    }
    document.getElementById('btn-quick-logout')?.addEventListener('click', logout);
    initIcons();
  }

  // Login Modal Handlers
  const loginModal = document.getElementById('login-modal');
  const openLoginBtns = document.querySelectorAll('.open-login-modal');
  const closeLoginBtn = document.getElementById('close-login-modal');
  const loginForm = document.getElementById('login-form');

  if (urlParams.get('open_login') === '1') {
    loginModal?.classList.remove('hidden');
    loginModal?.classList.add('flex');
  }

  openLoginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!loginModal) return;
      loginModal.classList.remove('hidden');
      loginModal.classList.add('flex');
      // reflow
      void loginModal.offsetWidth;
      loginModal.classList.remove('opacity-0');
      loginModal.classList.add('opacity-100');
      const inner = loginModal.querySelector('div');
      if (inner) {
        inner.classList.remove('scale-95', 'opacity-0');
        inner.classList.add('scale-100', 'opacity-100');
      }
    });
  });

  closeLoginBtn?.addEventListener('click', () => {
    if (!loginModal) return;
    loginModal.classList.remove('opacity-100');
    loginModal.classList.add('opacity-0');
    const inner = loginModal.querySelector('div');
    if (inner) {
      inner.classList.remove('scale-100', 'opacity-100');
      inner.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
      loginModal.classList.add('hidden');
      loginModal.classList.remove('flex');
    }, 300);
  });

  // Manual Form Login Handler
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nimInput = document.getElementById('login-nim');
    const passwordInput = document.getElementById('login-password');
    const nim = nimInput?.value.trim();
    const password = passwordInput?.value;

    if (!nim || !password) return;
    const result = await login(nim, password);

    if (result.success) {
      showToast(`Login Berhasil! Selamat datang, ${result.user.full_name}.`, 'success');
      setTimeout(() => {
        loginModal?.classList.add('hidden');
        loginModal?.classList.remove('flex');
        window.location.href = '/pages/selection.html';
      }, 500);
    } else {
      showToast(result.message || 'NIM atau Password salah.', 'error');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  // Create a slide-down animation for the mobile menu
  if (mobileMenu) {
    mobileMenu.classList.add('transition-all', 'duration-300', 'origin-top', 'transform', 'scale-y-0', 'opacity-0', 'absolute', 'left-0', 'right-0', 'z-40');
    mobileMenu.classList.remove('hidden', 'md:hidden'); // We will use opacity and scale instead of display:none for smooth animation
  }
  
  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('open');
    if (mobileMenuBtn.classList.contains('open')) {
      mobileMenu.classList.remove('scale-y-0', 'opacity-0');
      mobileMenu.classList.add('scale-y-100', 'opacity-100');
    } else {
      mobileMenu.classList.remove('scale-y-100', 'opacity-100');
      mobileMenu.classList.add('scale-y-0', 'opacity-0');
    }
  });

  // Hide Header on Scroll Down
  const mainHeader = document.getElementById('main-header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (!mainHeader) return;
    const currentScrollY = window.scrollY;
    
    // Hide when scrolling down and past 100px
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      mainHeader.classList.add('-translate-y-full');
    } else {
      mainHeader.classList.remove('-translate-y-full');
    }
    lastScrollY = currentScrollY;
  });

  initIcons();
});
