import { initIcons, initThemeEngine } from './ui.js';
import { getAuthUser, logout, requireAuth } from './auth.js';

/**
 * Unified CRM Layout Renderer (Sidebar + Burger Menu + Topbar)
 * Provides 100% visual consistency with index.html navbar, including h-20 height,
 * brand layout, navigation links, and theme toggle.
 * 
 * @param {string} activePage - 'selection' | 'members' | 'inventory' | 'finance' | 'archive'
 * @param {string} pageTitle - Title for the page
 */
export function initCRMLayout(activePage = 'selection', pageTitle = 'Dashboard') {
  // Enforce Route Protection for CRM
  if (!requireAuth()) {
    return;
  }

  const currentUser = getAuthUser() || {
    full_name: 'Dzulfikri Adjmal',
    role: 'SUPERADMIN',
    student_id: '2310511001',
    division: 'BPH',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
  };

  const initials = currentUser.full_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const roleLabel = currentUser.role === 'SUPERADMIN' 
    ? 'Super Admin (BPH)' 
    : currentUser.role === 'ADMIN_BPH' 
      ? 'Admin BPH' 
      : 'Pengurus KSM';

  const sidebarContainer = document.getElementById('crm-sidebar');
  const topbarContainer = document.getElementById('crm-topbar');

  const navItems = [
    {
      id: 'selection',
      label: 'Seleksi Calon Anggota',
      shortLabel: 'Seleksi',
      href: '/pages/selection.html',
      icon: 'shield-check',
      badge: 'Admin',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      id: 'members',
      label: 'Anggota & Alumni',
      shortLabel: 'Anggota',
      href: '/pages/members.html',
      icon: 'users',
      badge: '11',
      badgeColor: 'bg-cyan-950 text-aiot-cyan border-cyan-800'
    },
    {
      id: 'inventory',
      label: 'Inventaris Hardware',
      shortLabel: 'Inventaris',
      href: '/pages/inventory.html',
      icon: 'cpu',
      badge: '62 Unit',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
    },
    {
      id: 'finance',
      label: 'Kas & Keuangan',
      shortLabel: 'Kas Keuangan',
      href: '/pages/finance.html',
      icon: 'trending-up',
      badge: 'Rp 12.4M',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800'
    },
    {
      id: 'archive',
      label: 'Arsip & Surat Resmi',
      shortLabel: 'Arsip Surat',
      href: '/pages/archive.html',
      icon: 'file-text',
      badge: 'Baku',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  ];

  // Render Sidebar (Slide-Over Drawer)
  if (sidebarContainer) {
    const navLinksHtml = navItems.map(item => {
      const isActive = item.id === activePage;
      return `
        <a href="${item.href}" class="crm-nav-link flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-mono transition-all duration-200 group ${
          isActive
            ? 'bg-aiot-cyan/15 text-aiot-cyan border border-aiot-cyan/30 font-bold shadow-[0_0_20px_rgba(0,242,254,0.15)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent font-medium'
        }">
          <div class="flex items-center space-x-3 min-w-0">
            <i data-lucide="${item.icon}" class="w-4 h-4 flex-shrink-0 ${isActive ? 'text-aiot-cyan' : 'text-slate-400 group-hover:text-slate-200'}"></i>
            <span class="truncate">${item.label}</span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-md border flex-shrink-0 ml-2 ${item.badgeColor}">
            ${item.badge}
          </span>
        </a>
      `;
    }).join('');

    sidebarContainer.innerHTML = `
      <div class="h-full flex flex-col justify-between p-5">
        <!-- Top: Brand Header -->
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <a href="/index.html" class="flex items-center space-x-3 group">
              <img src="/ksm-aiot-logo.png" alt="Logo KSM AIoT" width="38" height="38" style="width:38px; height:38px; max-width:38px; max-height:38px;" class="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(0,242,254,0.4)] flex-shrink-0" />
              <div class="flex flex-col">
                <span class="font-extrabold text-base text-white tracking-wider font-mono flex items-center space-x-1">
                  <span>KSM</span>
                  <span class="text-aiot-cyan">AIoT</span>
                </span>
                <span class="text-[9px] text-slate-400 font-mono tracking-widest uppercase">CRM Management</span>
              </div>
            </a>
            
            <!-- Mobile Close Button -->
            <button id="close-sidebar-mobile-btn" class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Navigation Links -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-3 font-semibold">Modul Manajemen</span>
            ${navLinksHtml}
          </div>
        </div>

        <!-- Bottom: User Card & Logout -->
        <div class="pt-5 border-t border-slate-800/80 space-y-2.5">
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-aiot-cyan to-aiot-purple flex items-center justify-center text-slate-950 font-bold text-xs shadow-md flex-shrink-0">
                ${initials}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white truncate leading-tight">${currentUser.full_name}</p>
                <p class="text-[10px] text-aiot-cyan font-mono leading-tight mt-0.5">${roleLabel}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <a href="/index.html" class="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-medium flex items-center justify-center space-x-1.5 border border-slate-700 transition-all">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
              <span>Beranda</span>
            </a>
            <button type="button" id="sidebar-logout-btn" class="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-red-100 text-[11px] font-mono font-bold flex items-center justify-center space-x-1.5 border border-red-800/80 transition-all">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Render Topbar - Identical in height (h-20) and structure to index.html
  if (topbarContainer) {
    topbarContainer.className = 'sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80';

    const desktopNavLinksHtml = navItems.map(item => {
      const isActive = item.id === activePage;
      return `
        <a href="${item.href}" class="transition-colors ${
          isActive 
            ? 'text-aiot-cyan font-bold border-b-2 border-aiot-cyan pb-1' 
            : 'text-slate-300 hover:text-aiot-cyan'
        }">${item.shortLabel}</a>
      `;
    }).join('');

    topbarContainer.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Left: Brand Logo -->
        <div class="flex items-center space-x-4">
          <a href="/index.html" class="flex items-center space-x-3 group">
            <img src="/ksm-aiot-logo.png" alt="KSM AIoT Logo"
              class="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(0,242,254,0.4)]" />
            <div class="flex flex-col">
              <span class="font-extrabold text-lg text-white tracking-wider font-mono flex items-center space-x-1">
                <span>KSM</span>
                <span class="text-aiot-cyan">AIoT</span>
              </span>
              <span class="text-[10px] text-slate-400 font-mono tracking-widest uppercase">CRM Management</span>
            </div>
          </a>
        </div>

        <!-- Center: Desktop Navigation Links -->
        <nav class="hidden lg:flex items-center space-x-7 text-sm font-medium">
          ${desktopNavLinksHtml}
        </nav>

        <!-- Right: Actions (Theme Toggle, User Profile Pill, Logout, Mobile Burger) -->
        <div class="flex items-center space-x-3">
          
          <!-- Theme Toggle (Dark / Light / System) -->
          <div class="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-x-1" id="theme-switcher">
            <button data-theme="dark" title="Dark Mode" class="theme-btn p-1.5 rounded-lg transition-all hover:text-white" id="theme-btn-dark">
              <i data-lucide="moon" class="w-3.5 h-3.5"></i>
            </button>
            <button data-theme="light" title="Light Mode" class="theme-btn p-1.5 rounded-lg transition-all hover:text-white" id="theme-btn-light">
              <i data-lucide="sun" class="w-3.5 h-3.5"></i>
            </button>
            <button data-theme="system" title="System Default" class="theme-btn p-1.5 rounded-lg transition-all hover:text-white" id="theme-btn-system">
              <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Super Admin Badge Pill -->
          <div class="hidden sm:flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-aiot-cyan to-aiot-purple flex items-center justify-center text-slate-950 font-bold text-[10px]">
              ${initials}
            </div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white leading-tight">${currentUser.full_name}</span>
              <span class="text-[9px] text-aiot-cyan font-mono leading-tight">${roleLabel}</span>
            </div>
          </div>

          <!-- Topbar Logout Button -->
          <button type="button" id="topbar-logout-btn" title="Keluar / Logout" class="hidden sm:flex p-2 rounded-xl bg-red-950/40 hover:bg-red-900/80 text-red-400 hover:text-red-200 border border-red-800/60 transition-all items-center space-x-1.5 text-xs font-mono">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span class="hidden md:inline font-bold">Logout</span>
          </button>

          <!-- Burger Menu Button (For Mobile & Quick Drawer) -->
          <button id="toggle-sidebar-btn" class="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-all flex items-center space-x-1">
            <i data-lucide="menu" class="w-6 h-6"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Bind Sidebar Drawer Toggle Events
  const sidebar = document.getElementById('crm-sidebar');
  const backdrop = document.getElementById('crm-sidebar-backdrop');
  const toggleBtn = document.getElementById('toggle-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-mobile-btn');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
  const topbarLogoutBtn = document.getElementById('topbar-logout-btn');

  function openSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  toggleBtn?.addEventListener('click', () => {
    if (sidebar?.classList.contains('-translate-x-full')) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  // Logout Listeners
  sidebarLogoutBtn?.addEventListener('click', logout);
  topbarLogoutBtn?.addEventListener('click', logout);

  // Initialize Icons and Theme Engine
  initIcons();
  initThemeEngine();
}
