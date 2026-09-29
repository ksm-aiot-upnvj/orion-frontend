import { animateCounters, initIcons, initThemeEngine, resolveAvatarUrl, showToast } from '../modules/ui.js';
import { getAuthUser, login, logout } from '../modules/auth.js';
import { initialProjectsData } from '../modules/data.js';

function getAvatar(name, avatar) {
  return resolveAvatarUrl(avatar, name.trim() || 'orion');
}

// Render Tree Hierarchy dari Backend API
async function fetchAndRenderTree() {
  const treeCanvas = document.getElementById('tree-canvas');
  if (!treeCanvas) return;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

  try {
    const res = await fetch(`${API_BASE}/members/public/organization`);
    if (!res.ok) throw new Error('Gagal mengambil data pengurus');
    const members = await res.json();

    // 1. Filter Presidium & BPH Inti
    const ketua = members.find(m => m.division === 'BPH' && m.role.toLowerCase() === 'ketua') || { full_name: 'Ketua', program_of_study: 'Informatika UPNVJ' };
    const wakil = members.find(m => m.division === 'BPH' && m.role.toLowerCase().includes('wakil')) || { full_name: 'Wakil Ketua', program_of_study: 'Informatika UPNVJ' };
    const sekretaris = members.find(m => m.division === 'BPH' && m.role.toLowerCase() === 'sekretaris') || { full_name: 'Sekretaris', program_of_study: 'Informatika UPNVJ' };
    const bendahara = members.find(m => m.division === 'BPH' && m.role.toLowerCase() === 'bendahara') || { full_name: 'Bendahara', program_of_study: 'Informatika UPNVJ' };

    // 2. Mapping Konfigurasi Divisi
    const divConfigs = [
      {
        branchKey: 'riset',
        backendDivName: 'Akademik Riset',
        badgeTitle: 'Divisi Akademik & Riset',
        badgeClass: 'bg-[#0284C7]/20 border-[#38BDF8]/50 text-[#38BDF8]',
        borderAccentClass: 'border-accent-riset',
        kadivBorderColor: 'border-[#38BDF8]',
        kadivBadgeBg: 'bg-[#0c243c]',
        kadivBadgeText: 'text-[#38BDF8]',
        kadivBadgeBorder: 'border-[#38BDF8]/40',
        kadivHoverText: 'group-hover:text-[#38BDF8]',
        kadivRoleTitle: 'Kepala Divisi Riset',
        staffHoverBorder: 'hover:border-[#38BDF8]/70',
        staffNumBorder: 'border-[#38BDF8]/50 text-[#38BDF8]',
        staffHoverText: 'group-hover:text-[#38BDF8]',
      },
      {
        branchKey: 'psdm',
        backendDivName: 'PSDM',
        badgeTitle: 'Divisi PSDM',
        badgeClass: 'bg-[#166534]/20 border-[#4ADE80]/50 text-[#4ADE80]',
        borderAccentClass: 'border-accent-psdm',
        kadivBorderColor: 'border-[#4ADE80]',
        kadivBadgeBg: 'bg-[#0e301d]',
        kadivBadgeText: 'text-[#4ADE80]',
        kadivBadgeBorder: 'border-[#4ADE80]/40',
        kadivHoverText: 'group-hover:text-[#4ADE80]',
        kadivRoleTitle: 'Kepala Divisi PSDM',
        staffHoverBorder: 'hover:border-[#4ADE80]/70',
        staffNumBorder: 'border-[#4ADE80]/50 text-[#4ADE80]',
        staffHoverText: 'group-hover:text-[#4ADE80]',
      },
      {
        branchKey: 'humas',
        backendDivName: 'Humas Multimedia',
        badgeTitle: 'Divisi Humas & Multimedia',
        badgeClass: 'bg-[#9A3412]/20 border-[#FB923C]/50 text-[#FB923C]',
        borderAccentClass: 'border-accent-humas',
        kadivBorderColor: 'border-[#FB923C]',
        kadivBadgeBg: 'bg-[#3a1d0d]',
        kadivBadgeText: 'text-[#FB923C]',
        kadivBadgeBorder: 'border-[#FB923C]/40',
        kadivHoverText: 'group-hover:text-[#FB923C]',
        kadivRoleTitle: 'Kepala Divisi Humas',
        staffHoverBorder: 'hover:border-[#FB923C]/70',
        staffNumBorder: 'border-[#FB923C]/50 text-[#FB923C]',
        staffHoverText: 'group-hover:text-[#FB923C]',
      }
    ];

    // Render HTML Divisi Columns
    const divisionsHTML = divConfigs.map(conf => {
      const divMembers = members.filter(m => m.division === conf.backendDivName);
      const kadiv = divMembers.find(m => m.role.toLowerCase().includes('kepala')) || { full_name: 'Kadiv', program_of_study: 'Informatika UPNVJ' };
      const staffs = divMembers.filter(m => !m.role.toLowerCase().includes('kepala'));

      const staffStackHTML = staffs.map((staff, idx) => {
        const photoUrl = getAvatar(staff.full_name, staff.avatar);

        const avatarHTML = photoUrl ? `<img src="${photoUrl}" alt="${staff.full_name}" class="w-full h-full object-cover rounded-full" onerror="this.parentElement.innerText='${idx + 1}'" />`
          : `${idx + 1}`;
        
        return `
        <div class="tree-node-card border border-[#561F99]/60 ${conf.staffHoverBorder} py-3.5 px-3.5 flex items-center justify-between group">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-full bg-[#1E0A38] border ${conf.staffNumBorder} flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
              ${avatarHTML}
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-white ${conf.staffHoverText} transition-colors">${staff.full_name}</p>
              <p class="text-[10px] text-purple-200/70 font-mono">Staff ${conf.branchKey.toUpperCase()}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

      return `
        <div class="tree-branch-group flex flex-col items-center" data-branch="${conf.branchKey}">
          <div class="w-0.5 h-6 bg-[#561F99]"></div>

          <!-- Division Pill Badge -->
          <div class="px-3.5 py-1 rounded-full border text-[11px] font-mono font-bold mb-5 shadow-sm ${conf.badgeClass}">
            ${conf.badgeTitle}
          </div>

          <!-- Kadiv Card -->
          <div class="tree-node-card ${conf.borderAccentClass} w-full pt-6 pb-3.5 px-4 text-center relative group mb-4">
            <div class="tree-avatar-bubble mx-auto -mt-9 mb-1.5 border-2 ${conf.kadivBorderColor} ring-4 ring-[#090312] bg-[#1E0A38] shadow-md">
              <img src="${getAvatar(kadiv.full_name, kadiv.avatar)}" alt="${kadiv.full_name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${getAvatar(kadiv.full_name)}';" />
            </div>
            <div class="absolute top-2 left-2 text-[9px] font-mono ${conf.kadivBadgeText} ${conf.kadivBadgeBg} px-1.5 py-0.5 rounded border ${conf.kadivBadgeBorder} font-bold">
              Kadiv
            </div>
            <h5 class="text-xs font-bold text-white ${conf.kadivHoverText} transition-colors">${kadiv.full_name}</h5>
            <p class="text-[11px] font-semibold text-[#D8B4FE] mt-0.5">${conf.kadivRoleTitle}</p>
            <p class="text-[9px] font-mono text-purple-300/70 mt-0.5">${kadiv.program_of_study || 'UPNVJ'}</p>
          </div>

          <!-- Connector Line to Staff -->
          <div class="w-0.5 h-4 bg-[#561F99] mb-3"></div>

          <!-- Staff Stack -->
          <div class="w-full space-y-2">
            ${staffStackHTML}
          </div>
        </div>
      `;
    }).join('');

    // Construct full Tree Structure HTML
    treeCanvas.innerHTML = `
      <!-- 1. KETUA & WAKIL KETUA (PRESIDIUM STACK) -->
      <div class="tree-branch-group relative flex flex-col items-center z-20" data-branch="root">
        <!-- Ketua Card -->
        <div class="tree-node-card border-accent-presidium w-64 pt-6 pb-4 px-5 text-center relative group">
          <div class="tree-avatar-bubble mx-auto -mt-10 mb-2 border-2 border-[#9B5CE8] ring-4 ring-[#090312] bg-[#1E0A38] shadow-md">
            <img src="${getAvatar(ketua.full_name, ketua.avatar)}" alt="Ketua" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${getAvatar(ketua.full_name)}';" />
          </div>
          <div class="absolute top-2.5 left-3 text-[10px] font-mono text-purple-300 bg-[#301057] px-2 py-0.5 rounded border border-[#561F99] font-bold">01</div>
          <h4 class="text-sm font-bold text-white tracking-tight group-hover:text-[#C9A4F6] transition-colors">${ketua.full_name}</h4>
          <p class="text-xs font-semibold text-[#E9D8FD] mt-0.5">Ketua KSM AIoT</p>
        </div>

        <!-- Vertical Connector to Wakil Ketua -->
        <div class="w-0.5 h-6 bg-[#561F99] my-0.5"></div>

        <!-- Wakil Ketua Card -->
        <div class="tree-node-card border-accent-presidium w-64 pt-6 pb-4 px-5 text-center relative group">
          <div class="tree-avatar-bubble mx-auto -mt-10 mb-2 border-2 border-[#9B5CE8] ring-4 ring-[#090312] bg-[#1E0A38] shadow-md">
            <img src="${getAvatar(wakil.full_name, wakil.avatar)}" alt="Wakil Ketua" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${getAvatar(wakil.full_name)}';" />
          </div>
          <div class="absolute top-2.5 left-3 text-[10px] font-mono text-purple-300 bg-[#301057] px-2 py-0.5 rounded border border-[#561F99] font-bold">02</div>
          <h4 class="text-sm font-bold text-white tracking-tight group-hover:text-[#C9A4F6] transition-colors">${wakil.full_name}</h4>
          <p class="text-xs font-semibold text-[#E9D8FD] mt-0.5">Wakil Ketua KSM AIoT</p>
        </div>

        <div class="w-0.5 h-8 bg-[#561F99] mt-0.5"></div>
      </div>

      <!-- 2. BPH INTI FORK (SEKRETARIS & BENDAHARA WINGS) -->
      <div class="w-full max-w-4xl relative z-10 my-0">
        <div class="relative flex items-center justify-between px-16">
          <div class="absolute left-28 right-28 top-0 h-0.5 bg-[#561F99] z-0"></div>

          <!-- Sekretaris -->
          <div class="tree-branch-group flex flex-col items-center relative z-10" data-branch="bph">
            <div class="w-0.5 h-5 bg-[#561F99]"></div>
            <div class="tree-node-card border-accent-bph w-60 pt-6 pb-3.5 px-4 text-center relative group">
              <div class="tree-avatar-bubble mx-auto -mt-9 mb-1.5 border-2 border-[#C084FC] ring-4 ring-[#090312] bg-[#1E0A38] shadow-md">
                <img src="${getAvatar(sekretaris.full_name, sekretaris.avatar)}" alt="Sekretaris" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${getAvatar(sekretaris.full_name)}';" />
              </div>
              <div class="absolute top-2 left-2 text-[9px] font-mono text-purple-300 bg-[#301057] px-1.5 py-0.5 rounded border border-[#561F99] font-bold">BPH</div>
              <h5 class="text-xs font-bold text-white group-hover:text-[#C084FC] transition-colors">${sekretaris.full_name}</h5>
              <p class="text-[11px] font-semibold text-[#D8B4FE] mt-0.5">Sekretaris</p>
            </div>
          </div>

          <!-- Central Trunk -->
          <div class="w-0.5 h-28 bg-[#561F99] self-stretch mx-auto absolute left-1/2 -translate-x-1/2 top-0 z-0"></div>

          <!-- Bendahara -->
          <div class="tree-branch-group flex flex-col items-center relative z-10" data-branch="bph">
            <div class="w-0.5 h-5 bg-[#561F99]"></div>
            <div class="tree-node-card border-accent-bph w-60 pt-6 pb-3.5 px-4 text-center relative group">
              <div class="tree-avatar-bubble mx-auto -mt-9 mb-1.5 border-2 border-[#C084FC] ring-4 ring-[#090312] bg-[#1E0A38] shadow-md">
                <img src="${getAvatar(bendahara.full_name, bendahara.avatar)}" alt="Bendahara" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${getAvatar(bendahara.full_name)}';" />
              </div>
              <div class="absolute top-2 left-2 text-[9px] font-mono text-purple-300 bg-[#301057] px-1.5 py-0.5 rounded border border-[#561F99] font-bold">BPH</div>
              <h5 class="text-xs font-bold text-white group-hover:text-[#C084FC] transition-colors">${bendahara.full_name}</h5>
              <p class="text-[11px] font-semibold text-[#D8B4FE] mt-0.5">Bendahara</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. MAIN HORIZONTAL RAIL -->
      <div class="w-full max-w-5xl relative px-16 z-10 mt-6">
        <div class="w-full h-0.5 bg-[#561F99] relative">
          <div id="tree-bus-highlight" class="w-full h-full bg-[#9B5CE8] transition-all duration-300"></div>
        </div>
      </div>

      <!-- 4. 3 MAIN DIVISION COLUMNS -->
      <div class="grid grid-cols-3 gap-8 w-full max-w-5xl pt-0 relative z-20">
        ${divisionsHTML}
      </div>
    `;

    // Re-initialize tab interaktivitas dan icon lucide setelah DOM berhasil dirender
    initStructureTabs();
    initIcons();

  } catch (err) {
    console.error('Tree render error:', err);
    treeCanvas.innerHTML = `
      <div class="py-8 text-center text-red-400 font-mono text-xs">
        Gagal memuat struktur organisasi dari server.
      </div>
    `;
  }
}

// Organizational Structure Interactive Hierarchy Tree & Branch Highlighting
function initStructureTabs() {
  const tabs = document.querySelectorAll('.struct-tab-btn');
  const branchGroups = document.querySelectorAll('.tree-branch-group');
  const busHighlight = document.getElementById('tree-bus-highlight');
  const treeContainer = document.getElementById('tree-canvas-container');

  if (!tabs.length) return;

  // Auto center tree canvas horizontally on load
  if (treeContainer) {
    setTimeout(() => {
      const scrollMax = treeContainer.scrollWidth - treeContainer.clientWidth;
      if (scrollMax > 0) {
        treeContainer.scrollLeft = scrollMax / 2;
      }
    }, 150);

    // Mouse drag-to-scroll functionality for desktop users
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    treeContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      treeContainer.classList.add('cursor-grabbing');
      startX = e.pageX - treeContainer.offsetLeft;
      scrollLeft = treeContainer.scrollLeft;
    });

    treeContainer.addEventListener('mouseleave', () => {
      isDown = false;
      treeContainer.classList.remove('cursor-grabbing');
    });

    treeContainer.addEventListener('mouseup', () => {
      isDown = false;
      treeContainer.classList.remove('cursor-grabbing');
    });

    treeContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - treeContainer.offsetLeft;
      const walk = (x - startX) * 1.5;
      treeContainer.scrollLeft = scrollLeft - walk;
    });
  }

  // Branch Highlighting Engine
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      // Update active tab button style
      tabs.forEach(t => {
        t.className = 'struct-tab-btn px-4 py-2 rounded-xl text-xs font-medium bg-[#1E0A38] text-[#C9A4F6] hover:bg-[#280E48] hover:text-white border border-[#561F99] transition-all shadow-sm';
      });

      tab.className = 'struct-tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#9B5CE8] text-white border border-[#9B5CE8] transition-all shadow-md';

      // Apply branch highlighting and muting
      branchGroups.forEach(group => {
        const branchName = group.getAttribute('data-branch');
        if (target === 'all') {
          group.classList.remove('branch-muted');
          group.classList.add('branch-active');
        } else if (target === 'bph') {
          // BPH Inti selected: Presidium (root) and BPH stay active
          if (branchName === 'root' || branchName === 'bph') {
            group.classList.remove('branch-muted');
            group.classList.add('branch-active');
          } else {
            group.classList.remove('branch-active');
            group.classList.add('branch-muted');
          }
        } else {
          // Divisi selected (riset / psdm / humas): ONLY the selected division lights up, Ketua & Wakil (root) become muted
          if (branchName === target) {
            group.classList.remove('branch-muted');
            group.classList.add('branch-active');
          } else {
            group.classList.remove('branch-active');
            group.classList.add('branch-muted');
          }
        }
      });

      // Update Bus Rail line appearance
      if (busHighlight) {
        if (target === 'all') {
          busHighlight.classList.remove('branch-muted');
          busHighlight.classList.add('branch-active');
        } else {
          busHighlight.classList.add('branch-active');
        }
      }

      initIcons();
    });
  });
}

// Live Statistics Fetcher & Counter Animator
async function initLiveStats() {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
    const res = await fetch(`${API_BASE}/members/count`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.total_members === 'number' && data.total_members > 0) {
        const memberCountEl = document.getElementById('stat-member-counter');
        if (memberCountEl) {
          memberCountEl.setAttribute('data-target', String(data.total_members));
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
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  initThemeEngine();
  await fetchAndRenderTree();
  // initStructureTabs();
  initLiveStats();
  initProjectShowcase();

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login_required') === '1') {
    if (urlParams.get('expired') === '1') {
      showToast('Sesi Anda telah berakhir. Silakan masuk kembali.', 'warning');
    } else {
      showToast('Akses Dibatasi: Silakan login sebagai Pengurus KSM.', 'error');
    }
  }

  // Update Navbar UI based on active login session
  const currentUser = getAuthUser();
  const desktopLoginArea = document.getElementById('desktop-login-area');
  const mobileLoginArea = document.getElementById('mobile-login-area');

  if (currentUser) {
    if (desktopLoginArea) {
      desktopLoginArea.innerHTML = `
        <div class="flex items-center space-x-2">
          <a href="${import.meta.env.BASE_URL}pages/selection"
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
        <a href="${import.meta.env.BASE_URL}pages/selection"
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

  if (urlParams.get('open_login') === '1' || urlParams.get('login_required') === '1') {
    loginModal?.classList.remove('hidden');
    loginModal?.classList.add('flex');
    loginModal?.classList.remove('opacity-0');
    loginModal?.classList.add('opacity-100');
    const inner = loginModal?.querySelector('div');
    if (inner) {
      inner.classList.remove('scale-95', 'opacity-0');
      inner.classList.add('scale-100', 'opacity-100');
    }
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
        window.location.href = `${import.meta.env.BASE_URL}pages/selection`;
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
