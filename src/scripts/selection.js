import { initIcons, showToast } from '../modules/ui.js';
import { initCRMLayout } from '../modules/crm-layout.js';
import { getAuthToken, getAuthUser } from '../modules/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let registrationsList = [];
let selectedReg = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Unified CRM Layout (with Auth Route Guard)
  initCRMLayout('selection', 'Seleksi Calon Anggota');

  // RBAC Check for BPH Intake Control Button
  const currentUser = getAuthUser() || { role: 'SUPERADMIN' };
  const isBPH = currentUser.role === 'SUPERADMIN' || currentUser.role === 'ADMIN_BPH';

  const intakeBtn = document.getElementById('open-intake-control-btn');
  const intakeModal = document.getElementById('intake-control-modal');
  const closeIntakeModalBtn = document.getElementById('close-intake-modal');
  const intakeForm = document.getElementById('intake-control-form');
  const intakeStatusSelect = document.getElementById('intake-status-select');
  const intakeBatchInput = document.getElementById('intake-batch-name');
  const intakeDeadlineInput = document.getElementById('intake-deadline-date');
  const intakeQuotaInput = document.getElementById('intake-quota');
  const intakePill = document.getElementById('intake-status-pill');

  // Load Saved Intake Config
  let currentIntakeConfig = {
    status: 'OPEN',
    batchName: 'Penerimaan Anggota Baru Periode 2026',
    deadline: '31 Agustus 2026',
    quota: 100
  };

  try {
    const rawConfig = localStorage.getItem('ksm_intake_config');
    if (rawConfig) currentIntakeConfig = { ...currentIntakeConfig, ...JSON.parse(rawConfig) };
  } catch {}

  function updateIntakePill() {
    if (!intakePill) return;
    if (currentIntakeConfig.status === 'OPEN') {
      intakePill.className = 'badge-status badge-approved text-[10px]';
      intakePill.innerHTML = `<i data-lucide="unlock" class="w-3 h-3"></i><span>Intake: OPEN (${currentIntakeConfig.deadline})</span>`;
    } else {
      intakePill.className = 'badge-status badge-danger text-[10px]';
      intakePill.innerHTML = `<i data-lucide="lock" class="w-3 h-3"></i><span>Intake: CLOSED</span>`;
    }
    initIcons();
  }
  updateIntakePill();

  if (isBPH && intakeBtn) {
    intakeBtn.classList.remove('hidden');
    intakeBtn.classList.add('inline-flex');

    intakeBtn.addEventListener('click', () => {
      if (intakeStatusSelect) intakeStatusSelect.value = currentIntakeConfig.status;
      if (intakeBatchInput) intakeBatchInput.value = currentIntakeConfig.batchName;
      if (intakeDeadlineInput) intakeDeadlineInput.value = currentIntakeConfig.deadline;
      if (intakeQuotaInput) intakeQuotaInput.value = currentIntakeConfig.quota;

      intakeModal?.classList.remove('hidden');
      intakeModal?.classList.add('flex');
    });

    closeIntakeModalBtn?.addEventListener('click', () => {
      intakeModal?.classList.add('hidden');
      intakeModal?.classList.remove('flex');
    });

    intakeForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      currentIntakeConfig = {
        status: intakeStatusSelect?.value || 'OPEN',
        batchName: intakeBatchInput?.value.trim() || 'Penerimaan Anggota Baru Periode 2026',
        deadline: intakeDeadlineInput?.value.trim() || '31 Agustus 2026',
        quota: Number(intakeQuotaInput?.value) || 100
      };

      localStorage.setItem('ksm_intake_config', JSON.stringify(currentIntakeConfig));
      updateIntakePill();
      intakeModal?.classList.add('hidden');
      intakeModal?.classList.remove('flex');
      showToast(`Pengaturan Periode berhasil disimpan! Status: ${currentIntakeConfig.status}`, 'success');
    });
  }

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
  const btnApprove = document.getElementById('btn-decision-approve');
  const btnReject = document.getElementById('btn-decision-reject');

  const modalPhoto = document.getElementById('modal-review-photo');
  const modalName = document.getElementById('modal-review-name');
  const modalNim = document.getElementById('modal-review-nim');
  const modalProdi = document.getElementById('modal-review-prodi');
  const modalTrack = document.getElementById('modal-review-track');
  const modalMotivation = document.getElementById('modal-review-motivation');
  const modalPortfolio = document.getElementById('modal-review-portfolio');
  const modalStatusBadge = document.getElementById('modal-review-status-badge');

  // Load Registrations directly from Database
  async function loadRegistrations() {
    try {
      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/registrations/`, { headers });
      if (res.ok) {
        registrationsList = await res.json();
      } else {
        const err = await res.json().catch(() => ({}));
        registrationsList = [];
        console.warn('Backend returned error for registrations:', err);
      }
    } catch (err) {
      console.error('Database connection error:', err);
      registrationsList = [];
      showToast('Koneksi ke database gagal. Pastikan backend aktif!', 'error');
    }
    renderStats();
    renderTable();
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
      const matchSearch = (r.full_name || '').toLowerCase().includes(search) || (r.student_id || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-10 text-gray-500 font-mono text-xs">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
            <span>Belum ada berkas calon anggota yang terdaftar di database.</span>
          </td>
        </tr>
      `;
      initIcons();
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      let statusBadge = '';
      if (r.status === 'APPROVED') {
        statusBadge = `<span class="badge-status badge-approved text-[11px]"><i data-lucide="check" class="w-3 h-3"></i><span>APPROVED</span></span>`;
      } else if (r.status === 'REJECTED') {
        statusBadge = `<span class="badge-status badge-danger text-[11px]"><i data-lucide="x" class="w-3 h-3"></i><span>REJECTED</span></span>`;
      } else {
        statusBadge = `<span class="badge-status badge-pending text-[11px]"><i data-lucide="clock" class="w-3 h-3"></i><span>PENDING</span></span>`;
      }

      const photoSrc = r.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

      return `
        <tr class="hover:bg-[#2d1052] transition-colors">
          <td class="font-medium text-white">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-md overflow-hidden bg-[#150626] border border-[#561F99] flex-shrink-0">
                <img src="${photoSrc}" alt="${r.full_name}" class="w-full h-full object-cover" />
              </div>
              <span class="truncate max-w-[170px]">${r.full_name}</span>
            </div>
          </td>
          <td class="font-mono text-xs font-semibold text-[#C9A4F6]">${r.student_id}</td>
          <td class="text-[#E9D8FD] text-xs">${r.program_of_study}</td>
          <td>
            <span class="px-2.5 py-0.5 rounded bg-[#561F99] border border-[#9B5CE8]/50 text-[10px] font-mono text-[#C9A4F6] font-semibold">${r.interest_track}</span>
          </td>
          <td class="font-mono text-[#D8B4FE] text-[11px]">${r.email}</td>
          <td class="font-mono text-[#D8B4FE] text-xs">${r.submit_date || '-'}</td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <button type="button" data-reg-id="${r.id}" class="btn-open-review px-2.5 py-1 rounded-md bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white border border-[#561F99] text-xs font-semibold transition-colors inline-flex items-center space-x-1">
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
    if (modalTrack) modalTrack.textContent = selectedReg.interest_track;
    if (modalMotivation) modalMotivation.textContent = `"${selectedReg.motivation || 'Tidak ada catatan motivasi.'}"`;
    
    if (modalPortfolio) {
      const url = selectedReg.portfolio_url || 'https://github.com';
      modalPortfolio.href = url;
      modalPortfolio.querySelector('span').textContent = url;
    }

    if (modalStatusBadge) {
      if (selectedReg.status === 'APPROVED') {
        modalStatusBadge.className = 'badge-status badge-approved';
        modalStatusBadge.textContent = 'APPROVED';
      } else if (selectedReg.status === 'REJECTED') {
        modalStatusBadge.className = 'badge-status badge-danger';
        modalStatusBadge.textContent = 'REJECTED';
      } else {
        modalStatusBadge.className = 'badge-status badge-pending';
        modalStatusBadge.textContent = 'PENDING';
      }
    }

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
    initIcons();
  }

  function closeReviewModal() {
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    selectedReg = null;
  }

  closeModalBtn?.addEventListener('click', closeReviewModal);

  // Decision Action: Approve Candidate (Direct Database Hit)
  btnApprove?.addEventListener('click', async () => {
    if (!selectedReg) return;
    const token = getAuthToken();

    try {
      btnApprove.disabled = true;
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
        showToast(`Berkas Disetujui! Member ID ${updated.member_id || ''} resmi tersimpan di database.`, 'success');
        renderStats();
        renderTable();
        closeReviewModal();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal menyetujui berkas di database.', 'error');
      }
    } catch (err) {
      console.error('Approve Error:', err);
      showToast('Gagal terhubung ke server database.', 'error');
    } finally {
      btnApprove.disabled = false;
    }
  });

  // Decision Action: Reject Candidate (Direct Database Hit)
  btnReject?.addEventListener('click', async () => {
    if (!selectedReg) return;
    const token = getAuthToken();

    try {
      btnReject.disabled = true;
      const res = await fetch(`${API_BASE_URL}/registrations/${selectedReg.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        selectedReg.status = 'REJECTED';
        showToast('Berkas Calon Anggota telah ditolak di database.', 'info');
        renderStats();
        renderTable();
        closeReviewModal();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal memperbarui status di database.', 'error');
      }
    } catch (err) {
      console.error('Reject Error:', err);
      showToast('Gagal terhubung ke server database.', 'error');
    } finally {
      btnReject.disabled = false;
    }
  });

  // Search & Filter Event Listeners
  searchInput?.addEventListener('input', renderTable);
  filterStatusSelect?.addEventListener('change', renderTable);

  // Initial Load
  loadRegistrations();
});
