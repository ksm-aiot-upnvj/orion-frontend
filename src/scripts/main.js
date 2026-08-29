import { animateCounters, initIcons, initThemeEngine, showToast } from '../modules/ui.js';
import { getAuthUser, login, logout } from '../modules/auth.js';
import { initialProjectsData } from '../modules/data.js';

// Interactive Terminal Simulator
function initTerminal() {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;

  const logs = [
    { text: 'Initialising AIoT Core Kernel v2.4.0-edge...', color: 'text-slate-400' },
    { text: 'Connecting to MQTT Broker [aiot.upnvj.ac.id:8883]... [OK]', color: 'text-emerald-400' },
    { text: 'Subscribing to telemetry topics /sensor/edge/+/telemetry', color: 'text-aiot-cyan' },
    { text: 'Loading TinyML YOLOv8n TensorRT runtime... [READY]', color: 'text-purple-400' },
    { text: 'Establishing secure LoRaWAN gateway uplink (868 MHz)...', color: 'text-slate-400' },
    { text: 'Inference latency: 18.4ms | Frame rate: 30.2 FPS | Power: 4.8W', color: 'text-emerald-400' },
    { text: 'All nodes online. Systems nominal and listening.', color: 'text-aiot-cyan' }
  ];

  let index = 0;
  function addLog() {
    if (index >= logs.length) return;
    const log = logs[index];
    const p = document.createElement('p');
    p.className = `${log.color} font-mono text-xs leading-relaxed opacity-0 transition-opacity duration-300`;
    p.textContent = `> ${log.text}`;
    terminalBody.appendChild(p);
    setTimeout(() => {
      p.classList.remove('opacity-0');
      p.classList.add('opacity-100');
    }, 50);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    index++;
    setTimeout(addLog, 1200);
  }

  setTimeout(addLog, 800);
}

// Particle Mesh Network Canvas Background Simulator
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const numParticles = Math.min(Math.floor(window.innerWidth / 20), 45);
  const particles = [];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.8
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// Organizational Structure Tab Switcher
function initStructureTabs() {
  const tabs = document.querySelectorAll('.structure-tab-btn');
  const panels = document.querySelectorAll('.structure-panel');

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => {
        t.classList.remove('bg-aiot-cyan', 'text-slate-950', 'font-bold', 'shadow-[0_0_15px_rgba(0,242,254,0.4)]');
        t.classList.add('bg-slate-900/80', 'text-slate-400', 'hover:text-slate-200');
      });

      tab.classList.add('bg-aiot-cyan', 'text-slate-950', 'font-bold', 'shadow-[0_0_15px_rgba(0,242,254,0.4)]');
      tab.classList.remove('bg-slate-900/80', 'text-slate-400', 'hover:text-slate-200');

      panels.forEach(panel => {
        if (panel.id === `panel-${target}`) {
          panel.classList.remove('hidden');
          panel.classList.add('grid');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('grid');
        }
      });

      initIcons();
    });
  });
}

// Interactive Live Device Telemetry Card Simulator
function initTelemetrySimulator() {
  const node1Temp = document.getElementById('tele-node1-temp');
  const node1Hum = document.getElementById('tele-node1-hum');
  const node2Fps = document.getElementById('tele-node2-fps');
  const node2Inf = document.getElementById('tele-node2-inf');

  if (!node1Temp) return;

  setInterval(() => {
    const temp = (27.2 + (Math.random() * 1.6 - 0.8)).toFixed(1);
    const hum = (64.5 + (Math.random() * 2.4 - 1.2)).toFixed(1);
    node1Temp.textContent = `${temp}°C`;
    node1Hum.textContent = `${hum}%`;

    const fps = Math.floor(28 + Math.random() * 5);
    const inf = Math.floor(18 + Math.random() * 6);
    if (node2Fps) node2Fps.textContent = `${fps} FPS`;
    if (node2Inf) node2Inf.textContent = `${inf} ms`;
  }, 2500);
}

