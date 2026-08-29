import {
  createIcons,
  Users,
  Cpu,
  FileText,
  Search,
  Download,
  Plus,
  Send,
  Printer,
  Code,
  Copy,
  X,
  ArrowLeft,
  ArrowRight,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Check,
  Clock,
  Archive,
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Menu,
  UserPlus,
  DollarSign,
  AlertCircle,
  LogIn,
  LogOut,
  Lock,
  Eye,
  Inbox,
  FileCheck,
  Camera,
  Upload,
  Trash2,
  UserCheck,
  LayoutDashboard,
  User,
  Brain,
  Bot,
  FolderKanban,
  Globe,
  HeartHandshake,
  Instagram,
  Github,
  ClipboardList,
  Megaphone
} from 'lucide';

// ==========================================
// LUCIDE ICON INITIALIZER
// ==========================================
export function initIcons() {
  createIcons({
    icons: {
      Users,
      Cpu,
      FileText,
      Search,
      Download,
      Plus,
      Send,
      Printer,
      Code,
      Copy,
      X,
      ArrowLeft,
      ArrowRight,
      Moon,
      Sun,
      Monitor,
      CheckCircle2,
      Check,
      Clock,
      Archive,
      Award,
      BookOpen,
      Briefcase,
      ExternalLink,
      ShieldCheck,
      Zap,
      TrendingUp,
      TrendingDown,
      Menu,
      UserPlus,
      DollarSign,
      AlertCircle,
      LogIn,
      LogOut,
      Lock,
      Eye,
      Inbox,
      FileCheck,
      Camera,
      Upload,
      Trash2,
      UserCheck,
      LayoutDashboard,
      User,
      Brain,
      Bot,
      FolderKanban,
      Globe,
      HeartHandshake,
      Instagram,
      Github,
      ClipboardList,
      Megaphone
    }
  });
}

