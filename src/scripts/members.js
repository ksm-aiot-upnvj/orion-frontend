import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons } from '../modules/ui.js';
import { getAuthToken } from '../modules/auth.js';
import { initialAlumniData } from '../modules/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let activeMembersList = [];
let alumniList = [...initialAlumniData];

async function fetchMembersFromBackend() {
  const tbody = document.getElementById('active-members-tbody');
  try {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/members/`, { headers });
    
    if (res.ok) {
      activeMembersList = await res.json();
    } else {
      console.warn('API /members/ returned error, activeMembersList is empty.');
      activeMembersList = [];
    }
  } catch (err) {
    console.error('Failed to fetch members from backend:', err);
    activeMembersList = [];
  }

  // Update Tab and Header Counters
  const tabLabel = document.getElementById('active-members-tab-label');
  if (tabLabel) {
    tabLabel.textContent = `Anggota Aktif (${activeMembersList.length})`;
  }

  renderActiveMembers();
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
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-500 font-mono whitespace-nowrap">Tidak ada data anggota yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => `
    <tr class="hover:bg-slate-900/60 transition-colors whitespace-nowrap">
      <td class="py-4 px-5 font-bold text-white whitespace-nowrap">${m.full_name}</td>
      <td class="py-4 px-5 font-mono text-aiot-cyan whitespace-nowrap">${m.student_id}</td>
      <td class="py-4 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">${m.email}</td>
      <td class="py-4 px-5 whitespace-nowrap">
        <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap ${
          m.division === 'BPH' ? 'bg-cyan-950 text-aiot-cyan border border-cyan-800' :
          m.division === 'Akademik & Riset' ? 'bg-cyan-950/60 text-aiot-cyan border border-cyan-800/60' :
          m.division === 'Pengembangan SDM' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
          'bg-pink-950 text-aiot-pink border border-pink-800'
        }">${m.role || 'Anggota'}</span>
      </td>
      <td class="py-4 px-5 font-mono font-semibold whitespace-nowrap">${m.intake_period || '2026'}</td>
      <td class="py-4 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">${m.join_date || '15/01/2026'}</td>
      <td class="py-4 px-5 whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 whitespace-nowrap">${m.status || 'Aktif'}</span>
      </td>
      <td class="py-4 px-5 text-center whitespace-nowrap">
        <button onclick="window.showMemberDetail('${m.student_id}')" 
          class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700 whitespace-nowrap">
          Detail
        </button>
      </td>
    </tr>
  `).join('');

  initIcons();
}

function renderAlumni(careerCategory = 'all') {
  const grid = document.getElementById('alumni-grid');
  if (!grid) return;

  const filtered = careerCategory === 'all' 
    ? alumniList 
    : alumniList.filter(a => a.category === careerCategory);

  grid.innerHTML = filtered.map(a => `
    <div class="glass-panel p-6 rounded-3xl border border-slate-800/90 flex flex-col justify-between hover:border-aiot-cyan/50 hover:shadow-2xl transition-all duration-300 group">
      <div>
        <div class="flex items-start space-x-4 mb-4">
          <div class="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 shadow-md bg-slate-900 flex-shrink-0 group-hover:scale-105 transition-transform">
            <img src="${a.photo}" alt="${a.name}" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-base font-bold text-white truncate">${a.name}</h4>
            <p class="text-xs text-aiot-cyan font-mono font-semibold">${a.currentRole}</p>
            <p class="text-xs text-slate-400 font-mono truncate mt-0.5">${a.company}</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 my-4">
          <span class="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">Riset & Portofolio saat di KSM AIoT:</span>
          <p class="text-xs text-slate-200 font-mono italic leading-relaxed">"${a.project}"</p>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
        <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">Alumni ${a.angkatan}</span>
        <a href="${a.linkedin}" target="_blank" class="text-aiot-cyan hover:underline flex items-center space-x-1.5 font-medium">
          <span>LinkedIn</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
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

  const searchInput = document.getElementById('search-member-input');
  const divSelect = document.getElementById('filter-member-divisi');
  const angSelect = document.getElementById('filter-member-angkatan');

  function applyFilter() {
    renderActiveMembers(searchInput.value, divSelect.value, angSelect.value);
  }

  searchInput?.addEventListener('input', applyFilter);
  divSelect?.addEventListener('change', applyFilter);
  angSelect?.addEventListener('change', applyFilter);

  document.getElementById('filter-alumni-career')?.addEventListener('change', (e) => {
    renderAlumni(e.target.value);
  });

  document.getElementById('btn-export-member')?.addEventListener('click', () => {
    if (!activeMembersList.length) {
      showToast('Tidak ada data anggota untuk diekspor.', 'error');
      return;
    }
    let csv = 'Member ID,Nama,NIM,Program Studi,Semester,Email,No WhatsApp,Domisili,Divisi,Role,Angkatan,Tanggal Masuk,Status\n';
    activeMembersList.forEach(m => {
      csv += `"${m.member_id || ''}","${m.full_name || ''}","${m.student_id || ''}","${m.program_of_study || ''}","${m.semester || ''}","${m.email || ''}","${m.contact_info || ''}","${m.domicile_city || ''}","${m.division || ''}","${m.role || ''}","${m.intake_period || ''}","${m.join_date || ''}","${m.status || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `data_anggota_ksm_aiot_backend_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
    showToast(`Berhasil mengekspor ${activeMembersList.length} data anggota dari database!`, 'success');
  });

  const tabBtns = document.querySelectorAll('.tab-toggle-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach(b => {
        b.className = 'tab-toggle-btn px-5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all text-slate-400 hover:text-white whitespace-nowrap';
      });
      btn.className = 'tab-toggle-btn px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all bg-aiot-cyan text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] whitespace-nowrap';

      tabPanels.forEach(p => {
        if (p.id === `tab-${target}`) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      });
      initIcons();
    });
  });

  // Member Detail Modal Handlers
  const memberModal = document.getElementById('member-detail-modal');
  const closeMemberModal = () => {
    memberModal?.classList.add('hidden');
    memberModal?.classList.remove('flex');
  };

  document.getElementById('close-member-modal')?.addEventListener('click', closeMemberModal);
  document.getElementById('btn-close-member-modal-footer')?.addEventListener('click', closeMemberModal);
  memberModal?.addEventListener('click', (e) => {
    if (e.target === memberModal) closeMemberModal();
  });
});

