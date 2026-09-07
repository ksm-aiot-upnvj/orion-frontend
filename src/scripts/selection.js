import { initIcons, showToast } from '../modules/ui.js';
import { initCRMLayout } from '../modules/crm-layout.js';
import { getAuthToken, getAuthUser } from '../modules/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let registrationsList = [];
let selectedReg = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Unified CRM Layout (with Auth Route Guard)
  initCRMLayout('selection', 'Seleksi Calon Anggota');

  // RBAC Check for BPH / PSDM Intake Control Button
  const currentUser = getAuthUser() || { role: 'SUPERADMIN' };
  const canManageSelection = currentUser.is_superadmin ||
    ['SUPERADMIN', 'ADMIN_BPH', 'Ketua', 'Wakil Ketua'].includes(currentUser.role) ||
    currentUser.division === 'PSDM';

  const intakeBtn = document.getElementById('open-intake-control-btn');
  const intakeModal = document.getElementById('intake-control-modal');
  const closeIntakeModalBtn = document.getElementById('close-intake-modal');
  const intakeForm = document.getElementById('intake-control-form');
  const intakeStatusSelect = document.getElementById('intake-status-select');
  const intakeBatchInput = document.getElementById('intake-batch-name');
  const intakeDeadlineInput = document.getElementById('intake-deadline-date');
  const intakeQuotaInput = document.getElementById('intake-quota');
  const intakePill = document.getElementById('intake-status-pill');

  // Default Intake Config
  let currentIntakeConfig = {
    status: 'OPEN',
    batchName: 'Penerimaan Anggota Baru Periode 2026',
    deadline: '2026-08-31',
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

  // Real-time Intake Status from Backend API
  async function fetchIntakeStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/intake-status`);
      if (res.ok) {
        const data = await res.json();
        currentIntakeConfig = {
          status: data.status || 'OPEN',
          batchName: data.batch_name || 'Penerimaan Anggota Baru Periode 2026',
          deadline: data.deadline || '2026-08-31',
          quota: data.quota || 100
        };
        localStorage.setItem('ksm_intake_config', JSON.stringify(currentIntakeConfig));
        updateIntakePill();
      }
    } catch (err) {
      console.warn('Gagal memuat status intake backend:', err);
    }
  }
  fetchIntakeStatus();

  if (canManageSelection && intakeBtn) {
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

    intakeForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getAuthToken();
      const payload = {
        status: intakeStatusSelect?.value || 'OPEN',
        batch_name: intakeBatchInput?.value.trim() || 'Penerimaan Anggota Baru Periode 2026',
        deadline: intakeDeadlineInput?.value || '2026-08-31',
        quota: Number(intakeQuotaInput?.value) || 100
      };

      try {
        const res = await fetch(`${API_BASE_URL}/registrations/intake-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const saved = await res.json();
          currentIntakeConfig = {
            status: saved.status,
            batchName: saved.batch_name,
            deadline: saved.deadline,
            quota: saved.quota
          };
          localStorage.setItem('ksm_intake_config', JSON.stringify(currentIntakeConfig));
          updateIntakePill();
          intakeModal?.classList.add('hidden');
          intakeModal?.classList.remove('flex');
          showToast('Pengaturan periode pendaftaran berhasil disimpan.', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Gagal menyimpan pengaturan periode.', 'error');
        }
      } catch (err) {
        console.error('Save intake error:', err);
        showToast('Gagal terhubung ke server backend.', 'error');
      }
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
  const modalPhone = document.getElementById('modal-review-phone');
  const modalReviewDivision = document.getElementById('modal-review-division');
  const modalReviewRole = document.getElementById('modal-review-role');
  const modalReviewNotes = document.getElementById('modal-review-notes');
  const btnWaAccepted = document.getElementById('btn-wa-accepted');
  const btnWaRejected = document.getElementById('btn-wa-rejected');

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
      showToast('Gagal memuat data pendaftaran dari server.', 'error');
    }
    renderStats();
    renderTable();
  }

  function getNormalizedStatus(status) {
    const s = (status || '').toLowerCase();
    if (s === 'accepted' || s === 'approved') return 'Accepted';
    if (s === 'rejected') return 'Rejected';
    return 'Pending';
  }

  function renderStats() {
    const total = registrationsList.length;
    const pending = registrationsList.filter(r => getNormalizedStatus(r.status) === 'Pending').length;
    const approved = registrationsList.filter(r => getNormalizedStatus(r.status) === 'Accepted').length;
    const rejected = registrationsList.filter(r => getNormalizedStatus(r.status) === 'Rejected').length;

    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statApproved) statApproved.textContent = approved;
    if (statRejected) statRejected.textContent = rejected;
  }

  function renderTable() {
    if (!tbody) return;
    const search = searchInput?.value.toLowerCase().trim() || '';
    const statusFilter = (filterStatusSelect?.value || 'all').toLowerCase();

    const filtered = registrationsList.filter(r => {
      const matchSearch = (r.full_name || '').toLowerCase().includes(search) || (r.student_id || '').toLowerCase().includes(search);
      const rNorm = getNormalizedStatus(r.status).toLowerCase();
      const matchStatus = statusFilter === 'all' || rNorm === statusFilter || (statusFilter === 'approved' && rNorm === 'accepted');
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-10 text-gray-500 font-mono text-xs">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
            <span>Tidak ada berkas calon anggota yang sesuai dengan filter.</span>
          </td>
        </tr>
      `;
      initIcons();
      return;
    }

    function resolvePhotoUrl(photo, defaultSeed = 'kandidat') {
      if (!photo || photo === '-' || photo === 'null') {
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(defaultSeed)}&backgroundColor=240d42`;
      }
      if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:image')) {
        return photo;
      }
      const clean = photo.replace(/^(\/|uploads\/)/, '');
      return `${API_BASE_URL}/uploads/${clean}`;
    }

    tbody.innerHTML = filtered.map(r => {
      const norm = getNormalizedStatus(r.status);
      let statusBadge = '';
      if (norm === 'Accepted') {
        statusBadge = `<span class="badge-status badge-approved text-[11px]"><i data-lucide="check" class="w-3 h-3"></i><span>DITERIMA</span></span>`;
      } else if (norm === 'Rejected') {
        statusBadge = `<span class="badge-status badge-danger text-[11px]"><i data-lucide="x" class="w-3 h-3"></i><span>DITOLAK</span></span>`;
      } else {
        statusBadge = `<span class="badge-status badge-pending text-[11px]"><i data-lucide="clock" class="w-3 h-3"></i><span>PENDING</span></span>`;
      }

      const photoSrc = resolvePhotoUrl(r.photo, r.student_id || r.full_name);
      const rawPhone = (r.contact_info || '').trim();
      const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
      const waLinkHtml = rawPhone ? `
        <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1 hover:underline">
          <i data-lucide="message-circle" class="w-3 h-3"></i>
          <span>${rawPhone}</span>
        </a>
      ` : `<span class="text-gray-500 italic">-</span>`;

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
          <td class="font-mono text-xs">${waLinkHtml}</td>
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

    function resolvePhotoUrl(photo, defaultSeed = 'kandidat') {
      if (!photo || photo === '-' || photo === 'null') {
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(defaultSeed)}&backgroundColor=240d42`;
      }
      if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:image')) {
        return photo;
      }
      const clean = photo.replace(/^(\/|uploads\/)/, '');
      return `${API_BASE_URL}/uploads/${clean}`;
    }

    if (modalPhoto) modalPhoto.src = resolvePhotoUrl(selectedReg.photo, selectedReg.student_id || selectedReg.full_name);
    if (modalName) modalName.textContent = selectedReg.full_name;
    if (modalNim) modalNim.textContent = selectedReg.student_id;
    if (modalProdi) modalProdi.textContent = selectedReg.program_of_study;
    if (modalTrack) modalTrack.textContent = selectedReg.interest_track;
    if (modalMotivation) modalMotivation.textContent = `"${selectedReg.motivation || 'Tidak ada catatan motivasi.'}"`;
    if (modalPhone) modalPhone.textContent = selectedReg.contact_info || '-';

    if (modalReviewDivision) modalReviewDivision.value = 'Akademik Riset';
    if (modalReviewRole) modalReviewRole.value = 'Anggota';
    if (modalReviewNotes) modalReviewNotes.value = selectedReg.review_note || '';

    // Bind WhatsApp Direct Contact Buttons
    if (btnWaAccepted) {
      btnWaAccepted.onclick = () => {
        const rawPhone = (selectedReg.contact_info || '').trim();
        const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
        if (!cleanPhone) {
          showToast('Nomor WhatsApp kandidat tidak tersedia.', 'warning');
          return;
        }
        const reviewerName = currentUser.full_name || currentUser.name || 'Pengurus PSDM';
        const candidateName = selectedReg.full_name || 'Calon Anggota';
        const msg = `Halo, perkenalkan aku ${reviewerName} dari divisi PSDM KSM AIoT. Selamat kamu dengan nama ${candidateName} dinyatakan lolos seleksi penerimaan anggota baru KSM AIoT! Silakan bergabung ke grup koordinasi berikut: https://chat.whatsapp.com/invite dan Discord: https://discord.gg/ksmaiot`;
        showToast('Membuka WhatsApp...', 'info');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      };
    }

    if (btnWaRejected) {
      btnWaRejected.onclick = () => {
        const rawPhone = (selectedReg.contact_info || '').trim();
        const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
        if (!cleanPhone) {
          showToast('Nomor WhatsApp kandidat tidak tersedia.', 'warning');
          return;
        }
        const reviewerName = currentUser.full_name || currentUser.name || 'Pengurus PSDM';
        const candidateName = selectedReg.full_name || 'Calon Anggota';
        const msg = `Halo, perkenalkan aku ${reviewerName} dari divisi PSDM KSM AIoT. Terima kasih telah berpartisipasi dalam seleksi KSM AIoT UPNVJ. Mohon maaf saat ini kamu belum dapat bergabung pada periode ini. Tetap semangat dan pantau terus kesempatan berikutnya!`;
        showToast('Membuka WhatsApp...', 'info');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      };
    }

    if (modalPortfolio) {
      const url = (selectedReg.portfolio_url || '').trim();
      if (url && url !== '-' && url !== 'null' && url !== 'undefined') {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        modalPortfolio.href = fullUrl;
        modalPortfolio.className = 'text-[#C9A4F6] hover:text-white hover:underline font-mono text-xs flex items-center space-x-1.5 break-all transition-colors';
        modalPortfolio.innerHTML = `<i data-lucide="link" class="w-3.5 h-3.5 flex-shrink-0"></i><span class="truncate">${url}</span>`;
      } else {
        modalPortfolio.removeAttribute('href');
        modalPortfolio.className = 'text-gray-400 font-mono text-xs flex items-center space-x-1.5 cursor-default';
        modalPortfolio.innerHTML = `<i data-lucide="link-2-off" class="w-3.5 h-3.5 flex-shrink-0 text-gray-500"></i><span class="italic">Tidak melampirkan portofolio / CV</span>`;
      }
    }

    if (modalStatusBadge) {
      const norm = getNormalizedStatus(selectedReg.status);
      if (norm === 'Accepted') {
        modalStatusBadge.className = 'badge-status badge-approved';
        modalStatusBadge.textContent = 'DITERIMA (ACCEPTED)';
      } else if (norm === 'Rejected') {
        modalStatusBadge.className = 'badge-status badge-danger';
        modalStatusBadge.textContent = 'DITOLAK (REJECTED)';
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

  // Decision Action: Approve Candidate (Direct Backend Hit)
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
        },
        body: JSON.stringify({
          status: 'Accepted',
          division: modalReviewDivision?.value || 'Akademik Riset',
          role: modalReviewRole?.value || 'Anggota',
          review_note: modalReviewNotes?.value.trim() || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        selectedReg.status = 'Accepted';
        selectedReg.member_id = updated.member_id;
        showToast(`Calon anggota disetujui. Member ID: ${updated.member_id || '-'}`, 'success');
        renderStats();
        renderTable();
        closeReviewModal();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal menyetujui calon anggota.', 'error');
      }
    } catch (err) {
      console.error('Approve Error:', err);
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      btnApprove.disabled = false;
    }
  });

  // Decision Action: Reject Candidate (Direct Backend Hit)
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
        },
        body: JSON.stringify({
          status: 'Rejected',
          review_note: modalReviewNotes?.value.trim() || null
        })
      });

      if (res.ok) {
        selectedReg.status = 'Rejected';
        showToast('Berkas calon anggota telah ditolak.', 'info');
        renderStats();
        renderTable();
        closeReviewModal();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal menolak berkas.', 'error');
      }
    } catch (err) {
      console.error('Reject Error:', err);
      showToast('Gagal terhubung ke server.', 'error');
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
