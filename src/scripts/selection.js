import { initIcons, showToast } from '../modules/ui.js';
import { initCRMLayout } from '../modules/crm-layout.js';
import { getAuthToken } from '../modules/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let registrationsList = [];
let selectedReg = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Unified CRM Layout (with Auth Route Guard)
  initCRMLayout('selection', 'Seleksi Calon Anggota');

  // DOM Elements
  const tbody = document.getElementById('admin-registrations-tbody');
  const searchInput = document.getElementById('admin-search-reg');
  const filterStatusSelect = document.getElementById('admin-filter-status');

  // Stats Elements
  const statTotal = document.getElementById('stat-total-reg');
  const statPending = document.getElementById('stat-pending-reg');
  const statApproved = document.getElementById('stat-approved-reg');
  const statRejected = document.getElementById('stat-rejected-reg');

  // Modal Elements
  const modal = document.getElementById('admin-review-modal');
  const closeModalBtn = document.getElementById('close-admin-modal');
  const closeFooterBtn = document.getElementById('btn-modal-close-footer');
  const btnApprove = document.getElementById('btn-action-approve');
  const btnReject = document.getElementById('btn-action-reject');

  const modalPhoto = document.getElementById('modal-review-photo');
  const modalName = document.getElementById('modal-review-name');
  const modalNim = document.getElementById('modal-review-nim');
  const modalProdi = document.getElementById('modal-review-prodi');
  const modalAngkatan = document.getElementById('modal-review-angkatan');
  const modalEmail = document.getElementById('modal-review-email');
  const modalPhone = document.getElementById('modal-review-phone');
  const modalTrack = document.getElementById('modal-review-track');
  const modalMotivation = document.getElementById('modal-review-motivation');
  const modalStatusBadge = document.getElementById('modal-review-status-badge');
  const modalMemberIdBox = document.getElementById('modal-review-memberid-box');
  const modalMemberId = document.getElementById('modal-review-memberid');

  // Load Registrations from Backend
  async function loadRegistrations() {
    try {
      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/registrations`, { headers });
      if (res.ok) {
        registrationsList = await res.json();
      } else {
        registrationsList = getFallbackRegistrations();
      }
    } catch {
      registrationsList = getFallbackRegistrations();
    }
    renderStats();
    renderTable();
  }

  function getFallbackRegistrations() {
    return [
      {
        id: "01a04935-6481-7499-ab68-33b12fe06966",
        student_id: "2410511088",
        full_name: "Ahmad Rizky Pratama",
        program_of_study: "S1 Informatika",
        email: "ahmad.rizky@mahasiswa.upnvj.ac.id",
        contact_info: "0812-7788-9900",
        intake_period: "2024",
        interest_track: "Artificial Intelligence & ML",
        motivation: "Tertarik mendalami riset TinyML pada mikrokontroler ESP32 untuk proyek Smart Agriculture.",
        photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
        status: "PENDING",
        submit_date: "28/08/2026"
      },
      {
        id: "01a04935-6481-7499-ab68-33b2d4b74d53",
        student_id: "2410512014",
        full_name: "Siti Nurhaliza",
        program_of_study: "S1 Sistem Informasi",
        email: "siti.nurhaliza@mahasiswa.upnvj.ac.id",
        contact_info: "0819-3344-5566",
        intake_period: "2024",
        interest_track: "Internet of Things & Robotics",
        motivation: "Ingin berkolaborasi membuat sistem monitoring kualitas udara berbasis LoRaWAN di lingkungan kampus.",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
        status: "PENDING",
        submit_date: "28/08/2026"
      }
    ];
  }

  function renderStats() {
    const total = registrationsList.length;
    const pending = registrationsList.filter(r => r.status === 'PENDING').length;
    const approved = registrationsList.filter(r => r.status === 'APPROVED').length;
    const rejected = registrationsList.filter(r => r.status === 'REJECTED').length;

    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statApproved) statApproved.textContent = approved;
    if (statRejected) statRejected.textContent = rejected;
  }

  function renderTable() {
    if (!tbody) return;
    const search = searchInput?.value.toLowerCase().trim() || '';
    const statusFilter = filterStatusSelect?.value || 'all';

    const filtered = registrationsList.filter(r => {
      const matchSearch = r.full_name.toLowerCase().includes(search) || r.student_id.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-12 text-slate-500 font-mono text-xs">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
            <span>Tidak ada berkas calon anggota yang cocok dengan filter.</span>
          </td>
        </tr>
      `;
      initIcons();
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      let statusBadge = '';
      if (r.status === 'APPROVED') {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center space-x-1 inline-flex"><i data-lucide="check" class="w-3 h-3"></i><span>APPROVED</span></span>`;
      } else if (r.status === 'REJECTED') {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-mono bg-red-950 text-red-400 border border-red-800 font-bold flex items-center space-x-1 inline-flex"><i data-lucide="x" class="w-3 h-3"></i><span>REJECTED</span></span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center space-x-1 inline-flex"><i data-lucide="clock" class="w-3 h-3"></i><span>PENDING</span></span>`;
      }

      const photoSrc = r.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

      return `
        <tr class="hover:bg-slate-900/60 transition-colors">
          <td class="py-3.5 px-5 font-semibold text-white">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 shadow-sm">
                <img src="${photoSrc}" alt="${r.full_name}" class="w-full h-full object-cover" />
              </div>
              <span class="truncate max-w-[180px]">${r.full_name}</span>
            </div>
          </td>
          <td class="py-3.5 px-5 font-mono text-aiot-cyan">${r.student_id}</td>
          <td class="py-3.5 px-5 text-slate-300">${r.program_of_study}</td>
          <td class="py-3.5 px-5 text-slate-300">
            <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">${r.interest_track}</span>
          </td>
          <td class="py-3.5 px-5 font-mono text-slate-400 text-[11px]">${r.email}</td>
          <td class="py-3.5 px-5 font-mono text-slate-400">${r.submit_date || '-'}</td>
          <td class="py-3.5 px-5">${statusBadge}</td>
          <td class="py-3.5 px-5 text-center">
            <button type="button" data-reg-id="${r.id}" class="btn-open-review px-3 py-1.5 rounded-xl bg-aiot-cyan/15 hover:bg-aiot-cyan/25 text-aiot-cyan border border-aiot-cyan/30 text-xs font-mono font-bold transition-all shadow-sm flex items-center space-x-1 mx-auto">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>Review</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    initIcons();

    // Bind Review Modal Triggers
    document.querySelectorAll('.btn-open-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const regId = btn.getAttribute('data-reg-id');
        openReviewModal(regId);
      });
    });
  }

  // Open & Populate Review Modal
  function openReviewModal(regId) {
    selectedReg = registrationsList.find(r => String(r.id) === String(regId));
    if (!selectedReg) return;

    if (modalPhoto) modalPhoto.src = selectedReg.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';
    if (modalName) modalName.textContent = selectedReg.full_name;
    if (modalNim) modalNim.textContent = selectedReg.student_id;
    if (modalProdi) modalProdi.textContent = selectedReg.program_of_study;
    if (modalAngkatan) modalAngkatan.textContent = `Angkatan ${selectedReg.intake_period || '2024'}`;
    if (modalEmail) modalEmail.textContent = selectedReg.email;
    if (modalPhone) modalPhone.textContent = selectedReg.contact_info || '-';
    if (modalTrack) modalTrack.textContent = selectedReg.interest_track;
    if (modalMotivation) modalMotivation.textContent = `"${selectedReg.motivation || 'Tidak ada catatan motivasi.'}"`;

    if (modalStatusBadge) {
      if (selectedReg.status === 'APPROVED') {
        modalStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex-shrink-0';
        modalStatusBadge.textContent = 'APPROVED';
      } else if (selectedReg.status === 'REJECTED') {
        modalStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-950 text-red-400 border border-red-800 flex-shrink-0';
        modalStatusBadge.textContent = 'REJECTED';
      } else {
        modalStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-950 text-amber-300 border border-amber-800 flex-shrink-0';
        modalStatusBadge.textContent = 'PENDING';
      }
    }

    if (modalMemberIdBox) {
      if (selectedReg.status === 'APPROVED' && selectedReg.member_id) {
        modalMemberIdBox.classList.remove('hidden');
        if (modalMemberId) modalMemberId.textContent = selectedReg.member_id;
      } else {
        modalMemberIdBox.classList.add('hidden');
      }
    }

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  }

  function closeReviewModal() {
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    selectedReg = null;
  }

  closeModalBtn?.addEventListener('click', closeReviewModal);
  closeFooterBtn?.addEventListener('click', closeReviewModal);

  // Decision Action: Approve Candidate
  btnApprove?.addEventListener('click', async () => {
    if (!selectedReg) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE_URL}/registrations/${selectedReg.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const updated = await res.json();
        selectedReg.status = 'APPROVED';
        selectedReg.member_id = updated.member_id;
        showToast(`Berkas ${selectedReg.full_name} Disetujui! Member ID: ${updated.member_id} terbit.`, 'success');
      } else {
        selectedReg.status = 'APPROVED';
        selectedReg.member_id = `AIOT-2026-00${registrationsList.length + 1}`;
        showToast(`Berkas ${selectedReg.full_name} Disetujui!`, 'success');
      }
    } catch {
      selectedReg.status = 'APPROVED';
      selectedReg.member_id = `AIOT-2026-00${registrationsList.length + 1}`;
      showToast(`Berkas ${selectedReg.full_name} Disetujui!`, 'success');
    }

    closeReviewModal();
    renderStats();
    renderTable();
  });

  // Decision Action: Reject Candidate
  btnReject?.addEventListener('click', async () => {
    if (!selectedReg) return;
    const token = getAuthToken();

    try {
      await fetch(`${API_BASE_URL}/registrations/${selectedReg.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch {
      // offline fallback
    }

    selectedReg.status = 'REJECTED';
    showToast(`Berkas ${selectedReg.full_name} ditolak.`, 'error');
    closeReviewModal();
    renderStats();
    renderTable();
  });

  // Search & Filter Listeners
  searchInput?.addEventListener('input', renderTable);
  filterStatusSelect?.addEventListener('change', renderTable);

  // Load Data
  loadRegistrations();
});
