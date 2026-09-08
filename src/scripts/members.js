import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons, resolveAvatarUrl } from '../modules/ui.js';
import { getAuthToken } from '../modules/auth.js';
import { initialAlumniData } from '../modules/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let activeMembersList = [];
let alumniList = [...initialAlumniData];
let memberToDelete = null;
let selectedExcelFile = null;

// ==================== FETCH MEMBERS ====================
async function fetchMembersFromBackend() {
  const tbody = document.getElementById('active-members-tbody');
  const countBadge = document.getElementById('member-count-badge');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-[#D8B4FE] font-mono text-xs">
          <div class="flex items-center justify-center space-x-2">
            <svg class="animate-spin h-4 w-4 text-[#A78BFA]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memuat data anggota dari database...</span>
          </div>
        </td>
      </tr>
    `;
  }

  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/members/`, { headers });

    if (res.ok) {
      activeMembersList = await res.json();
    } else {
      activeMembersList = getFallbackMembers();
    }
  } catch {
    activeMembersList = getFallbackMembers();
  }

  const tabLabel = document.getElementById('active-members-tab-label');
  if (tabLabel) {
    tabLabel.textContent = `Anggota Aktif (${activeMembersList.length})`;
  }
  if (countBadge) {
    countBadge.textContent = `${activeMembersList.length} Anggota`;
  }

  applyFilter();
}

function getFallbackMembers() {
  return [
    {
      member_id: 'AIOT-2026-001',
      student_id: '2210511084',
      full_name: 'Dzulfikri Adjmal',
      program_of_study: 'S1 Informatika',
      email: '2210511084@mahasiswa.upnvj.ac.id',
      division: 'BPH',
      role: 'Ketua',
      intake_period: '2022',
      interest_track: ['AI', 'IoT Embedded'],
      status: 'Aktif',
    },
    {
      member_id: 'AIOT-2026-002',
      student_id: '2210511056',
      full_name: "Adinda Rizki Sya'bana Diva",
      program_of_study: 'S1 Informatika',
      email: '2210511056@mahasiswa.upnvj.ac.id',
      division: 'BPH',
      role: 'Wakil Ketua',
      intake_period: '2022',
      interest_track: ['Software Engineer & Cloud'],
      status: 'Aktif',
    },
    {
      member_id: 'AIOT-2026-003',
      student_id: '2410501116',
      full_name: 'Clara Ragil Dewanti',
      program_of_study: 'D3 Sistem Informasi',
      email: '2410501116@mahasiswa.upnvj.ac.id',
      division: null,
      role: 'Anggota',
      intake_period: '2026',
      interest_track: ['IoT Embedded'],
      status: 'Aktif',
    },
  ];
}

