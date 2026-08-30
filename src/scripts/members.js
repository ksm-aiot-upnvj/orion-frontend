import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons } from '../modules/ui.js';
import { getAuthToken } from '../modules/auth.js';
import { initialAlumniData } from '../modules/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let activeMembersList = [];
let alumniList = [...initialAlumniData];

async function fetchMembersFromBackend() {
  try {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
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

  renderActiveMembers();
}

function getFallbackMembers() {
  return [
    {
      student_id: '2310511001',
      full_name: 'Dzulfikri Adjmal',
      email: 'dzulfikri.adjmal@mahasiswa.upnvj.ac.id',
      division: 'BPH',
      role: 'Ketua KSM AIoT',
      intake_period: '2023',
      join_date: '10/01/2024',
      status: 'Aktif'
    },
    {
      student_id: '2310511002',
      full_name: 'Adinda Rizki Sya\'bana Diva',
      email: 'adinda.syabana@mahasiswa.upnvj.ac.id',
      division: 'BPH',
      role: 'Wakil Ketua KSM AIoT',
      intake_period: '2023',
      join_date: '10/01/2024',
      status: 'Aktif'
    },
    {
      student_id: '2310511015',
      full_name: 'Rahman Ilyas Al-Kahfi',
      email: 'rahman.ilyas@mahasiswa.upnvj.ac.id',
      division: 'Akademik & Riset',
      role: 'Kepala Divisi Riset',
      intake_period: '2023',
      join_date: '15/01/2024',
      status: 'Aktif'
    },
    {
      student_id: '2310511020',
      full_name: 'Nicolas Debrito',
      email: 'nicolas.debrito@mahasiswa.upnvj.ac.id',
      division: 'Pengembangan SDM',
      role: 'Kepala Divisi PSDM',
      intake_period: '2023',
      join_date: '15/01/2024',
      status: 'Aktif'
    },
    {
      student_id: '2310511025',
      full_name: 'Yusuf Martinus Arief',
      email: 'yusuf.martinus@mahasiswa.upnvj.ac.id',
      division: 'Humas & Multimedia',
      role: 'Kepala Divisi Humas',
      intake_period: '2023',
      join_date: '15/01/2024',
      status: 'Aktif'
    }
  ];
}

function renderActiveMembers(filterText = '', division = 'all', angkatan = 'all') {
  const tbody = document.getElementById('active-members-tbody');
  if (!tbody) return;

  const filtered = activeMembersList.filter(m => {
    const name = (m.full_name || '').toLowerCase();
    const nim = (m.student_id || '').toLowerCase();
    const div = (m.division || '').toLowerCase();
    const search = filterText.toLowerCase();

    const matchText = name.includes(search) || nim.includes(search) || div.includes(search);
    const matchDiv = division === 'all' || m.division === division;
    const matchAng = angkatan === 'all' || String(m.intake_period) === String(angkatan);
    return matchText && matchDiv && matchAng;
  });

  const countBadge = document.getElementById('member-count-badge');
  if (countBadge) countBadge.textContent = `${filtered.length} Anggota`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-500 font-mono text-xs">Tidak ada data anggota yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => `
    <tr class="hover:bg-[#2d1052] transition-colors">
      <td class="font-medium text-white">${m.full_name}</td>
      <td class="font-mono text-xs font-semibold text-[#C9A4F6]">${m.student_id}</td>
      <td class="text-[#D8B4FE] font-mono text-xs">${m.email}</td>
      <td>
        <span class="badge-status ${m.division === 'BPH' ? 'badge-pending' : 'badge-neutral'} text-[10px]">
          ${m.division} • ${m.role || 'Anggota'}
        </span>
      </td>
      <td class="font-mono font-semibold text-white text-xs">${m.intake_period || '2024'}</td>
      <td class="text-[#D8B4FE] font-mono text-xs">${m.join_date || '15/01/2026'}</td>
      <td>
        <span class="badge-status badge-approved text-[10px]">${m.status || 'Aktif'}</span>
      </td>
      <td class="text-center">
        <button onclick="window.showMemberDetail('${m.student_id}')" 
          class="px-2.5 py-1 rounded-md bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white text-xs font-semibold transition-colors border border-[#561F99]">
          Detail
        </button>
      </td>
    </tr>
  `).join('');

  initIcons();
}

function renderAlumni(searchText = '') {
  const grid = document.getElementById('alumni-grid');
  if (!grid) return;

  const query = searchText.toLowerCase().trim();
  const filtered = alumniList.filter(a => {
    return a.name.toLowerCase().includes(query) ||
           a.company.toLowerCase().includes(query) ||
           a.currentRole.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500 font-mono text-xs">Tidak ada data alumni yang cocok.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => `
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
  `).join('');

  initIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('members', 'Manajemen Anggota & Alumni');
  fetchMembersFromBackend();
  renderAlumni();

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-toggle-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.className = 'tab-toggle-btn px-4 py-1.5 rounded-md text-xs font-semibold text-[#D8B4FE] hover:text-white transition-all';
      });
      btn.className = 'tab-toggle-btn px-4 py-1.5 rounded-md text-xs font-semibold bg-[#9B5CE8] text-white shadow-sm transition-all';

      tabPanels.forEach(p => {
        if (p.id === `tab-${tab}`) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      });
    });
  });

  const searchInput = document.getElementById('search-member-input');
  const divSelect = document.getElementById('filter-member-divisi');
  const angSelect = document.getElementById('filter-member-angkatan');

  function applyFilter() {
    renderActiveMembers(searchInput?.value || '', divSelect?.value || 'all', angSelect?.value || 'all');
  }

  searchInput?.addEventListener('input', applyFilter);
  divSelect?.addEventListener('change', applyFilter);
  angSelect?.addEventListener('change', applyFilter);

  document.getElementById('search-alumni-input')?.addEventListener('input', (e) => {
    renderAlumni(e.target.value);
  });

  document.getElementById('btn-export-member')?.addEventListener('click', () => {
    if (!activeMembersList.length) {
      showToast('Tidak ada data anggota untuk diekspor.', 'error');
      return;
    }
    let csv = 'Member ID,Nama,NIM,Program Studi,Email,Divisi,Role,Angkatan,Tanggal Masuk,Status\n';
    activeMembersList.forEach(m => {
      csv += `"${m.student_id || ''}","${m.full_name || ''}","${m.student_id || ''}","S1 Informatika","${m.email || ''}","${m.division || ''}","${m.role || ''}","${m.intake_period || ''}","${m.join_date || ''}","${m.status || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `data_anggota_ksm_aiot_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
    showToast(`Berhasil mengekspor ${activeMembersList.length} data anggota!`, 'success');
  });

  // Modal Close
  document.getElementById('close-detail-modal')?.addEventListener('click', () => {
    document.getElementById('member-detail-modal')?.classList.add('hidden');
    document.getElementById('member-detail-modal')?.classList.remove('flex');
  });
});

window.showMemberDetail = function(studentId) {
  const m = activeMembersList.find(item => item.student_id === studentId);
  if (!m) return;

  const modal = document.getElementById('member-detail-modal');
  if (!modal) return;

  document.getElementById('detail-member-name').textContent = m.full_name || 'Anggota KSM';
  document.getElementById('detail-member-nim').textContent = m.student_id || '-';
  document.getElementById('detail-member-email').textContent = m.email || '-';
  document.getElementById('detail-member-divisi').textContent = `${m.division} (${m.role || 'Anggota'})`;
  document.getElementById('detail-member-angkatan').textContent = `Angkatan ${m.intake_period || '2024'}`;
  document.getElementById('detail-member-status').textContent = m.status || 'Aktif';

  const photoEl = document.getElementById('detail-member-photo');
  if (photoEl) {
    photoEl.src = m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  initIcons();
};