window.showMemberDetail = function(nim) {
  const m = activeMembersList.find(member => member.student_id === nim);
  if (!m) return;

  const modal = document.getElementById('member-detail-modal');
  if (!modal) return;

  const initials = (m.full_name || 'AI').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatar = document.getElementById('modal-member-avatar');
  if (avatar) avatar.textContent = initials;

  document.getElementById('modal-member-name').textContent = m.full_name || '-';
  document.getElementById('modal-member-nim').textContent = `NIM: ${m.student_id}`;
  document.getElementById('modal-member-prodi').textContent = m.program_of_study || '-';
  document.getElementById('modal-member-id-badge').textContent = m.member_id || 'AIOT-MEMBER';
  document.getElementById('modal-member-division').textContent = m.division || '-';
  document.getElementById('modal-member-angkatan').textContent = `Tahun Masuk ${m.intake_period || '2026'}`;
  document.getElementById('modal-member-domisili').textContent = `Semester ${m.semester || '-'} • ${m.domicile_city || 'Jakarta'}`;
  document.getElementById('modal-member-contact').textContent = m.contact_info || '-';
  document.getElementById('modal-member-email').textContent = m.email || '-';
  document.getElementById('modal-member-expertise').textContent = `${m.focus_expertise || m.interest_track || '-'} (Eksplorasi: ${m.exploration_field || '-'})`;
  document.getElementById('modal-member-tools').textContent = `Bahasa: ${m.programming_languages || '-'} | Tools: ${m.tools_frameworks || '-'}`;
  document.getElementById('modal-member-project').textContent = m.project_experience || '-';
  document.getElementById('modal-member-discord').textContent = m.discord_id ? `@${m.discord_id}` : '-';
  document.getElementById('modal-member-status').textContent = m.status || 'Aktif';

  const portBox = document.getElementById('modal-member-portfolio-box');
  const portLink = document.getElementById('modal-member-portfolio');
  const portText = document.getElementById('modal-member-portfolio-text');
  if (m.portfolio_url && m.portfolio_url !== '-') {
    portBox?.classList.remove('hidden');
    if (portLink) portLink.href = m.portfolio_url.startsWith('http') ? m.portfolio_url : `https://${m.portfolio_url}`;
    if (portText) portText.textContent = m.portfolio_url;
  } else {
    if (portText) portText.textContent = 'Tidak dicantumkan';
    if (portLink) portLink.removeAttribute('href');
  }

  const roleBadge = document.getElementById('modal-member-role-badge');
  if (roleBadge) {
    roleBadge.textContent = m.role || 'Anggota';
    roleBadge.className = `inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
      m.division === 'BPH' ? 'bg-cyan-950 text-aiot-cyan border border-cyan-800' :
      m.division === 'Akademik & Riset' ? 'bg-cyan-950/60 text-aiot-cyan border border-cyan-800/60' :
      m.division === 'Pengembangan SDM' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
      'bg-pink-950 text-aiot-pink border border-pink-800'
    }`;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  initIcons();
};
