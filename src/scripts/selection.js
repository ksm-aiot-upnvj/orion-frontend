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

  // Calculate today's date in YYYY-MM-DD format as fallback
  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayStr = getTodayDateString();

  // Default Intake Config (Fallback to current date if no backend/previous config)
  let currentIntakeConfig = {
    status: 'OPEN',
    batchName: 'Penerimaan Anggota Baru Periode 2026',
    deadline: todayStr,
    quota: 100
  };

  try {
    const rawConfig = localStorage.getItem('ksm_intake_config');
    if (rawConfig) {
      const parsed = JSON.parse(rawConfig);
      currentIntakeConfig = {
        ...currentIntakeConfig,
        ...parsed,
        deadline: (parsed.deadline ? String(parsed.deadline).slice(0, 10) : todayStr)
      };
    }
  } catch { }

  function syncIntakeFormInputs() {
    if (intakeStatusSelect) intakeStatusSelect.value = currentIntakeConfig.status;
    if (intakeBatchInput) intakeBatchInput.value = currentIntakeConfig.batchName;
    if (intakeDeadlineInput) intakeDeadlineInput.value = currentIntakeConfig.deadline || todayStr;
    if (intakeQuotaInput) intakeQuotaInput.value = currentIntakeConfig.quota;
  }

  function updateIntakePill() {
    if (!intakePill) return;
    const deadlineDisplay = currentIntakeConfig.deadline || todayStr;
    if (currentIntakeConfig.status === 'OPEN') {
      intakePill.className = 'badge-status badge-approved text-[10px]';
      intakePill.innerHTML = `<i data-lucide="unlock" class="w-3 h-3"></i><span>Intake: OPEN (${deadlineDisplay})</span>`;
    } else {
      intakePill.className = 'badge-status badge-danger text-[10px]';
      intakePill.innerHTML = `<i data-lucide="lock" class="w-3 h-3"></i><span>Intake: CLOSED</span>`;
    }
    initIcons();
  }

  // Initial populate with local/fallback date
  syncIntakeFormInputs();
  updateIntakePill();

  // Real-time Intake Status from Backend API
  async function fetchIntakeStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/intake-status`);
      if (res.ok) {
        const data = await res.json();
        const serverDeadline = data.deadline ? String(data.deadline).slice(0, 10) : null;
        currentIntakeConfig = {
          status: data.status || currentIntakeConfig.status || 'OPEN',
          batchName: data.batch_name || currentIntakeConfig.batchName || 'Penerimaan Anggota Baru Periode 2026',
          deadline: serverDeadline || currentIntakeConfig.deadline || todayStr,
          quota: data.quota !== undefined ? data.quota : (currentIntakeConfig.quota || 100)
        };
        localStorage.setItem('ksm_intake_config', JSON.stringify(currentIntakeConfig));
        updateIntakePill();
        syncIntakeFormInputs();
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
      syncIntakeFormInputs();

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
        deadline: intakeDeadlineInput?.value || currentIntakeConfig.deadline || todayStr,
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
          const savedDeadline = saved.deadline ? String(saved.deadline).slice(0, 10) : payload.deadline;
          currentIntakeConfig = {
            status: saved.status,
            batchName: saved.batch_name,
            deadline: savedDeadline,
            quota: saved.quota
          };
          localStorage.setItem('ksm_intake_config', JSON.stringify(currentIntakeConfig));
          updateIntakePill();
          syncIntakeFormInputs();
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
  const refreshRegistrationsBtn = document.getElementById('refresh-registrations-btn');

  // Bulk Selection Elements
  const selectAllCheckbox = document.getElementById('select-all-reg');
  const bulkActionBar = document.getElementById('bulk-action-bar');
  const bulkSelectedCount = document.getElementById('bulk-selected-count');
  const btnCancelBulk = document.getElementById('btn-cancel-bulk');
  const btnBulkDelete = document.getElementById('btn-bulk-delete');
  const selectedRegIds = new Set();

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
  const btnDeleteModal = document.getElementById('btn-decision-delete');

  const modalPhoto = document.getElementById('modal-review-photo');
  const modalName = document.getElementById('modal-review-name');
  const modalNim = document.getElementById('modal-review-nim');
  const modalProdi = document.getElementById('modal-review-prodi');
  const modalTrack = document.getElementById('modal-review-track');
  const modalMotivation = document.getElementById('modal-review-motivation');
  const modalPortfolio = document.getElementById('modal-review-portfolio');
  const modalStatusBadge = document.getElementById('modal-review-status-badge');
  const modalPhone = document.getElementById('modal-review-phone');
  const modalReviewNotes = document.getElementById('modal-review-notes');
  const btnWaAccepted = document.getElementById('btn-wa-accepted');
  const btnWaRejected = document.getElementById('btn-wa-rejected');

  // Custom Delete Confirmation Modal Elements
  const deleteModal = document.getElementById('deleteModal');
  const deleteModalBackdrop = document.getElementById('deleteModalBackdrop');
  const deleteMessage = document.getElementById('deleteMessage');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const confirmDeleteText = document.getElementById('confirmDeleteText');
  let idsToDeleteQueue = [];

  function openDeleteConfirmModal(ids, options = {}) {
    idsToDeleteQueue = ids;
    if (!deleteModal || !deleteMessage) return;

    if (options.type === 'bulk') {
      const count = ids.length;
      deleteMessage.innerHTML = `
        <p>Anda akan menghapus <span class="font-bold text-rose-300 font-mono">${count} berkas pendaftaran terpilih</span> secara permanen.</p>
        <p class="text-[11px] text-gray-400">Seluruh data pendaftaran dan file foto kandidat terkait akan dihapus dari server. Tindakan ini tidak dapat dibatalkan.</p>
      `;
    } else {
      const name = options.name || 'Calon Anggota';
      const nim = options.nim ? ` (NIM: <span class="font-mono text-purple-300">${options.nim}</span>)` : '';
      deleteMessage.innerHTML = `
        <p>Apakah Anda yakin ingin menghapus berkas pendaftaran untuk <span class="font-semibold text-white">${name}</span>${nim}?</p>
        <p class="text-[11px] text-gray-400">Data pendaftaran dan berkas foto fisik akan dihapus permanen dari server. Tindakan ini tidak dapat dibatalkan.</p>
      `;
    }

    if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;
    if (confirmDeleteText) confirmDeleteText.textContent = ids.length > 1 ? `Hapus ${ids.length} Berkas` : 'Hapus Permanen';

    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    initIcons();
  }

  function closeDeleteConfirmModal() {
    idsToDeleteQueue = [];
    deleteModal?.classList.add('hidden');
    deleteModal?.classList.remove('flex');
  }

  cancelDeleteBtn?.addEventListener('click', closeDeleteConfirmModal);
  deleteModalBackdrop?.addEventListener('click', closeDeleteConfirmModal);

  confirmDeleteBtn?.addEventListener('click', async () => {
    if (!idsToDeleteQueue || idsToDeleteQueue.length === 0) {
      closeDeleteConfirmModal();
      return;
    }

    try {
      confirmDeleteBtn.disabled = true;
      if (confirmDeleteText) confirmDeleteText.textContent = 'Menghapus...';
      await executeDeleteRegistrations(idsToDeleteQueue);
    } finally {
      confirmDeleteBtn.disabled = false;
      closeDeleteConfirmModal();
    }
  });

  // Load Registrations directly from Database
  async function loadRegistrations() {
    if (refreshRegistrationsBtn) {
      refreshRegistrationsBtn.disabled = true;
      refreshRegistrationsBtn.classList.add('opacity-60', 'cursor-wait');
      refreshRegistrationsBtn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Memuat Data...</span>';
      initIcons();
    }

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

    if (refreshRegistrationsBtn) {
      refreshRegistrationsBtn.disabled = false;
      refreshRegistrationsBtn.classList.remove('opacity-60', 'cursor-wait');
      refreshRegistrationsBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[#C9A4F6]"></i><span>Muat Ulang Data</span>';
      initIcons();
    }
  }

  refreshRegistrationsBtn?.addEventListener('click', loadRegistrations);

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

  function updateBulkUI(filteredList) {
    const count = selectedRegIds.size;
    if (bulkSelectedCount) bulkSelectedCount.textContent = count;
    if (count > 0) {
      bulkActionBar?.classList.remove('hidden');
      bulkActionBar?.classList.add('flex');
    } else {
      bulkActionBar?.classList.add('hidden');
      bulkActionBar?.classList.remove('flex');
    }

    if (selectAllCheckbox && filteredList) {
      const filteredIds = filteredList.map(r => String(r.id));
      const selectedFilteredCount = filteredIds.filter(id => selectedRegIds.has(id)).length;
      if (filteredIds.length > 0 && selectedFilteredCount === filteredIds.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else if (selectedFilteredCount > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    }
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
          <td colspan="10" class="text-center py-10 text-gray-500 font-mono text-xs">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
            <span>Tidak ada berkas calon anggota yang sesuai dengan filter.</span>
          </td>
        </tr>
      `;
      initIcons();
      updateBulkUI(filtered);
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
          <td class="text-center">
            <input type="checkbox" data-reg-id="${r.id}" class="reg-row-checkbox w-4 h-4 rounded bg-[#1f093a] border border-[#561F99] text-[#9B5CE8] focus:ring-[#9B5CE8] focus:ring-offset-0 cursor-pointer accent-[#9B5CE8]" ${selectedRegIds.has(String(r.id)) ? 'checked' : ''} />
          </td>
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
            <div class="inline-flex items-center space-x-1.5">
              <button type="button" data-reg-id="${r.id}" class="btn-open-review px-2.5 py-1 rounded-md bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white border border-[#561F99] text-xs font-semibold transition-colors inline-flex items-center space-x-1">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span>Review</span>
              </button>
              <button type="button" data-reg-id="${r.id}" data-reg-name="${r.full_name}" class="btn-single-delete p-1 rounded-md hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-colors inline-flex items-center" title="Hapus Berkas">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    initIcons();

    // Bind Row Checkboxes
    document.querySelectorAll('.reg-row-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-reg-id');
        if (cb.checked) {
          selectedRegIds.add(String(id));
        } else {
          selectedRegIds.delete(String(id));
        }
        updateBulkUI(filtered);
      });
    });

    // Bind Single Delete Triggers (using Custom Confirmation Modal)
    document.querySelectorAll('.btn-single-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const regId = btn.getAttribute('data-reg-id');
        const regName = btn.getAttribute('data-reg-name') || 'kandidat ini';
        const candidate = registrationsList.find(r => String(r.id) === String(regId));
        openDeleteConfirmModal([regId], {
          type: 'single',
          name: candidate?.full_name || regName,
          nim: candidate?.student_id
        });
      });
    });

    // Bind Review Modal Triggers
    document.querySelectorAll('.btn-open-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const regId = btn.getAttribute('data-reg-id');
        openReviewModal(regId);
      });
    });

    updateBulkUI(filtered);
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
    if (modalReviewNotes) modalReviewNotes.value = selectedReg.review_note || '';

    // Handle Berkas CV (PDF) & Preview Feature
    const cvStatusBadge = document.getElementById('modal-cv-status-badge');
    const cvActions = document.getElementById('modal-cv-actions');
    const btnPreviewCv = document.getElementById('btn-preview-cv');
    const btnDownloadCv = document.getElementById('btn-download-cv');

    const rawCv = (selectedReg.cv_url || '').trim();
    if (rawCv && rawCv !== '-' && rawCv !== 'null' && rawCv !== 'undefined') {
      const cvUrl = rawCv.startsWith('http://') || rawCv.startsWith('https://')
        ? rawCv
        : rawCv.startsWith('/orion/api/v1/')
          ? `${window.location.origin}${rawCv}`
          : `${API_BASE_URL}/uploads/${rawCv.replace(/^(\/|uploads\/)/, '')}`;

      if (cvStatusBadge) {
        cvStatusBadge.className = 'badge-status badge-approved text-[10px]';
        cvStatusBadge.textContent = 'Tersedia (.PDF)';
      }
      if (cvActions) cvActions.classList.remove('hidden');
      if (btnDownloadCv) btnDownloadCv.href = cvUrl;
      if (btnPreviewCv) {
        btnPreviewCv.onclick = () => openCvPreviewModal(cvUrl, selectedReg.full_name);
      }
    } else {
      if (cvStatusBadge) {
        cvStatusBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400';
        cvStatusBadge.textContent = 'Tidak ada berkas';
      }
      if (cvActions) cvActions.classList.add('hidden');
    }

    // Handle Tautan Portofolio / GitHub / LinkedIn
    const modalPortfolioLink = document.getElementById('modal-review-portfolio');
    const rawPortfolio = (selectedReg.portfolio_url || '').trim();

    if (modalPortfolioLink) {
      if (rawPortfolio && rawPortfolio !== '-' && rawPortfolio !== 'null' && rawPortfolio !== 'undefined') {
        const fullUrl = rawPortfolio.startsWith('http') ? rawPortfolio : `https://${rawPortfolio}`;
        modalPortfolioLink.href = fullUrl;
        modalPortfolioLink.className = 'text-[#C9A4F6] hover:text-white hover:underline font-mono text-xs flex items-center space-x-1.5 break-all transition-colors';

        let iconName = 'link';
        if (rawPortfolio.includes('github.com')) iconName = 'github';
        else if (rawPortfolio.includes('linkedin.com')) iconName = 'linkedin';

        modalPortfolioLink.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5 flex-shrink-0 text-[#C9A4F6]"></i><span class="truncate">${rawPortfolio}</span>`;
      } else {
        modalPortfolioLink.removeAttribute('href');
        modalPortfolioLink.className = 'text-gray-400 font-mono text-xs flex items-center space-x-1.5 cursor-default';
        modalPortfolioLink.innerHTML = `<i data-lucide="link-2-off" class="w-3.5 h-3.5 flex-shrink-0 text-gray-500"></i><span class="italic text-gray-400">Tidak melampirkan portofolio</span>`;
      }
    }

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

  // CV Preview Modal Helpers
  const cvPreviewModal = document.getElementById('cv-preview-modal');
  const cvPreviewFrame = document.getElementById('cv-preview-frame');
  const cvPreviewTitle = document.getElementById('cv-preview-title');
  const cvPreviewExternal = document.getElementById('cv-preview-external');
  const closeCvPreviewBtn = document.getElementById('close-cv-preview-modal');

  function openCvPreviewModal(url, candidateName) {
    if (!cvPreviewModal || !cvPreviewFrame) return;
    cvPreviewFrame.src = url;
    if (cvPreviewTitle) cvPreviewTitle.textContent = `Preview CV: ${candidateName || 'Calon Anggota'}`;
    if (cvPreviewExternal) cvPreviewExternal.href = url;
    cvPreviewModal.classList.remove('hidden');
    cvPreviewModal.classList.add('flex');
    initIcons();
  }

  function closeCvPreviewModal() {
    if (!cvPreviewModal || !cvPreviewFrame) return;
    cvPreviewFrame.src = '';
    cvPreviewModal.classList.add('hidden');
    cvPreviewModal.classList.remove('flex');
  }

  closeCvPreviewBtn?.addEventListener('click', closeCvPreviewModal);
  cvPreviewModal?.addEventListener('click', (e) => {
    if (e.target === cvPreviewModal) closeCvPreviewModal();
  });

  function closeReviewModal() {
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    selectedReg = null;
  }

  closeModalBtn?.addEventListener('click', closeReviewModal);

  // Decision Action: Approve Candidate (Direct Backend Hit, default role: Anggota)
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
          role: 'Anggota',
          review_note: modalReviewNotes?.value ? modalReviewNotes.value.trim() : null
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

  // Execute Deletion of Candidates (Single or Bulk via POST /registrations/bulk-delete)
  async function executeDeleteRegistrations(ids) {
    if (!ids || ids.length === 0) return;
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const res = await fetch(`${API_BASE_URL}/registrations/bulk-delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ registration_ids: ids.map(String) })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `${ids.length} pendaftar berhasil dihapus permanen.`, 'success');
        const idSet = new Set(ids.map(String));
        registrationsList = registrationsList.filter(r => !idSet.has(String(r.id)));
        ids.forEach(id => selectedRegIds.delete(String(id)));
        renderStats();
        renderTable();
        if (selectedReg && idSet.has(String(selectedReg.id))) {
          closeReviewModal();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal menghapus data pendaftar.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Gagal terhubung ke server backend.', 'error');
    }
  }

  // Bulk Selection Event Listeners
  selectAllCheckbox?.addEventListener('change', () => {
    const search = searchInput?.value.toLowerCase().trim() || '';
    const statusFilter = (filterStatusSelect?.value || 'all').toLowerCase();
    const filtered = registrationsList.filter(r => {
      const matchSearch = (r.full_name || '').toLowerCase().includes(search) || (r.student_id || '').toLowerCase().includes(search);
      const rNorm = getNormalizedStatus(r.status).toLowerCase();
      const matchStatus = statusFilter === 'all' || rNorm === statusFilter || (statusFilter === 'approved' && rNorm === 'accepted');
      return matchSearch && matchStatus;
    });

    if (selectAllCheckbox.checked) {
      filtered.forEach(r => selectedRegIds.add(String(r.id)));
    } else {
      filtered.forEach(r => selectedRegIds.delete(String(r.id)));
    }
    renderTable();
  });

  btnCancelBulk?.addEventListener('click', () => {
    selectedRegIds.clear();
    renderTable();
  });

  btnBulkDelete?.addEventListener('click', () => {
    if (selectedRegIds.size === 0) return;
    openDeleteConfirmModal(Array.from(selectedRegIds), {
      type: 'bulk'
    });
  });

  btnDeleteModal?.addEventListener('click', () => {
    if (!selectedReg) return;
    openDeleteConfirmModal([selectedReg.id], {
      type: 'single',
      name: selectedReg.full_name,
      nim: selectedReg.student_id
    });
  });

  // Search & Filter Event Listeners
  searchInput?.addEventListener('input', renderTable);
  filterStatusSelect?.addEventListener('change', renderTable);

  // Initial Load
  loadRegistrations();
});