// ==========================================
// TOAST NOTIFICATION (Always on Top with z-[9999])
// ==========================================
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm pointer-events-none';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'clock',
    info: 'cpu'
  };

  const colors = {
    success: 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40',
    error: 'bg-slate-900/95 border-red-500/50 text-red-300 shadow-red-950/40',
    warning: 'bg-slate-900/95 border-amber-500/50 text-amber-300 shadow-amber-950/40',
    info: 'bg-slate-900/95 border-aiot-cyan/50 text-aiot-cyan shadow-cyan-950/40'
  };

  const toast = document.createElement('div');
  const iconName = icons[type] || icons.info;
  const iconColor = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-amber-400' : 'text-aiot-cyan';

  toast.className = `glass-panel pointer-events-auto flex items-center p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-[-10px] opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <div class="flex-shrink-0 mr-3">
      <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor}"></i>
    </div>
    <div class="text-xs font-mono font-medium text-slate-200 flex-1 leading-relaxed">
      ${message}
    </div>
    <button class="ml-3 text-slate-400 hover:text-slate-200 transition-colors p-1" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  initIcons();

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// MODAL CONTROLLERS
// ==========================================
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    initIcons();
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ==========================================
// NUMBER COUNTER ANIMATION
// ==========================================
export function animateCounters() {
  const counters = document.querySelectorAll('.stat-counter');
  counters.forEach(counter => {
    const rawTarget = counter.getAttribute('data-target');
    if (rawTarget === 'N/A' || isNaN(parseInt(rawTarget))) {
      counter.textContent = rawTarget;
      return;
    }
    const target = +rawTarget;
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 1200; // ms
    const step = Math.ceil(target / (duration / 16));

    let count = 0;
    const updateCount = () => {
      count += step;
      if (count < target) {
        counter.textContent = count + suffix;
        requestAnimationFrame(updateCount);
      } else {
        counter.textContent = target + suffix;
      }
    };
    updateCount();
  });
}

// ==========================================
// THEME ENGINE
// ==========================================
export function initThemeEngine() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('orion_theme') || 'dark';

  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
      html.classList.toggle('light', !prefersDark);
    } else if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
    localStorage.setItem('orion_theme', theme);
    updateThemeToggleUI(theme);
  }

  function updateThemeToggleUI(currentTheme) {
    const toggles = document.querySelectorAll('[data-theme-value]');
    toggles.forEach(btn => {
      const val = btn.getAttribute('data-theme-value');
      if (val === currentTheme) {
        btn.classList.add('bg-aiot-cyan/20', 'text-aiot-cyan', 'border-aiot-cyan/40');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('bg-aiot-cyan/20', 'text-aiot-cyan', 'border-aiot-cyan/40');
        btn.classList.add('text-slate-400');
      }
    });
  }

  // Bind click handlers to theme toggle buttons
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-theme-value]');
    if (toggleBtn) {
      const selectedTheme = toggleBtn.getAttribute('data-theme-value');
      applyTheme(selectedTheme);
    }
  });

  // Initial apply
  applyTheme(savedTheme);

  // Listen for OS theme change if on system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('orion_theme') === 'system') {
      applyTheme('system');
    }
  });
}

// ==========================================
// OFFICIAL LETTER NUMBER COMPUTATION
// ==========================================
export function computeOfficialLetterNumber(seq, categoryCode, dateStr = new Date()) {
  const d = new Date(dateStr);
  const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][d.getMonth()] || 'VIII';
  const year = d.getFullYear() || 2026;
  const seqPadded = String(seq).padStart(3, '0');
  return `${seqPadded}/KSM-AIoT/FIK-UPNVJ/${categoryCode}/${monthRoman}/${year}`;
}

// ==========================================
// LATEX SOURCE GENERATOR
// ==========================================
export function generateLaTeXSource(letterData = {}) {
  const {
    noSurat = '001/KSM-AIoT/FIK-UPNVJ/U/VIII/2026',
    lampiran = '-',
    perihal = 'Undangan Kegiatan',
    tujuan = 'Dekan Fakultas Ilmu Komputer',
    lokasiTujuan = 'di Tempat',
    date = '28 Agustus 2026',
    signer = 'Dzulfikri Adjmal',
    signerRole = 'Ketua KSM AIoT',
    signerNIM = '2210511084'
  } = letterData;

  return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{tabularx}
\\usepackage{setspace}
\\geometry{top=2cm, bottom=2.5cm, left=2.5cm, right=2.5cm}

\\begin{document}

% --- KOP SURAT KSM AIoT UPNVJ ---
\\noindent
\\begin{tabularx}{\\textwidth}{@{}l X r@{}}
\\textbf{\\Large KELOMPOK STUDI MAHASISWA} & & \\textbf{\\Large UPNVJ} \\\\[2pt]
\\textbf{\\large ARTIFICIAL INTELLIGENCE OF THINGS (AIoT)} & & \\\\[2pt]
\\small Fakultas Ilmu Komputer, UPN "Veteran" Jakarta & & \\small Sekretariat FIK Lt. 3 \\\\[-4pt]
\\hline
\\hline
\\end{tabularx}

\\vspace{1.5em}

\\begin{flushleft}
\\begin{tabular}{@{}ll}
Nomor & : ${noSurat} \\\\
Lampiran & : ${lampiran} \\\\
Perihal & : \\textbf{${perihal}}
\\end{tabular}
\\end{flushleft}

\\vspace{1em}
\\noindent Kepada Yth.\\\\
\\textbf{${tujuan}}\\\\
${lokasiTujuan}

\\vspace{1.5em}
\\noindent Dengan hormat,\\\\
Sehubungan dengan pelaksanaan program kerja KSM AIoT UPN \\"Veteran\\" Jakarta, bersama surat ini kami sampaikan permohonan/undangan terkait agenda yang akan diselenggarakan.

\\vspace{2em}
\\begin{flushright}
Jakarta, ${date}\\\\
\\textbf{${signerRole}}\\\\
\\vspace{4em}
\\textbf{\\underline{${signer}}}\\\\
NIM. ${signerNIM}
\\end{flushright}

\\end{document}`;
}