// Live Statistics Fetcher & Counter Animator
async function initLiveStats() {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
    const res = await fetch(`${API_BASE}/members/`);
    if (res.ok) {
      const members = await res.json();
      if (Array.isArray(members) && members.length > 0) {
        const memberCountEl = document.querySelector('.stat-counter[data-target]');
        if (memberCountEl) {
          memberCountEl.setAttribute('data-target', String(members.length));
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch live member count, using default target:', err);
  }

  // Trigger smooth counter animation
  const statsSection = document.getElementById('stats');
  if (statsSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(statsSection);
  } else {
    animateCounters();
  }
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
        <div class="w-full py-16 text-center text-slate-500 font-mono">
          <i data-lucide="folder-kanban" class="w-10 h-10 mx-auto mb-3 opacity-40"></i>
          <p class="text-sm">Tidak ada proyek yang sesuai dengan filter.</p>
        </div>
      `;
      initIcons();
      return;
    }

    grid.innerHTML = filtered.map(proj => `
      <div class="flex-1 min-w-[320px] max-w-[540px] glass-panel border border-slate-800/80 hover:border-aiot-cyan/50 transition-all duration-300 rounded-3xl overflow-hidden group shadow-2xl flex flex-col">
        <!-- Project Asset Image Preview -->
        <div class="w-full h-56 bg-slate-950 overflow-hidden relative border-b border-slate-800/60 flex items-center justify-center">
          <img src="${proj.image}" alt="${proj.title}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
          <div class="absolute top-4 right-4">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-900/90 text-aiot-cyan border border-aiot-cyan/40 shadow-lg backdrop-blur-md">
              ${proj.categoryLabel}
            </span>
          </div>
        </div>

        <!-- Project Details Body -->
        <div class="p-6 sm:p-7 flex flex-col flex-1 justify-between gap-6">
          <div class="space-y-3">
            <h4 class="text-xl sm:text-2xl font-bold text-white group-hover:text-aiot-cyan transition-colors">
              ${proj.title}
            </h4>
            <p class="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              ${proj.description}
            </p>
            
            <!-- Tech Stack Tags -->
            <div class="flex flex-wrap gap-1.5 pt-2">
              ${proj.techStack.map(tag => `
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-900/90 text-slate-300 border border-slate-800">
                  ${tag}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Action Repository Link -->
          <div class="pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <a href="${proj.repoUrl}" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-aiot-cyan hover:text-white border border-aiot-cyan/40 hover:border-aiot-cyan transition-all text-xs font-mono font-bold shadow-md group/btn">
              <i data-lucide="github" class="w-4 h-4 text-aiot-cyan group-hover/btn:text-white transition-colors"></i>
              <span>GitHub Repository</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-aiot-cyan transition-colors"></i>
            </a>
          </div>
        </div>
      </div>
    `).join('');

    initIcons();
  }

  // Filter Buttons Click Listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter') || 'all';
      filterBtns.forEach(b => {
        b.classList.remove('bg-aiot-cyan', 'text-slate-950', 'font-semibold', 'glow-cyan');
        b.classList.add('bg-slate-800/80', 'text-slate-300');
      });
      btn.classList.add('bg-aiot-cyan', 'text-slate-950', 'font-semibold', 'glow-cyan');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300');
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
  initTerminal();
  initParticles();
  initStructureTabs();
  initTelemetrySimulator();
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
        <a href="/pages/selection.html"
          class="text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-aiot-cyan border border-aiot-cyan/40 transition-all flex items-center space-x-2 shadow-sm whitespace-nowrap">
          <i data-lucide="layout-dashboard" class="w-4 h-4 text-aiot-cyan"></i>
          <span>Panel CRM</span>
        </a>
        <button type="button" id="btn-quick-logout" title="Logout"
          class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-red-950/60 border border-slate-800 transition-all flex items-center justify-center">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      `;
    }
    if (mobileLoginArea) {
      mobileLoginArea.innerHTML = `
        <a href="/pages/selection.html"
          class="w-full text-center py-2.5 rounded-xl bg-slate-900 text-aiot-cyan border border-aiot-cyan/40 font-bold block">
          Panel CRM
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
      loginModal?.classList.remove('hidden');
      loginModal?.classList.add('flex');
    });
  });

  closeLoginBtn?.addEventListener('click', () => {
    loginModal?.classList.add('hidden');
    loginModal?.classList.remove('flex');
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
      showToast(`Login Berhasil! Selamat datang, ${result.user.full_name} (${result.user.role}).`, 'success');
      setTimeout(() => {
        loginModal?.classList.add('hidden');
        loginModal?.classList.remove('flex');
        window.location.href = '/pages/selection.html';
      }, 700);
    } else {
      showToast(result.message || 'NIM atau Password salah.', 'error');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  initIcons();
});
