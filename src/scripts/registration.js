import { initIcons, showToast } from '../modules/ui.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

document.addEventListener('DOMContentLoaded', () => {
  initIcons();

  // Form Elements
  const form = document.getElementById('pendaftaran-form');
  const nameInput = document.getElementById('reg-name');
  const nimInput = document.getElementById('reg-nim');
  const prodiInput = document.getElementById('reg-prodi');
  const emailInput = document.getElementById('reg-email');
  const trackInput = document.getElementById('reg-track');
  const phoneInput = document.getElementById('reg-phone');
  const angkatanInput = document.getElementById('reg-angkatan');
  const motivationInput = document.getElementById('reg-motivation');
  const resetBtn = document.getElementById('reset-stepper-btn');

  // Photo Upload Elements
  const photoInput = document.getElementById('reg-photo-input');
  const photoDropzone = document.getElementById('photo-dropzone');
  const btnTriggerUpload = document.getElementById('btn-trigger-upload');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  const formPhotoContainer = document.getElementById('form-photo-container');
  const formPhotoPreview = document.getElementById('form-photo-preview');
  const photoFilenameLabel = document.getElementById('photo-filename-label');
  const presetAvatarBtns = document.querySelectorAll('.preset-avatar-btn');

  // Live Card Preview Elements
  const cardName = document.getElementById('card-name');
  const cardNim = document.getElementById('card-nim');
  const cardProdi = document.getElementById('card-prodi');
  const cardTrack = document.getElementById('card-track');
  const cardAvatar = document.getElementById('card-avatar');
  const cardMemberId = document.getElementById('card-member-id');
  const cardStatusText = document.getElementById('card-status-text');
  const regStatusBadge = document.getElementById('reg-status-badge');

  // Stepper Visualizer Elements
  const stepIcon1 = document.getElementById('step-icon-1');
  const stepIcon2 = document.getElementById('step-icon-2');
  const stepIcon3 = document.getElementById('step-icon-3');
  const stepLine1 = document.getElementById('step-line-1');
  const stepLine2 = document.getElementById('step-line-2');
  const stepLabel1 = document.getElementById('step-label-1');
  const stepLabel2 = document.getElementById('step-label-2');
  const stepLabel3 = document.getElementById('step-label-3');

  // Manual Step Simulation Buttons
  const btnStep1 = document.getElementById('btn-force-step-1');
  const btnStep2 = document.getElementById('btn-force-step-2');
  const btnStep3 = document.getElementById('btn-force-step-3');

  const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";
  let currentPhotoData = defaultAvatar;

  // Realtime Mirror to Live Member Card
  function updateLiveCard() {
    if (cardName) cardName.textContent = nameInput?.value.trim() || 'Nama Calon Anggota';
    if (cardNim) cardNim.textContent = nimInput?.value.trim() ? `NIM: ${nimInput.value.trim()}` : 'NIM: -';
    if (cardProdi) cardProdi.textContent = prodiInput?.value ? `Prodi: ${prodiInput.value}` : 'Program Studi: -';
    if (cardTrack) cardTrack.textContent = trackInput?.value ? `Track: ${trackInput.value}` : 'Track: -';
  }

  [nameInput, nimInput, prodiInput, trackInput].forEach(el => {
    el?.addEventListener('input', updateLiveCard);
    el?.addEventListener('change', updateLiveCard);
  });

  // Photo Upload & Preset Pickers
  function applyPhoto(photoUrl, filename = 'Preset Avatar Terpilih') {
    currentPhotoData = photoUrl;
    if (formPhotoPreview) formPhotoPreview.src = photoUrl;
    if (cardAvatar) cardAvatar.src = photoUrl;
    if (photoFilenameLabel) photoFilenameLabel.textContent = filename;
    if (btnRemovePhoto) btnRemovePhoto.classList.remove('hidden');
  }

  function resetPhoto() {
    currentPhotoData = defaultAvatar;
    if (formPhotoPreview) formPhotoPreview.src = defaultAvatar;
    if (cardAvatar) cardAvatar.src = defaultAvatar;
    if (photoFilenameLabel) photoFilenameLabel.textContent = 'Klik upload atau seret file gambar';
    if (btnRemovePhoto) btnRemovePhoto.classList.add('hidden');
    if (photoInput) photoInput.value = '';
    presetAvatarBtns.forEach(btn => {
      btn.classList.remove('border-aiot-cyan');
      btn.classList.add('border-slate-700');
    });
  }

  btnTriggerUpload?.addEventListener('click', () => photoInput?.click());
  formPhotoContainer?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Ukuran foto melebihi batas maksimal 3MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      applyPhoto(event.target.result, file.name);
      showToast('Pasfoto berhasil diunggah!', 'success');
    };
    reader.readAsDataURL(file);
  });

  photoDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    photoDropzone.classList.add('border-aiot-cyan', 'bg-slate-800/80');
  });

  photoDropzone?.addEventListener('dragleave', () => {
    photoDropzone.classList.remove('border-aiot-cyan', 'bg-slate-800/80');
  });

  photoDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    photoDropzone.classList.remove('border-aiot-cyan', 'bg-slate-800/80');
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        applyPhoto(event.target.result, file.name);
        showToast('Pasfoto berhasil diunggah via dropzone!', 'success');
      };
      reader.readAsDataURL(file);
    }
  });

  presetAvatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const avatarUrl = btn.getAttribute('data-preset-avatar');
      presetAvatarBtns.forEach(b => {
        b.classList.remove('border-aiot-cyan');
        b.classList.add('border-slate-700');
      });
      btn.classList.remove('border-slate-700');
      btn.classList.add('border-aiot-cyan');
      applyPhoto(avatarUrl, 'Preset Avatar');
    });
  });

  btnRemovePhoto?.addEventListener('click', resetPhoto);

  // Stepper Visual Transition Controller
  function setStepperState(step, statusText = '') {
    if (step === 1) {
      stepIcon1.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-cyan-950/90 border-2 border-aiot-cyan text-aiot-cyan rounded-full shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all';
      stepIcon2.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-slate-800 border border-slate-700 text-slate-400 rounded-full transition-all';
      stepIcon3.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-slate-800 border border-slate-700 text-slate-400 rounded-full transition-all';
      stepLine1.className = 'h-full bg-slate-800 transition-all duration-500 w-0';
      stepLine2.className = 'h-full bg-slate-800 transition-all duration-500 w-0';
      stepLabel1.className = 'text-[11px] font-bold text-aiot-cyan mt-2.5 font-mono whitespace-nowrap';
      stepLabel2.className = 'text-[11px] font-semibold text-slate-400 mt-2.5 font-mono whitespace-nowrap';
      stepLabel3.className = 'text-[11px] font-semibold text-slate-400 mt-2.5 font-mono whitespace-nowrap';

      regStatusBadge.textContent = 'Tahap 1: Pengisian Berkas';
      regStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/80 text-aiot-cyan border border-cyan-800 font-bold';
      cardMemberId.textContent = 'ID: PENDING';
      cardMemberId.className = 'text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 font-bold border border-amber-800';
      cardStatusText.textContent = statusText || 'Menunggu Submit';
      cardStatusText.className = 'text-amber-400 font-semibold';
    } else if (step === 2) {
      stepIcon1.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-cyan-950 border-2 border-aiot-cyan text-aiot-cyan rounded-full transition-all';
      stepIcon2.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-purple-950 border-2 border-purple-500 text-purple-300 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all animate-pulse';
      stepIcon3.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-slate-800 border border-slate-700 text-slate-400 rounded-full transition-all';
      stepLine1.className = 'h-full bg-gradient-to-r from-aiot-cyan to-purple-500 transition-all duration-500 w-full';
      stepLine2.className = 'h-full bg-slate-800 transition-all duration-500 w-0';
      stepLabel1.className = 'text-[11px] font-semibold text-aiot-cyan mt-2.5 font-mono whitespace-nowrap';
      stepLabel2.className = 'text-[11px] font-bold text-purple-400 mt-2.5 font-mono whitespace-nowrap';
      stepLabel3.className = 'text-[11px] font-semibold text-slate-400 mt-2.5 font-mono whitespace-nowrap';

      regStatusBadge.textContent = 'Tahap 2: Proses Review Seleksi';
      regStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800 font-bold';
      cardMemberId.textContent = 'ID: REVIEWING';
      cardMemberId.className = 'text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 font-bold border border-purple-800';
      cardStatusText.textContent = statusText || 'Berkas Sedang Diseleksi';
      cardStatusText.className = 'text-purple-400 font-semibold';
    } else if (step === 3) {
      stepIcon1.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-cyan-950 border-2 border-aiot-cyan text-aiot-cyan rounded-full transition-all';
      stepIcon2.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-purple-950 border-2 border-purple-500 text-purple-300 rounded-full transition-all';
      stepIcon3.className = 'flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all';
      stepLine1.className = 'h-full bg-gradient-to-r from-aiot-cyan to-purple-500 transition-all duration-500 w-full';
      stepLine2.className = 'h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500 w-full';
      stepLabel1.className = 'text-[11px] font-semibold text-aiot-cyan mt-2.5 font-mono whitespace-nowrap';
      stepLabel2.className = 'text-[11px] font-semibold text-purple-400 mt-2.5 font-mono whitespace-nowrap';
      stepLabel3.className = 'text-[11px] font-bold text-emerald-400 mt-2.5 font-mono whitespace-nowrap';

      regStatusBadge.textContent = 'Tahap 3: Lolos Seleksi (Resmi)';
      regStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold';
      cardMemberId.textContent = 'AIOT-2026-NEW';
      cardMemberId.className = 'text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800';
      cardStatusText.textContent = 'Lolos Seleksi Anggota Aktif';
      cardStatusText.className = 'text-emerald-400 font-semibold';
    }
  }

  // Simulation Button Listeners
  btnStep1?.addEventListener('click', () => setStepperState(1));
  btnStep2?.addEventListener('click', () => setStepperState(2));
  btnStep3?.addEventListener('click', () => setStepperState(3));

  // Form Submit Handler -> Sends application to Backend API
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      student_id: nimInput.value.trim(),
      full_name: nameInput.value.trim(),
      program_of_study: prodiInput.value,
      email: emailInput.value.trim(),
      contact_info: phoneInput.value.trim() || 'Belum diisi',
      intake_period: angkatanInput.value,
      interest_track: trackInput.value,
      motivation: motivationInput.value.trim() || 'Minat riset AI & IoT',
      photo: currentPhotoData
    };

    try {
      const res = await fetch(`${API_BASE_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStepperState(2, 'Berkas Terkirim (Menunggu Review)');
        showToast('Pendaftaran Berhasil! Berkas Anda masuk ke tahap seleksi admin.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal mengirim berkas pendaftaran.', 'error');
      }
    } catch {
      // Offline fallback simulation
      setStepperState(2, 'Berkas Terkirim (Simulasi)');
      showToast('Pendaftaran Berhasil! (Mode Simulasi)', 'success');
    }
  });

  resetBtn?.addEventListener('click', () => {
    form.reset();
    resetPhoto();
    updateLiveCard();
    setStepperState(1);
    showToast('Formulir direset.', 'info');
  });

  // Initial State
  setStepperState(1);
  updateLiveCard();
});
