import { login } from '../modules/auth.js';
import { initIcons, showToast } from '../modules/ui.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
const APP_BASE_URL = import.meta.env.BASE_URL;

document.addEventListener('DOMContentLoaded', () => {
  initIcons();

  // Form Elements
  const form = document.getElementById('registration-form');
  const nimInput = document.getElementById('input-nim');
  const nameInput = document.getElementById('input-name');
  const prodiInput = document.getElementById('input-prodi');
  const angkatanInput = document.getElementById('input-angkatan');
  const emailInput = document.getElementById('input-email');
  const phoneInput = document.getElementById('input-phone');
  const trackInput = document.getElementById('input-track');
  const motivationInput = document.getElementById('input-motivation');
  const portfolioInput = document.getElementById('input-portfolio');

  // File Upload Elements
  const photoFileInput = document.getElementById('input-photo-file');
  const photoFilenameLabel = document.getElementById('photo-filename-label');
  const cvFileInput = document.getElementById('input-cv-file');
  const cvFilenameLabel = document.getElementById('cv-filename-label');

  // Live Preview Elements
  const cardName = document.getElementById('card-preview-name');
  const cardNim = document.getElementById('card-preview-nim');
  const cardProdi = document.getElementById('card-preview-prodi');
  const cardTrack = document.getElementById('card-preview-track');
  const cardPhoto = document.getElementById('card-preview-photo');

  // Stepper Elements
  const stepIcon2 = document.getElementById('step-icon-2');

  let uploadedPhotoBase64 = '';
  let uploadedCvName = '';
  let uploadedCvPath = '';
  let cvUploadInProgress = false;

  // ============================================================
  // Intake Status Verification (Real-Time Backend Endpoint Hit)
  // ============================================================
  const closedBanner = document.getElementById('intake-closed-banner');
  const formHeader = document.getElementById('form-header-box');
  const deadlineDisplay = document.getElementById('registration-deadline-display');

  async function checkIntakeStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/intake-status`);
      if (res.ok) {
        const cfg = await res.json();
        if (deadlineDisplay && cfg.deadline) {
          deadlineDisplay.textContent = cfg.deadline;
        }

        const isClosed = cfg.status === 'CLOSED';
        let isPastDeadline = false;
        if (cfg.deadline) {
          const deadlineDate = new Date(cfg.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (today > deadlineDate) isPastDeadline = true;
        }

        if (isClosed || isPastDeadline) {
          if (form) form.classList.add('opacity-50', 'pointer-events-none');
          if (formHeader) formHeader.classList.add('hidden');
          if (closedBanner) closedBanner.classList.remove('hidden');
        } else {
          if (form) form.classList.remove('opacity-50', 'pointer-events-none');
          if (formHeader) formHeader.classList.remove('hidden');
          if (closedBanner) closedBanner.classList.add('hidden');
        }
      }
    } catch (e) {
      console.warn('Gagal memuat status intake dari backend:', e);
    }
  }
  checkIntakeStatus();

  // ============================================================
  // Dynamic 4-Year Intake Angkatan Generator (e.g., current 2026 -> 2026, 2025, 2024, 2023, 2022)
  // ============================================================
  const CURRENT_YEAR = new Date().getFullYear() || 2026;
  const MIN_VALID_YEAR = CURRENT_YEAR - 3; // Maksimal 4 tahun ke belakang
  const MAX_VALID_YEAR = CURRENT_YEAR;

  function populateDynamicAngkatan() {
    if (!angkatanInput) return;
    const currentVal = angkatanInput.value;
    angkatanInput.innerHTML = '';

    for (let year = MAX_VALID_YEAR; year >= MIN_VALID_YEAR; year--) {
      const shortYear = String(year).slice(-2);
      const option = document.createElement('option');
      option.value = String(year);
      option.className = 'bg-[#240d42] text-white';
      option.textContent = `${year} (Angkatan '${shortYear}')`;
      if (currentVal ? String(year) === currentVal : year === MAX_VALID_YEAR) {
        option.selected = true;
      }
      angkatanInput.appendChild(option);
    }
  }
  populateDynamicAngkatan();

  // Helper: NIM Pattern Auto-Detection
  // Pattern: [YY][10][PRODI_CODE][INCREMENT] (Total 10 digits)
  // 510 -> S1 Sistem Informasi
  // 511 -> S1 Informatika
  // 512 -> D3 Sistem Informasi
  // 513 -> S1 Sains Data
  const digitCounter = document.getElementById('nim-digit-counter');
  const detectionBadge = document.getElementById('nim-detection-badge');
  const detectionText = document.getElementById('nim-detection-text');

  function handleNimInput() {
    // Only allow numbers
    let rawNim = (nimInput.value || '').replace(/\D/g, '');
    if (rawNim.length > 10) rawNim = rawNim.slice(0, 10);
    nimInput.value = rawNim;

    // Counter update
    if (digitCounter) {
      if (rawNim.length === 10) {
        digitCounter.textContent = '10/10 digit (Valid)';
        digitCounter.className = 'text-[10px] font-mono font-bold text-emerald-400';
      } else {
        digitCounter.textContent = `${rawNim.length}/10 digit`;
        digitCounter.className = 'text-[10px] font-mono text-gray-400';
      }
    }

    // Auto-populate UPNVJ Email: NIM@mahasiswa.upnvj.ac.id
    if (rawNim.length > 0 && emailInput) {
      emailInput.value = `${rawNim}@mahasiswa.upnvj.ac.id`;
    }

    // Detection when length >= 2 for angkatan and length >= 7 for prodi
    let detectedAngkatan = null;
    let detectedProdi = null;
    let isYearValid = true;
    let yearErrorMsg = '';

    if (rawNim.length >= 2) {
      const yearPrefix = rawNim.slice(0, 2);
      const fullYear = `20${yearPrefix}`;
      const yearNum = parseInt(fullYear, 10);
      detectedAngkatan = fullYear;

      if (isNaN(yearNum) || yearNum < MIN_VALID_YEAR || yearNum > MAX_VALID_YEAR) {
        isYearValid = false;
        if (yearNum > MAX_VALID_YEAR) {
          yearErrorMsg = `Pendaftaran hanya dibuka untuk mahasiswa angkatan ${MIN_VALID_YEAR} - ${MAX_VALID_YEAR}.`;
        } else {
          yearErrorMsg = `Pendaftaran hanya dibuka untuk mahasiswa angkatan ${MIN_VALID_YEAR} - ${MAX_VALID_YEAR}.`;
        }
        nimInput.classList.add('!border-rose-500');
      } else {
        isYearValid = true;
        nimInput.classList.remove('!border-rose-500');

        // Pastikan opsi dropdown sesuai tahun valid tanpa menambahkan opsi fiktif
        if (angkatanInput) {
          angkatanInput.value = fullYear;
        }
      }
    } else {
      nimInput.classList.remove('!border-rose-500');
    }

    if (rawNim.length >= 7) {
      // Format is: YY (2) + 10 (2) + PRODI (3) -> digits at index 4..6
      const prodiCode = rawNim.slice(4, 7);
      if (prodiCode === '501') {
        detectedProdi = 'D3 Sistem Informasi';
      } else if (prodiCode === '511') {
        detectedProdi = 'S1 Informatika';
      } else if (prodiCode === '512') {
        detectedProdi = 'S1 Sistem Informasi';
      } else if (prodiCode === '513') {
        detectedProdi = 'S1 Sains Data';
      }

      if (detectedProdi && prodiInput) {
        prodiInput.value = detectedProdi;
      }
    }

    // Feedback Badge
    if (detectionBadge && detectionText) {
      if (!isYearValid && yearErrorMsg) {
        detectionBadge.classList.remove('hidden');
        detectionBadge.className =
          'text-[11px] mt-1.5 p-1.5 rounded bg-rose-950/70 border border-rose-500/50 text-rose-300 font-medium flex items-center gap-1.5';
        detectionText.innerHTML = `<span class="text-rose-400 font-semibold">${yearErrorMsg}</span>`;
      } else if (rawNim.length === 10 && detectedProdi) {
        detectionBadge.classList.remove('hidden');
        detectionBadge.className =
          'text-[11px] mt-1.5 p-1.5 rounded bg-[#301057]/80 border border-[#7C3AED]/40 text-[#D8B4FE] font-medium flex items-center gap-1.5';
        detectionText.innerHTML = `Terdeteksi: <strong class="text-white">${detectedProdi}</strong> (Angkatan <strong class="text-white">${detectedAngkatan}</strong>)`;
      } else if (rawNim.length >= 7 && detectedProdi) {
        detectionBadge.classList.remove('hidden');
        detectionBadge.className =
          'text-[11px] mt-1.5 p-1.5 rounded bg-[#301057]/80 border border-[#7C3AED]/40 text-[#D8B4FE] font-medium flex items-center gap-1.5';
        detectionText.innerHTML = `Terdeteksi: <strong class="text-white">${detectedProdi}</strong>`;
      } else if (rawNim.length === 10 && !detectedProdi) {
        detectionBadge.classList.remove('hidden');
        detectionBadge.className =
          'text-[11px] mt-1.5 p-1.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1.5';
        detectionText.innerHTML = `<span class="text-amber-300">Format kode prodi UPNVJ tidak dikenali (digit 5-7 bukan 510/511/512/513)</span>`;
      } else {
        detectionBadge.classList.add('hidden');
      }
    }

    updateLiveCard();
  }

  nimInput?.addEventListener('input', handleNimInput);
  nimInput?.addEventListener('paste', () => setTimeout(handleNimInput, 50));

  let uploadedPhotoPath = '';

  const consentCheckbox = document.getElementById('input-consent');
  const submitBtn = document.getElementById('btn-submit-reg');

  function updateSubmitButtonState() {
    if (!submitBtn) return;
    if (consentCheckbox && !consentCheckbox.checked) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitBtn.classList.remove('hover:bg-opacity-90');
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.classList.add('hover:bg-opacity-90');
    }
  }

  consentCheckbox?.addEventListener('change', updateSubmitButtonState);
  updateSubmitButtonState();

  // Handle Photo File Upload & Backend Storage Pipeline (EXIF Stripped, WebP)
  photoFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 2MB!', 'error');
      photoFileInput.value = '';
      return;
    }

    if (photoFilenameLabel) {
      photoFilenameLabel.textContent = `Memproses & sanitasi ${file.name}...`;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/uploads/avatar`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        uploadedPhotoPath = data.path; // 'avatars/<uuid4>.webp'
        if (cardPhoto) {
          cardPhoto.src = `${API_BASE_URL}/${data.path}`;
        }
        if (photoFilenameLabel) {
          photoFilenameLabel.textContent = `✓ ${file.name}`;
          photoFilenameLabel.classList.add('text-emerald-300');
        }
        showToast('Foto profil berhasil diunggah.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Gagal mengunggah foto: ${err.detail || 'Format file tidak didukung'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal terhubung ke server penyimpanan.', 'error');
    }
  });

  // Handle CV / Resume File Upload (Uploads to Backend Storage)
  cvFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas CV maksimal 5MB!', 'error');
      cvFileInput.value = '';
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Format berkas CV harus PDF!', 'error');
      cvFileInput.value = '';
      return;
    }

    uploadedCvName = file.name;
    cvUploadInProgress = true;
    if (cvFilenameLabel) {
      cvFilenameLabel.textContent = `Mengunggah ${file.name}...`;
      cvFilenameLabel.classList.remove('text-emerald-300');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/uploads/cv`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        uploadedCvPath = data.path; // e.g. 'cvs/uuid.pdf'
        if (cvFilenameLabel) {
          cvFilenameLabel.textContent = `✓ ${file.name}`;
          cvFilenameLabel.classList.add('text-emerald-300');
        }
        showToast(`Berkas CV "${file.name}" berhasil diunggah ke server.`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Gagal mengunggah CV: ${err.detail || 'Format file tidak didukung'}`, 'error');
        if (cvFilenameLabel) {
          cvFilenameLabel.textContent = 'Upload CV (.PDF)';
          cvFilenameLabel.classList.remove('text-emerald-300');
        }
        uploadedCvPath = '';
      }
    } catch (err) {
      console.error('CV Upload Error:', err);
      showToast('Gagal terhubung ke server penyimpanan CV.', 'error');
      if (cvFilenameLabel) {
        cvFilenameLabel.textContent = 'Upload CV (.PDF)';
        cvFilenameLabel.classList.remove('text-emerald-300');
      }
      uploadedCvPath = '';
    } finally {
      cvUploadInProgress = false;
    }
  });

  // Live Motivation Sentence & Word Counter
  const motivationCounter = document.getElementById('motivation-counter');
  const motivationWarning = document.getElementById('motivation-warning');

  function checkMotivationLimits(text) {
    const clean = (text || '').trim();
    // const sentences = clean ? clean.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0) : [];
    const words = clean ? clean.split(/\s+/).filter(w => w.length > 0) : [];
    return {
      words: words.length,
      valid: words.length <= 150
    };
  }

  motivationInput?.addEventListener('input', () => {
    const { words, valid } = checkMotivationLimits(motivationInput.value);
    if (motivationCounter) {
      motivationCounter.textContent = `${words}/150 Kata`;
      if (!valid) {
        motivationCounter.className = 'text-[11px] font-mono font-bold text-rose-400';
      } else {
        motivationCounter.className = 'text-[11px] font-mono text-[#C9A4F6]';
      }
    }
    if (motivationWarning) {
      if (!valid) {
        const msg = 'Maksimal 150 kata.';
        motivationWarning.textContent = msg;
        motivationWarning.classList.remove('hidden');
        motivationInput.classList.add('!border-rose-500');
      } else {
        motivationWarning.classList.add('hidden');
        motivationInput.classList.remove('!border-rose-500');
      }
    }
  });

  // Live Mirror to Member Card
  function updateLiveCard() {
    if (cardName) cardName.textContent = nameInput?.value.trim() || 'Nama Mahasiswa';
    if (cardNim) cardNim.textContent = nimInput?.value.trim() || '2410511088';
    if (cardProdi) cardProdi.textContent = prodiInput?.value || 'S1 Informatika';
    if (cardTrack) cardTrack.textContent = trackInput?.value || 'IoT Embedded';
  }

  [nimInput, nameInput, prodiInput, trackInput].forEach(el => {
    el?.addEventListener('input', updateLiveCard);
    el?.addEventListener('change', updateLiveCard);
  });

  // Submit Handler - Direct Database Endpoint Hit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (consentCheckbox && !consentCheckbox.checked) {
      showToast('Anda harus menyetujui pernyataan dan persetujuan pengolahan data untuk melanjutkan!', 'warning');
      consentCheckbox.focus();
      return;
    }

    const { valid: isMotivationValid } = checkMotivationLimits(motivationInput?.value || '');
    if (!isMotivationValid) {
      showToast('Teks motivasi maksimal 150 kata.', 'warning');
      motivationInput.focus();
      return;
    }

    if (cvUploadInProgress) {
      showToast('Tunggu sampai upload CV selesai sebelum mengirim formulir.', 'warning');
      return;
    }

    const originalBtnText = submitBtn?.innerHTML || 'Kirim Formulir Pendaftaran';

    const motivationText = motivationInput?.value.trim() || '';

    const rawNim = nimInput.value.trim().replace(/\D/g, '');
    if (rawNim.length !== 10) {
      showToast('NIM Mahasiswa harus terdiri dari tepat 10 digit angka!', 'error');
      nimInput.focus();
      return;
    }

    const yearPrefix = rawNim.slice(0, 2);
    const nimYear = parseInt(`20${yearPrefix}`, 10);
    if (isNaN(nimYear) || nimYear < MIN_VALID_YEAR || nimYear > MAX_VALID_YEAR) {
      showToast(
        `Tahun angkatan dari NIM (${nimYear || 'tidak valid'}) di luar batas pendaftaran (maksimal 4 tahun ke belakang: ${MIN_VALID_YEAR} - ${MAX_VALID_YEAR})!`,
        'error'
      );
      nimInput.focus();
      return;
    }

    const selectedAngkatan = parseInt(angkatanInput?.value, 10);
    if (isNaN(selectedAngkatan) || selectedAngkatan < MIN_VALID_YEAR || selectedAngkatan > MAX_VALID_YEAR) {
      showToast(
        `Pilihan tahun angkatan harus berada dalam rentang ${MIN_VALID_YEAR} - ${MAX_VALID_YEAR}!`,
        'error'
      );
      angkatanInput?.focus();
      return;
    }

    const portfolioInput = document.getElementById('input-portfolio');
    const payload = {
      student_id: rawNim,
      full_name: nameInput.value.trim(),
      program_of_study: prodiInput.value,
      email: emailInput.value.trim(),
      contact_info: phoneInput.value.trim(),
      intake_period: angkatanInput.value,
      interest_track: trackInput.value,
      motivation: motivationText,
      photo: uploadedPhotoPath || null,
      cv_url: uploadedCvPath || null,
      portfolio_url: portfolioInput ? portfolioInput.value.trim() || null : null,
      consent_given: true
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-flex items-center space-x-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan pendaftaran...</span></span>`;
        initIcons();
      }

      const res = await fetch(`${API_BASE_URL}/registrations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Pendaftaran berhasil dikirim! NIM: ${data.student_id}`, 'success');

        // Stepper: Set Step 1, 2, 3 as active/completed
        const stepIcon1 = document.getElementById('step-icon-1');
        const stepIcon2 = document.getElementById('step-icon-2');
        const stepIcon3 = document.getElementById('step-icon-3');
        const stepLine1 = document.getElementById('step-line-1');
        const stepLabel3 = document.getElementById('step-label-3');

        if (stepLine1) {
          stepLine1.style.width = '100%';
        }
        if (stepIcon2) {
          stepIcon2.className = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#9B5CE8] text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-[#1E0A38]';
        }
        if (stepIcon3) {
          stepIcon3.className = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-[#1E0A38]';
          stepIcon3.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
        }
        if (stepLabel3) {
          stepLabel3.className = 'text-[10px] sm:text-[11px] font-bold text-emerald-400 mt-2 font-mono leading-tight';
        }

        // Switch to Step 3: Thank You / Terima Kasih View
        const mainGrid = document.getElementById('registration-main-grid');
        const successContainer = document.getElementById('step-3-success-container');
        if (mainGrid && successContainer) {
          mainGrid.classList.add('hidden');
          successContainer.classList.remove('hidden');

          const sNim = document.getElementById('success-nim');
          const sName = document.getElementById('success-name');
          const sProdi = document.getElementById('success-prodi');
          const sTrack = document.getElementById('success-track');

          if (sNim) sNim.textContent = data.student_id || rawNim;
          if (sName) sName.textContent = data.full_name || nameInput.value;
          if (sProdi) sProdi.textContent = prodiInput.value;
          if (sTrack) sTrack.textContent = trackInput.value;

          initIcons();

          // Smooth scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // 5-second countdown to auto redirect to /orion/
          let countdown = 5;
          const countdownEl = document.getElementById('redirect-countdown');
          const timer = setInterval(() => {
            countdown -= 1;
            if (countdownEl) countdownEl.textContent = String(countdown);
            if (countdown <= 0) {
              clearInterval(timer);
              window.location.href = APP_BASE_URL;
            }
          }, 1000);
        }

        form.reset();
        uploadedPhotoBase64 = '';
        uploadedCvName = '';
        uploadedCvPath = '';
        if (photoFilenameLabel) photoFilenameLabel.textContent = 'Pilih Foto (.JPG, .PNG)';
        if (cvFilenameLabel) {
          cvFilenameLabel.textContent = 'Upload CV (.PDF)';
          cvFilenameLabel.classList.remove('text-emerald-300');
        }
        updateLiveCard();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal mengirim pendaftaran.', 'error');
      }
    } catch (err) {
      console.error('Registration API Error:', err);
      showToast('Gagal terhubung ke server. Silakan coba beberapa saat lagi.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        initIcons();
      }
    }
  });

  // ==========================================
  // SYNCED UI LOGIC FROM INDEX
  // ==========================================
  // Mobile Menu Logic
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('open');
    if (mobileMenuBtn.classList.contains('open')) {
      mobileMenu.classList.remove('scale-y-0', 'opacity-0');
      mobileMenu.classList.add('scale-y-100', 'opacity-100');
    } else {
      mobileMenu.classList.remove('scale-y-100', 'opacity-100');
      mobileMenu.classList.add('scale-y-0', 'opacity-0');
    }
  });

  // Hide Header on Scroll Down
  const mainHeader = document.getElementById('main-header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (!mainHeader) return;
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      mainHeader.classList.add('-translate-y-full');
    } else {
      mainHeader.classList.remove('-translate-y-full');
    }
    lastScrollY = currentScrollY;
  });

  // Login Modal Logic
  const loginModal = document.getElementById('login-modal');
  const openLoginBtns = document.querySelectorAll('.open-login-modal');
  const closeLoginBtn = document.getElementById('close-login-modal');
  const loginForm = document.getElementById('login-form');

  if (loginModal) {
    const toggleModal = (show) => {
      if (show) {
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
        void loginModal.offsetWidth;
        loginModal.classList.remove('opacity-0');
        loginModal.classList.add('opacity-100');
        const inner = loginModal.querySelector('div');
        if (inner) {
          inner.classList.remove('scale-95', 'opacity-0');
          inner.classList.add('scale-100', 'opacity-100');
        }
      } else {
        loginModal.classList.remove('opacity-100');
        loginModal.classList.add('opacity-0');
        const inner = loginModal.querySelector('div');
        if (inner) {
          inner.classList.remove('scale-100', 'opacity-100');
          inner.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
          loginModal.classList.remove('flex');
          loginModal.classList.add('hidden');
        }, 300);
      }
    };

    openLoginBtns.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleModal(true);
    }));
    closeLoginBtn?.addEventListener('click', () => toggleModal(false));
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) toggleModal(false);
    });

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = document.getElementById('login-nim').value;
      const password = document.getElementById('login-password').value;
      const btn = loginForm.querySelector('button[type="submit"]');

      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center space-x-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Loading...</span></span>`;
      initIcons();

      const success = await login(studentId, password);

      btn.disabled = false;
      btn.innerHTML = originalText;
      initIcons();

      if (success) {
        window.location.href = `${APP_BASE_URL}pages/members.html`;
      }
    });
  }

});