// ==================== RENDER MEMBERS TABLE ====================
function renderActiveMembers(filterText = '', division = 'all', track = 'all') {
  const tbody = document.getElementById('active-members-tbody');
  if (!tbody) return;

  const search = filterText.trim().toLowerCase();

  const filtered = activeMembersList.filter((m) => {
    const name = (m.full_name || '').toLowerCase();
    const nim = (m.student_id || '').toLowerCase();
    const memId = (m.member_id || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    const prodi = (m.program_of_study || '').toLowerCase();

    const matchText =
      !search ||
      name.includes(search) ||
      nim.includes(search) ||
      memId.includes(search) ||
      email.includes(search) ||
      prodi.includes(search);

    // Division Filter
    let matchDiv = true;
    if (division === 'none') {
      matchDiv = !m.division;
    } else if (division !== 'all') {
      matchDiv = m.division === division;
    }

    // Track Filter
    let matchTrack = true;
    if (track !== 'all') {
      const tracks = m.interest_track || [];
      matchTrack = tracks.some((t) => t === track);
    }

    return matchText && matchDiv && matchTrack;
  });

  const countBadge = document.getElementById('member-count-badge');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} dari ${activeMembersList.length} Anggota`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-[#D8B4FE] font-mono text-xs">
          Tidak ada data anggota yang sesuai dengan kriteria pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((m) => {
      // Role & Division pill
      let divRoleHtml = '';
      if (m.division) {
        divRoleHtml = `
          <div class="flex flex-col items-start gap-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7C3AED]/30 text-[#D8B4FE] border border-[#7C3AED]/40">${m.division}</span>
            <span class="text-xs font-semibold text-white">${m.role || 'Pengurus'}</span>
          </div>
        `;
      } else {
        divRoleHtml = `
          <div class="flex flex-col items-start gap-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-[#150626] text-[#D8B4FE] border border-[#561F99]/60">Anggota Biasa</span>
            <span class="text-xs text-[#A78BFA] font-medium">Non-Divisi</span>
          </div>
        `;
      }

      // Track badges
      const tracks = m.interest_track || [];
      const trackBadgesHtml =
        tracks.length > 0
          ? tracks
              .map((t) => {
                let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                if (t === 'AI') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                if (t === 'Software Engineer & Cloud')
                  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                return `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColor}">${t}</span>`;
              })
              .join(' ')
          : `<span class="text-[11px] text-gray-500">-</span>`;

      // Status
      let statusClass = 'badge-approved';
      if (m.status === 'Tidak Aktif') statusClass = 'badge-rejected';
      if (m.status === 'Alumni') statusClass = 'badge-neutral';

      const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.student_id || m.full_name || 'orion')}&backgroundColor=240d42`;
      const avatarSrc = resolveAvatarUrl(m.avatar, m.student_id || m.full_name || 'orion');

      return `
      <tr class="hover:bg-[#301057]/40 transition-colors">
        <!-- Member ID & NIM -->
        <td class="py-3 px-4">
          <div class="flex flex-col">
            <span class="font-mono font-bold text-xs text-[#A78BFA]">${m.member_id || '-'}</span>
            <span class="font-mono text-[11px] text-[#D8B4FE]">${m.student_id || '-'}</span>
          </div>
        </td>

        <!-- Nama Lengkap & Avatar -->
        <td class="py-3 px-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-[#150626] border border-[#7C3AED]/40 flex-shrink-0">
              <img src="${avatarSrc}" alt="${m.full_name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackAvatar}';" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-white truncate hover:text-[#A78BFA] cursor-pointer" onclick="window.showMemberProfile('${m.student_id}')">${m.full_name || '-'}</p>
              <p class="text-[11px] text-[#D8B4FE] truncate font-mono">${m.email || '-'}</p>
            </div>
          </div>
        </td>

        <!-- Program Studi -->
        <td class="py-3 px-4 text-xs font-medium text-white/90">
          ${m.program_of_study || '-'}
        </td>

        <!-- Divisi & Jabatan -->
        <td class="py-3 px-4">
          ${divRoleHtml}
        </td>

        <!-- Bidang Riset -->
        <td class="py-3 px-4">
          <div class="flex flex-wrap gap-1">
            ${trackBadgesHtml}
          </div>
        </td>

        <!-- Status & ERP Badge -->
        <td class="py-3 px-4">
          <div class="flex flex-col space-y-1">
            <span class="badge-status ${statusClass} text-[10px]">
              ${m.status || 'Aktif'}
            </span>
            ${
              m.has_erp_access
                ? `<span title="Akses ERP: ${m.user_role || 'PENGURUS'} (Aktif)" class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#7C3AED]/30 text-[#D8B4FE] border border-[#7C3AED]/50 w-max">
                     <i data-lucide="shield-check" class="w-3 h-3 mr-1 text-emerald-400"></i>
                     ERP: ${m.user_role || 'PENGURUS'}
                   </span>`
                : ''
            }
          </div>
        </td>

        <!-- Aksi -->
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center space-x-1.5">
            <button onclick="window.showMemberProfile('${m.student_id}')" title="Cek Profil Lengkap"
              class="p-1.5 rounded-lg bg-[#150626] hover:bg-[#7C3AED]/30 text-[#A78BFA] hover:text-white border border-[#561F99]/60 transition-colors">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.openManageERP('${m.student_id}')" title="${m.has_erp_access ? 'Kelola / Reset Akses ERP' : 'Beri Akses Login ERP'}"
              class="p-1.5 rounded-lg bg-[#150626] hover:bg-[#7C3AED]/30 ${m.has_erp_access ? 'text-emerald-400 border-emerald-500/50' : 'text-[#A78BFA] border-[#561F99]/60'} hover:text-white border transition-colors">
              <i data-lucide="${m.has_erp_access ? 'shield-check' : 'key'}" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.openEditMember('${m.student_id}')" title="Edit Data"
              class="p-1.5 rounded-lg bg-[#150626] hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-[#561F99]/60 transition-colors">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.openDeleteMember('${m.student_id}')" title="Hapus Anggota"
              class="p-1.5 rounded-lg bg-[#150626] hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#561F99]/60 transition-colors">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  initIcons();
}

