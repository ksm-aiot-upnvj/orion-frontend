import { initIcons } from './ui.js';
import { getAuthUser, logout, requireAuth } from './auth.js';

/**
 * Institutional ERP/CRM Layout Renderer with Flowbite-style Rounded Account Dropdown
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

  const topbarContainer = document.getElementById('crm-topbar');

  const navItems = [
    {
      id: 'selection',
      label: 'Seleksi Calon Anggota',
      shortLabel: 'Seleksi',
      href: '/pages/selection.html',
      icon: 'user-check',
      badge: 'Admin',
      badgeClass: 'badge-pending'
    },
    {
      id: 'members',
      label: 'Anggota & Alumni',
      shortLabel: 'Anggota',
      href: '/pages/members.html',
      icon: 'users',
      badge: '11',
      badgeClass: 'badge-neutral'
    },
    {
      id: 'inventory',
      label: 'Inventaris Hardware',
      shortLabel: 'Inventaris',
      href: '/pages/inventory.html',
      icon: 'cpu',
      badge: '62 Unit',
      badgeClass: 'badge-neutral'
    },
    {
      id: 'finance',
      label: 'Kas & Keuangan',
      shortLabel: 'Kas & Keuangan',
      href: '/pages/finance.html',
      icon: 'wallet',
      badge: 'Rp 12.4M',
      badgeClass: 'badge-approved'
    },
    {
      id: 'archive',
      label: 'Arsip & Surat Resmi',
      shortLabel: 'Arsip Surat',
      href: '/pages/archive.html',
      icon: 'file-text',
      badge: 'Baku',
      badgeClass: 'badge-neutral'
    }
  ];

  // Render Topbar - Clean Header with Direct Navigation and Rounded Account Dropdown
  if (topbarContainer) {
    topbarContainer.className = 'sticky top-0 z-40 w-full bg-[#0F051D] border-b border-[#561F99] shadow-md min-h-[64px]';

    const desktopNavLinksHtml = navItems.map(item => {
      const isActive = item.id === activePage;
      return `
        <a href="${item.href}" class="text-xs font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center space-x-1.5 ${isActive
          ? 'bg-[#9B5CE8] text-white font-bold border border-[#9B5CE8] shadow-xs'
          : 'text-purple-100 hover:text-white hover:bg-[#1E0A38]'
        }">
          <i data-lucide="${item.icon}" class="w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#C9A4F6]'}"></i>
          <span>${item.shortLabel}</span>
        </a>
      `;
    }).join('');

    const mobileNavLinksHtml = navItems.map(item => {
      const isActive = item.id === activePage;
      return `
        <a href="${item.href}" class="text-[11px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1.5 flex-shrink-0 ${isActive
          ? 'bg-[#9B5CE8] text-white font-bold border border-[#9B5CE8] shadow-xs'
          : 'text-[#D8B4FE] hover:text-white bg-[#1E0A38] border border-[#561F99]'
        }">
          <i data-lucide="${item.icon}" class="w-3 h-3 ${isActive ? 'text-white' : 'text-[#C9A4F6]'}"></i>
          <span>${item.shortLabel}</span>
        </a>
      `;
    }).join('');

    topbarContainer.innerHTML = `
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between relative gap-2">
        
        <!-- Left: Brand / Title context -->
        <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <a href="/index.html" class="flex items-center space-x-2 group min-w-0 flex-shrink">
            <div class="flex items-center space-x-1 flex-shrink-0">
              <img src="/Logo_UPNVJ.png" alt="Logo UPNVJ" class="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
              <img src="/ksm-aiot-logo.png" alt="KSM AIoT Logo" class="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-xs sm:text-sm text-white tracking-tight leading-tight flex items-center space-x-1">
                <span>KSM</span>
                <span class="text-[#C9A4F6]">AIoT</span>
              </span>
              <span class="text-[8px] sm:text-[9px] text-purple-200 font-mono uppercase font-semibold leading-tight truncate">ERP Management</span>
            </div>
          </a>
          <span class="hidden md:inline text-[#561F99]">/</span>
          <span class="hidden md:inline text-xs font-semibold text-purple-200 bg-[#090312] px-2 py-0.5 rounded border border-[#561F99]">${pageTitle}</span>
        </div>

        <!-- Center: Quick Nav Modules (Primary Navigation on Navbar - Desktop) -->
        <nav class="hidden md:flex items-center space-x-1.5 overflow-x-auto py-1">
          ${desktopNavLinksHtml}
        </nav>

        <!-- Right: Rounded Account Avatar with Flowbite-style Dropdown -->
        <div class="relative flex items-center flex-shrink-0">
          <button type="button" id="user-menu-btn" aria-expanded="false" title="Akun Pengurus"
            class="flex items-center text-sm rounded-full p-0.5 focus:ring-4 focus:ring-purple-900/50 focus:outline-none transition-all hover:ring-2 hover:ring-[#9B5CE8]">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#561F99] bg-[#1E0A38] flex items-center justify-center">
              ${currentUser.avatar
        ? `<img src="${currentUser.avatar}" alt="${currentUser.full_name}" class="w-full h-full object-cover" />`
        : `<span class="text-xs font-bold text-[#C9A4F6] font-mono">${initials}</span>`
      }
            </div>
          </button>

          <!-- Flowbite-style Rounded Dropdown Menu -->
          <div id="user-dropdown"
            class="hidden z-50 absolute right-0 top-12 my-2 text-base list-none bg-[#1E0A38] divide-y divide-[#561F99] rounded-xl shadow-2xl border border-[#561F99] w-56 sm:w-60 transform transition-all duration-150 text-white">
            
            <!-- User Info Header -->
            <div class="px-4 py-3 bg-[#0F051D] rounded-t-xl">
              <span class="block text-xs font-bold text-white truncate leading-tight">${currentUser.full_name}</span>
              <span class="block text-[10px] text-[#C9A4F6] font-mono font-semibold truncate mt-0.5">${roleLabel}</span>
              <span class="block text-[10px] text-purple-200 font-mono truncate mt-0.5">NIM: ${currentUser.student_id || '2310511001'}</span>
            </div>

            <!-- Navigation Links Inside Dropdown -->
            <ul class="py-1.5 text-xs text-purple-100">
              <li>
                <a href="/pages/profile.html" class="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#280E48] hover:text-white transition-colors">
                  <i data-lucide="user" class="w-3.5 h-3.5 text-[#C9A4F6]"></i>
                  <span>Profil & Pengaturan Akun</span>
                </a>
              </li>
              <li>
                <a href="/index.html" class="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#280E48] hover:text-white transition-colors">
                  <i data-lucide="home" class="w-3.5 h-3.5 text-[#C9A4F6]"></i>
                  <span>Laman Utama</span>
                </a>
              </li>
              <li>
                <a href="/pages/registration.html" target="_blank" class="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#301057] hover:text-white transition-colors">
                  <i data-lucide="external-link" class="w-3.5 h-3.5 text-[#C9A4F6]"></i>
                  <span>Portal Pendaftaran</span>
                </a>
              </li>
            </ul>

            <!-- Mobile Navigation Fallback list -->
            <div class="md:hidden py-1 border-t border-[#561F99]">
              <span class="block text-[9px] font-mono text-[#C9A4F6] uppercase tracking-wider px-4 py-1 font-semibold">Modul ERP</span>
              <ul class="text-xs text-purple-100">
                ${navItems.map(i => `
                  <li>
                    <a href="${i.href}" class="flex items-center justify-between px-4 py-1.5 hover:bg-[#301057] hover:text-white transition-colors ${i.id === activePage ? 'font-bold text-white bg-[#9B5CE8]' : ''}">
                      <span>${i.label}</span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Logout Action -->
            <div class="py-1 rounded-b-xl">
              <button type="button" id="dropdown-logout-btn"
                class="w-full flex items-center space-x-2.5 text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors font-medium rounded-b-xl">
                <i data-lucide="log-out" class="w-3.5 h-3.5 text-red-400"></i>
                <span>Keluar (Logout)</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      <!-- Mobile Sub-Navigation Bar (Touch-Scrollable Ribbon) -->
      <div class="md:hidden flex items-center space-x-1.5 overflow-x-auto px-3 py-1.5 border-t border-[#561F99] bg-[#0F051D] no-scrollbar shadow-inner touch-pan-x">
        ${mobileNavLinksHtml}
      </div>
    `;

    // Dropdown toggle logic
    const userBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

    const toggleDropdown = (e) => {
      e.stopPropagation();
      userDropdown?.classList.toggle('hidden');
    };

    const closeDropdown = () => {
      userDropdown?.classList.add('hidden');
    };

    userBtn?.addEventListener('click', toggleDropdown);

    // Close when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
      if (!userDropdown?.contains(e.target) && !userBtn?.contains(e.target)) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });

    // Logout Handler
    dropdownLogoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar dari Management System KSM AIoT?')) {
        logout();
        window.location.href = '/index.html';
      }
    });
  }

  // Reinitialize Lucide Icons
  initIcons();
}