// ==================== RENDER ALUMNI ====================
function renderAlumni(filterText = '') {
  const grid = document.getElementById('alumni-grid');
  if (!grid) return;

  const search = filterText.toLowerCase();
  const filtered = alumniList.filter((a) => {
    return (
      (a.name || '').toLowerCase().includes(search) ||
      (a.company || '').toLowerCase().includes(search) ||
      (a.currentRole || '').toLowerCase().includes(search) ||
      (a.angkatan || '').toLowerCase().includes(search)
    );
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500 font-mono text-xs">Tidak ada data alumni yang cocok.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (a) => `
    <div class="card-institutional p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-start space-x-3 mb-3">
          <div class="w-11 h-11 rounded-lg overflow-hidden border border-[#561F99] bg-[#150626] flex-shrink-0">
            <img src="${a.photo}" alt="${a.name}" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-white truncate">${a.name}</h4>
            <p class="text-xs text-[#C9A4F6] font-semibold">${a.currentRole}</p>
            <p class="text-[11px] text-[#D8B4FE] truncate mt-0.5">${a.company}</p>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-[#150626] border border-[#561F99] my-3">
          <span class="text-[10px] text-[#C9A4F6] font-semibold uppercase tracking-wider block mb-1">Riset di KSM AIoT:</span>
          <p class="text-xs text-[#E9D8FD] italic leading-relaxed line-clamp-2">"${a.project}"</p>
        </div>
      </div>

      <div class="pt-3 border-t border-[#561F99] flex items-center justify-between text-xs">
        <span class="badge-status badge-neutral text-[10px]">Alumni ${a.angkatan}</span>
        <a href="${a.linkedin}" target="_blank" class="text-[#C9A4F6] hover:text-white flex items-center space-x-1 font-semibold transition-colors">
          <span>LinkedIn</span>
          <i data-lucide="external-link" class="w-3 h-3 text-[#C9A4F6]"></i>
        </a>
      </div>
    </div>
  `
    )
    .join('');

  initIcons();
}

// ==================== FILTER HANDLER ====================
function applyFilter() {
  const searchInput = document.getElementById('search-member-input');
  const divSelect = document.getElementById('filter-member-divisi');
  const trackSelect = document.getElementById('filter-member-track');

  renderActiveMembers(
    searchInput?.value || '',
    divSelect?.value || 'all',
    trackSelect?.value || 'all'
  );
}

// ==================== 1. SHOW RICH PROFILE MODAL ====================
window.showMemberProfile = function (studentId) {
  const m = activeMembersList.find((item) => String(item.student_id) === String(studentId));
  if (!m) {
    showToast('Data anggota tidak ditemukan', 'error');
    return;
  }

  const modal = document.getElementById('member-profile-modal');
  if (!modal) return;

  // Banner
  document.getElementById('profile-modal-name').textContent = m.full_name || 'Anggota KSM AIoT';
  document.getElementById('profile-modal-nim').textContent = `NIM: ${m.student_id || '-'}`;
  document.getElementById('profile-modal-member-id').textContent = m.member_id || 'AIOT-MEMBER';

  const avatarEl = document.getElementById('profile-modal-avatar');
  if (avatarEl) {
    const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.student_id || m.full_name || 'orion')}&backgroundColor=240d42`;
    avatarEl.src = resolveAvatarUrl(m.avatar, m.student_id || m.full_name || 'orion');
    avatarEl.onerror = () => {
      avatarEl.onerror = null;
      avatarEl.src = fallbackUrl;
    };
  }

  // Status
  const statusBadge = document.getElementById('profile-modal-status-badge');
  if (statusBadge) {
    statusBadge.textContent = (m.status || 'Aktif').toUpperCase();
    statusBadge.className = `badge-status ${m.status === 'Tidak Aktif' ? 'badge-rejected' : m.status === 'Alumni' ? 'badge-neutral' : 'badge-approved'} text-[10px] font-bold`;
  }

  // Role Tags
  const roleTagsContainer = document.getElementById('profile-modal-role-tags');
  if (roleTagsContainer) {
    let html = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 border border-white/20 text-white">${m.role || 'Anggota'}</span>`;
    if (m.division) {
      html += `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-[#A78BFA]/30 border border-[#A78BFA] text-white">Divisi ${m.division}</span>`;
    } else {
      html += `<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-black/30 border border-white/10 text-[#D8B4FE]">Anggota Biasa (Non-Divisi)</span>`;
    }
    roleTagsContainer.innerHTML = html;
  }

  // Section 1: Akademik & Kontak
  document.getElementById('profile-modal-prodi').textContent = `${m.program_of_study || '-'} ${m.semester ? `(Semester ${m.semester})` : ''}`;
  document.getElementById('profile-modal-intake').textContent = `Angkatan ${m.intake_period || '-'} ${m.join_date ? `• Gabung: ${m.join_date}` : ''}`;
  document.getElementById('profile-modal-email').textContent = m.email || '-';
  document.getElementById('profile-modal-contact').textContent = `${m.contact_info || '-'} ${m.domicile_city ? `• ${m.domicile_city}` : ''}`;

  // Section 2: Peminatan & Riset
  const tracksContainer = document.getElementById('profile-modal-tracks');
  if (tracksContainer) {
    const tracks = m.interest_track || [];
    if (tracks.length > 0) {
      tracksContainer.innerHTML = tracks
        .map((t) => {
          let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
          if (t === 'AI') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
          if (t === 'Software Engineer & Cloud')
            badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          return `<span class="px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColor}">${t}</span>`;
        })
        .join('');
    } else {
      tracksContainer.innerHTML = `<span class="text-gray-400 italic">Belum memilih track riset</span>`;
    }
  }

  document.getElementById('profile-modal-focus').textContent =
    m.focus_expertise || m.exploration_field || 'Belum ada catatan fokus keahlian.';
  document.getElementById('profile-modal-reason').textContent =
    m.field_reason || 'Belum ada catatan alasan pemilihan bidang.';

  // Section 3: Teknis & Portofolio
  document.getElementById('profile-modal-languages').textContent = m.programming_languages || '-';
  document.getElementById('profile-modal-tools').textContent = m.tools_frameworks || '-';
  document.getElementById('profile-modal-discord').textContent = m.discord_id || '-';

  const portfolioBox = document.getElementById('profile-modal-portfolio-box');
  if (portfolioBox) {
    if (m.portfolio_url) {
      portfolioBox.innerHTML = `
        <a href="${m.portfolio_url}" target="_blank" class="text-[#A78BFA] hover:text-white underline truncate block font-mono text-xs flex items-center gap-1">
          <span>${m.portfolio_url}</span>
          <i data-lucide="external-link" class="w-3 h-3 flex-shrink-0"></i>
        </a>
      `;
    } else {
      portfolioBox.innerHTML = `<span class="text-gray-400">-</span>`;
    }
  }

  // Edit button inside profile modal
  const editBtn = document.getElementById('profile-modal-btn-edit');
  if (editBtn) {
    editBtn.onclick = () => {
      closeModal('member-profile-modal');
      window.openEditMember(m.student_id);
    };
  }

  openModal('member-profile-modal');
  initIcons();
};

// ==================== 2. CREATE & EDIT MEMBER MODAL ====================
window.openCreateMember = function () {
  const form = document.getElementById('member-form');
  if (form) form.reset();

  document.getElementById('form-member-id-hidden').value = '';
  document.getElementById('member-form-modal-title').textContent = 'Tambah Anggota Baru';
  document.getElementById('btn-submit-member-label').textContent = 'Simpan Anggota Baru';
  document.getElementById('form-student-id').disabled = false;

  // Uncheck all tracks
  document.querySelectorAll('input[name="form_tracks"]').forEach((cb) => (cb.checked = false));

  // Reset ERP access fields
  const erpToggle = document.getElementById('form-erp-access-toggle');
  if (erpToggle) erpToggle.checked = false;
  document.getElementById('erp-access-fields')?.classList.add('hidden');
  const pwdInput = document.getElementById('form-erp-password');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.placeholder = 'Minimal 8 karakter';
  }
  const roleSelect = document.getElementById('form-erp-role');
  if (roleSelect) roleSelect.value = 'PENGURUS';

  // Hide Make Alumni button in Create mode
  document.getElementById('btn-make-alumni')?.classList.add('hidden');

  openModal('member-form-modal');
};

window.openEditMember = function (studentId) {
  const m = activeMembersList.find((item) => String(item.student_id) === String(studentId));
  if (!m) return;

  const form = document.getElementById('member-form');
  if (form) form.reset();

  document.getElementById('form-member-id-hidden').value = m.student_id;
  document.getElementById('member-form-modal-title').textContent = `Edit Anggota: ${m.full_name}`;
  document.getElementById('btn-submit-member-label').textContent = 'Simpan Perubahan';

  // Fill inputs
  document.getElementById('form-student-id').value = m.student_id || '';
  document.getElementById('form-student-id').disabled = true; // NIM cannot be changed
  document.getElementById('form-full-name').value = m.full_name || '';
  document.getElementById('form-prodi').value = m.program_of_study || 'S1 Informatika';
  document.getElementById('form-semester').value = m.semester || '';
  document.getElementById('form-email').value = m.email || '';
  document.getElementById('form-contact').value = m.contact_info || '';
  document.getElementById('form-division').value = m.division || '';
  document.getElementById('form-role').value = m.role || 'Anggota';
  document.getElementById('form-status').value = m.status || 'Aktif';
  document.getElementById('form-intake').value = m.intake_period || '2026';

  document.getElementById('form-languages').value = m.programming_languages || '';
  document.getElementById('form-tools').value = m.tools_frameworks || '';
  document.getElementById('form-portfolio').value = m.portfolio_url || '';
  document.getElementById('form-discord').value = m.discord_id || '';

  // Check tracks
  const tracks = m.interest_track || [];
  document.querySelectorAll('input[name="form_tracks"]').forEach((cb) => {
    cb.checked = tracks.includes(cb.value);
  });

  // ERP Access fields in edit mode
  const erpToggle = document.getElementById('form-erp-access-toggle');
  const erpFields = document.getElementById('erp-access-fields');
  const pwdInput = document.getElementById('form-erp-password');
  const roleSelect = document.getElementById('form-erp-role');

  if (m.has_erp_access) {
    if (erpToggle) erpToggle.checked = true;
    erpFields?.classList.remove('hidden');
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.placeholder = 'Kosongkan jika tidak ingin diubah';
    }
    if (roleSelect) roleSelect.value = m.user_role || 'PENGURUS';
  } else {
    if (erpToggle) erpToggle.checked = false;
    erpFields?.classList.add('hidden');
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.placeholder = 'Minimal 8 karakter';
    }
    if (roleSelect) roleSelect.value = 'PENGURUS';
  }

  // Show Make Alumni button in Edit mode
  document.getElementById('btn-make-alumni')?.classList.remove('hidden');

  openModal('member-form-modal');
};

async function handleMemberFormSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-submit-member-form');
  const originalLabel = document.getElementById('btn-submit-member-label').textContent;

  submitBtn.disabled = true;
  document.getElementById('btn-submit-member-label').textContent = 'Menyimpan...';

  const hiddenId = document.getElementById('form-member-id-hidden').value;
  const isEdit = Boolean(hiddenId);

  // Collect selected tracks
  const selectedTracks = [];
  document.querySelectorAll('input[name="form_tracks"]:checked').forEach((cb) => {
    selectedTracks.push(cb.value);
  });

  const payload = {
    student_id: document.getElementById('form-student-id').value.trim(),
    full_name: document.getElementById('form-full-name').value.trim(),
    program_of_study: document.getElementById('form-prodi').value,
    semester: document.getElementById('form-semester').value
      ? parseInt(document.getElementById('form-semester').value, 10)
      : null,
    email: document.getElementById('form-email').value.trim(),
    contact_info: document.getElementById('form-contact').value.trim() || null,
    division: document.getElementById('form-division').value || null,
    role: document.getElementById('form-role').value,
    status: document.getElementById('form-status').value,
    intake_period: document.getElementById('form-intake').value.trim() || '2026',
    interest_track: selectedTracks.length > 0 ? selectedTracks : null,
    programming_languages: document.getElementById('form-languages').value.trim() || null,
    tools_frameworks: document.getElementById('form-tools').value.trim() || null,
    portfolio_url: document.getElementById('form-portfolio').value.trim() || null,
    discord_id: document.getElementById('form-discord').value.trim() || null,
  };

  // Add ERP fields if toggle is active
  const erpToggle = document.getElementById('form-erp-access-toggle');
  if (erpToggle && erpToggle.checked) {
    payload.create_erp_account = true;
    const pwd = document.getElementById('form-erp-password')?.value.trim();
    if (pwd) {
      payload.erp_password = pwd;
    }
    payload.erp_role = document.getElementById('form-erp-role')?.value || 'PENGURUS';
  }

  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const url = isEdit ? `${API_BASE_URL}/members/${hiddenId}` : `${API_BASE_URL}/members/`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast(
        isEdit
          ? `Data anggota ${payload.full_name} berhasil diperbarui!`
          : `Anggota ${payload.full_name} berhasil ditambahkan!`,
        'success'
      );
      closeModal('member-form-modal');
      await fetchMembersFromBackend();
    } else {
      const err = await res.json();
      showToast(`Gagal menyimpan data: ${err.detail || 'Terjadi kesalahan'}`, 'error');
    }
  } catch (error) {
    showToast(`Error koneksi backend: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    document.getElementById('btn-submit-member-label').textContent = originalLabel;
  }
}

// ==================== 3. DELETE MEMBER ====================
window.openDeleteMember = function (studentId) {
  const m = activeMembersList.find((item) => String(item.student_id) === String(studentId));
  if (!m) return;

  memberToDelete = m;
  document.getElementById('delete-member-name').textContent = m.full_name;
  document.getElementById('delete-member-nim').textContent = m.student_id;

  openModal('delete-confirm-modal');
};

async function handleConfirmDelete() {
  if (!memberToDelete) return;

  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.innerHTML = `<span>Menghapus...</span>`;

  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/members/${memberToDelete.student_id}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      showToast(`Anggota ${memberToDelete.full_name} berhasil dihapus!`, 'success');
      closeModal('delete-confirm-modal');
      memberToDelete = null;
      await fetchMembersFromBackend();
    } else {
      const err = await res.json();
      showToast(`Gagal menghapus anggota: ${err.detail || 'Terjadi kesalahan'}`, 'error');
    }
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="trash-2" class="w-3.5 h-3.5"></i><span>Hapus</span>`;
    initIcons();
  }
}

// ==================== 4. MANAGE ERP ACCESS ====================
window.openManageERP = function (studentId) {
  const m = activeMembersList.find((item) => String(item.student_id) === String(studentId));
  if (!m) return;

  document.getElementById('erp-target-identifier').value = m.student_id;
  document.getElementById('erp-target-name').textContent = m.full_name;
  document.getElementById('erp-target-nim').textContent = `${m.student_id} • ${m.role} ${m.division ? `(${m.division})` : ''}`;
  document.getElementById('erp-modal-password').value = '';

  const badgeContainer = document.getElementById('erp-current-status-badge');
  const revokeBtn = document.getElementById('btn-revoke-erp-direct');
  const pwdLabel = document.getElementById('erp-modal-pwd-label');
  const saveLabel = document.getElementById('btn-save-erp-label');
  const roleSelect = document.getElementById('erp-modal-role');

  if (m.has_erp_access) {
    badgeContainer.innerHTML = `<span class="badge-status bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px]"><i data-lucide="shield-check" class="w-3 h-3 mr-1 inline"></i>Akses ERP Aktif (${m.user_role || 'PENGURUS'})</span>`;
    revokeBtn?.classList.remove('hidden');
    pwdLabel.textContent = 'Reset Password Akun';
    saveLabel.textContent = 'Perbarui Password';
    if (roleSelect) roleSelect.value = m.user_role || 'PENGURUS';
  } else {
    badgeContainer.innerHTML = `<span class="badge-status bg-gray-500/20 text-gray-300 border-gray-500/40 text-[11px]">Belum Memiliki Akses ERP</span>`;
    revokeBtn?.classList.add('hidden');
    pwdLabel.textContent = 'Set Password Awal';
    saveLabel.textContent = 'Aktifkan Akses';
    if (roleSelect) roleSelect.value = 'PENGURUS';
  }

  openModal('manage-erp-modal');
  initIcons();
};

async function handleSaveERP() {
  const identifier = document.getElementById('erp-target-identifier').value;
  const password = document.getElementById('erp-modal-password').value.trim();
  const role = document.getElementById('erp-modal-role').value;
  const m = activeMembersList.find((item) => String(item.student_id) === String(identifier));

  if (!password) {
    showToast('Password harus diisi (minimal 8 karakter)!', 'error');
    return;
  }
  if (password.length < 8) {
    showToast('Password terlalu pendek (minimal 8 karakter)!', 'error');
    return;
  }

  const saveBtn = document.getElementById('btn-save-erp-modal');
  saveBtn.disabled = true;

  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res;
    if (m && m.has_erp_access) {
      res = await fetch(`${API_BASE_URL}/members/${identifier}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ new_password: password }),
      });
    } else {
      res = await fetch(`${API_BASE_URL}/members/${identifier}/access`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password, role }),
      });
    }

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || 'Hak akses ERP berhasil diperbarui!', 'success');
      closeModal('manage-erp-modal');
      await fetchMembersFromBackend();
    } else {
      const err = await res.json();
      showToast(`Gagal: ${err.detail || 'Terjadi kesalahan'}`, 'error');
    }
  } catch (e) {
    showToast(`Error koneksi: ${e.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleRevokeERP() {
  const identifier = document.getElementById('erp-target-identifier').value;
  const m = activeMembersList.find((item) => String(item.student_id) === String(identifier));
  const name = m ? m.full_name : identifier;

  if (!confirm(`Apakah Anda yakin ingin mencabut hak akses login ERP untuk ${name}? Akun pengurus ini tidak akan bisa login lagi.`)) {
    return;
  }

  const revokeBtn = document.getElementById('btn-revoke-erp-direct');
  revokeBtn.disabled = true;

  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/members/${identifier}/access`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || 'Akses ERP berhasil dicabut!', 'success');
      closeModal('manage-erp-modal');
      await fetchMembersFromBackend();
    } else {
      const err = await res.json();
      showToast(`Gagal mencabut akses: ${err.detail || 'Terjadi kesalahan'}`, 'error');
    }
  } catch (e) {
    showToast(`Error koneksi: ${e.message}`, 'error');
  } finally {
    revokeBtn.disabled = false;
  }
}

// ==================== 5. IMPORT EXCEL ====================
function openImportExcelModal() {
  selectedExcelFile = null;
  const fileInput = document.getElementById('excel-file-input');
  if (fileInput) fileInput.value = '';

  const fileNameLabel = document.getElementById('selected-file-name');
  if (fileNameLabel) {
    fileNameLabel.textContent = '';
    fileNameLabel.classList.add('hidden');
  }

  const submitBtn = document.getElementById('btn-submit-import');
  if (submitBtn) submitBtn.disabled = true;

  openModal('import-excel-modal');
}

function handleExcelFileSelect(file) {
  if (!file) return;
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    showToast('Format file harus berupa Excel (.xlsx atau .xls)', 'error');
    return;
  }

  selectedExcelFile = file;
  const fileNameLabel = document.getElementById('selected-file-name');
  if (fileNameLabel) {
    fileNameLabel.textContent = `File terpilih: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileNameLabel.classList.remove('hidden');
  }

  const submitBtn = document.getElementById('btn-submit-import');
  if (submitBtn) submitBtn.disabled = false;
}

async function handleImportExcelSubmit(e) {
  e.preventDefault();
  if (!selectedExcelFile) {
    showToast('Pilih file Excel terlebih dahulu!', 'error');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-import');
  const labelEl = document.getElementById('btn-submit-import-label');
  submitBtn.disabled = true;
  labelEl.textContent = 'Memproses Excel...';

  const sheetName = document.getElementById('excel-sheet-name').value.trim() || 'Database Anggota';

  const formData = new FormData();
  formData.append('file', selectedExcelFile);

  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE_URL}/members/import-excel?sheet_name=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      showToast(
        `Berhasil mengimpor ${data.imported_count || data.count || ''} data anggota.`,
        'success'
      );
      closeModal('import-excel-modal');
      await fetchMembersFromBackend();
    } else {
      const err = await res.json();
      showToast(`Gagal import Excel: ${err.detail || 'Terjadi kesalahan format sheet'}`, 'error');
    }
  } catch (error) {
    showToast(`Error import: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    labelEl.textContent = 'Upload & Proses';
  }
}

// ==================== MODAL HELPERS ====================
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  initIcons();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ==================== DOM INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('members', 'Manajemen Anggota & Alumni');
  fetchMembersFromBackend();
  renderAlumni();

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-toggle-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      tabBtns.forEach((b) => {
        b.className =
          'tab-toggle-btn px-4 py-2 rounded-lg text-xs font-semibold text-[#D8B4FE] hover:text-white hover:bg-white/5 transition-all flex items-center space-x-2';
      });
      btn.className =
        'tab-toggle-btn px-4 py-2 rounded-lg text-xs font-bold bg-[#7C3AED] text-white shadow-md transition-all flex items-center space-x-2';

      tabPanels.forEach((p) => {
        if (p.id === `tab-${tab}`) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      });
    });
  });

  // Auto-detect prodi, angkatan, and email from student_id in Member Form
  const formStudentId = document.getElementById('form-student-id');
  formStudentId?.addEventListener('input', () => {
    const rawNim = (formStudentId.value || '').replace(/\D/g, '');
    formStudentId.value = rawNim;

    const formEmail = document.getElementById('form-email');
    if (rawNim.length > 0 && formEmail && !document.getElementById('form-member-id-hidden').value) {
      formEmail.value = `${rawNim}@mahasiswa.upnvj.ac.id`;
    }

    if (rawNim.length >= 2) {
      const yearPrefix = rawNim.slice(0, 2);
      const fullYear = parseInt(`20${yearPrefix}`, 10);
      const currentYear = new Date().getFullYear() || 2026;
      const formIntake = document.getElementById('form-intake');
      if (formIntake && !formIntake.value && fullYear >= 2000 && fullYear <= currentYear) {
        formIntake.value = String(fullYear);
      }
    }

    if (rawNim.length >= 7) {
      const prodiCode = rawNim.slice(4, 7);
      const formProdi = document.getElementById('form-prodi');
      if (formProdi) {
        if (prodiCode === '510') formProdi.value = 'S1 Sistem Informasi';
        else if (prodiCode === '511') formProdi.value = 'S1 Informatika';
        else if (prodiCode === '512') formProdi.value = 'D3 Sistem Informasi';
        else if (prodiCode === '513') formProdi.value = 'S1 Sains Data';
      }
    }
  });

  // Filters
  document.getElementById('search-member-input')?.addEventListener('input', applyFilter);
  document.getElementById('filter-member-divisi')?.addEventListener('change', applyFilter);
  document.getElementById('filter-member-track')?.addEventListener('change', applyFilter);

  document.getElementById('search-alumni-input')?.addEventListener('input', (e) => {
    renderAlumni(e.target.value);
  });

  // Action Buttons
  document
    .getElementById('btn-open-create-member')
    ?.addEventListener('click', window.openCreateMember);
  document
    .getElementById('btn-open-import-excel')
    ?.addEventListener('click', openImportExcelModal);

  // Form Submissions
  document.getElementById('member-form')?.addEventListener('submit', handleMemberFormSubmit);
  document
    .getElementById('btn-cancel-member-form')
    ?.addEventListener('click', () => closeModal('member-form-modal'));
  document
    .getElementById('close-form-modal')
    ?.addEventListener('click', () => closeModal('member-form-modal'));

  // Delete Handlers
  document
    .getElementById('btn-confirm-delete')
    ?.addEventListener('click', handleConfirmDelete);
  document
    .getElementById('btn-cancel-delete')
    ?.addEventListener('click', () => closeModal('delete-confirm-modal'));

  // Profile Modal Close Handlers
  document
    .getElementById('close-profile-modal')
    ?.addEventListener('click', () => closeModal('member-profile-modal'));
  document
    .getElementById('close-profile-modal-btn')
    ?.addEventListener('click', () => closeModal('member-profile-modal'));

  // Import Excel Handlers
  const dropzone = document.getElementById('excel-dropzone');
  const fileInput = document.getElementById('excel-file-input');

  dropzone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleExcelFileSelect(e.target.files[0]);
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-[#A78BFA]', 'bg-[#7C3AED]/10');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-[#A78BFA]', 'bg-[#7C3AED]/10');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-[#A78BFA]', 'bg-[#7C3AED]/10');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFileSelect(e.dataTransfer.files[0]);
    }
  });

  document
    .getElementById('import-excel-form')
    ?.addEventListener('submit', handleImportExcelSubmit);
  document
    .getElementById('close-import-modal')
    ?.addEventListener('click', () => closeModal('import-excel-modal'));
  document
    .getElementById('btn-cancel-import')
    ?.addEventListener('click', () => closeModal('import-excel-modal'));
  // ERP Access Controls & Alumni Handlers
  document.getElementById('form-erp-access-toggle')?.addEventListener('change', (e) => {
    const fields = document.getElementById('erp-access-fields');
    if (e.target.checked) {
      fields?.classList.remove('hidden');
    } else {
      fields?.classList.add('hidden');
    }
  });

  document.getElementById('btn-make-alumni')?.addEventListener('click', () => {
    const name = document.getElementById('form-full-name')?.value || 'Anggota ini';
    if (!confirm(`Apakah Anda yakin ingin mengubah status ${name} menjadi Alumni? Tindakan ini akan otomatis mencabut hak akses login ERP.`)) {
      return;
    }
    const statusSelect = document.getElementById('form-status');
    if (statusSelect) statusSelect.value = 'Alumni';
    const erpToggle = document.getElementById('form-erp-access-toggle');
    if (erpToggle) erpToggle.checked = false;
    document.getElementById('erp-access-fields')?.classList.add('hidden');

    const form = document.getElementById('member-form');
    if (form) {
      form.requestSubmit();
    }
  });

  document
    .getElementById('close-erp-modal')
    ?.addEventListener('click', () => closeModal('manage-erp-modal'));
  document
    .getElementById('btn-cancel-erp-modal')
    ?.addEventListener('click', () => closeModal('manage-erp-modal'));
  document
    .getElementById('btn-save-erp-modal')
    ?.addEventListener('click', handleSaveERP);
  document
    .getElementById('btn-revoke-erp-direct')
    ?.addEventListener('click', handleRevokeERP);

  // Export CSV
  document.getElementById('btn-export-member')?.addEventListener('click', () => {
    if (!activeMembersList.length) {
      showToast('Tidak ada data anggota untuk diekspor.', 'error');
      return;
    }
    let csv =
      'Member ID,NIM,Nama Lengkap,Program Studi,Semester,Email,No WhatsApp,Domisili,Divisi,Role,Angkatan,Bidang Riset,Status\n';
    activeMembersList.forEach((m) => {
      const tracksStr = (m.interest_track || []).join('; ');
      csv += `"${m.member_id || ''}","${m.student_id || ''}","${m.full_name || ''}","${m.program_of_study || ''}","${m.semester || ''}","${m.email || ''}","${m.contact_info || ''}","${m.domicile_city || ''}","${m.division || ''}","${m.role || ''}","${m.intake_period || ''}","${tracksStr}","${m.status || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute(
      'download',
      `data_anggota_ksm_aiot_${new Date().toISOString().slice(0, 10)}.csv`
    );
    a.click();
    showToast(`Berhasil mengekspor ${activeMembersList.length} data anggota!`, 'success');
  });
});
