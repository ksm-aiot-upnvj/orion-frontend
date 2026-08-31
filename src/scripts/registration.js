import { login } from '../modules/auth.js';
import { initIcons, showToast } from '../modules/ui.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

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

  // ============================================================
  // Intake Status Verification (Controlled by BPH Control Panel)
  // ============================================================
  const savedConfig = localStorage.getItem('ksm_intake_config');
  let intakeConfig = {
    status: 'OPEN',
    batchName: 'Penerimaan Anggota Baru Periode 2026',
    deadline: '31 Agustus 2026'
  };
  if (savedConfig) {
    try { intakeConfig = { ...intakeConfig, ...JSON.parse(savedConfig) }; } catch {}
  }

  const closedBanner = document.getElementById('intake-closed-banner');
  const formHeader = document.getElementById('form-header-box');
  if (intakeConfig.status === 'CLOSED') {
    if (form) form.classList.add('opacity-50', 'pointer-events-none');
    if (formHeader) formHeader.classList.add('hidden');
    if (closedBanner) closedBanner.classList.remove('hidden');
  }

  // ============================================================
  // Dynamic 4-Year Intake Angkatan Generator (e.g., 2026 -> 26, 25, 24, 23)
  // ============================================================
  function populateDynamicAngkatan() {
    if (!angkatanInput) return;
    const currentYear = new Date().getFullYear() || 2026;
    angkatanInput.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const year = currentYear - i;
      const shortYear = String(year).slice(-2);
      const option = document.createElement('option');
      option.value = String(year);
      option.className = 'bg-[#240d42] text-white';
      option.textContent = `${year} (Angkatan '${shortYear})`;
      if (i === 0) option.selected = true;
      angkatanInput.appendChild(option);
    }
  }
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

    if (rawNim.length >= 2) {
      const yearPrefix = rawNim.slice(0, 2);
      const fullYear = `20${yearPrefix}`;
      detectedAngkatan = fullYear;

      let matchingOption = Array.from(angkatanInput?.options || []).find((opt) => opt.value === fullYear);
      if (!matchingOption && angkatanInput) {
        const newOpt = document.createElement('option');
        newOpt.value = fullYear;
        newOpt.className = 'bg-[#240d42] text-white';
        newOpt.textContent = `${fullYear} (Angkatan '${yearPrefix})`;
        angkatanInput.appendChild(newOpt);
      }
      if (angkatanInput) angkatanInput.value = fullYear;
    }

    if (rawNim.length >= 7) {
      // Format is: YY (2) + 10 (2) + PRODI (3) -> digits at index 4..6
      const prodiCode = rawNim.slice(4, 7);
      if (prodiCode === '510') {
        detectedProdi = 'S1 Sistem Informasi';
      } else if (prodiCode === '511') {
        detectedProdi = 'S1 Informatika';
      } else if (prodiCode === '512') {
        detectedProdi = 'D3 Sistem Informasi';
      } else if (prodiCode === '513') {
        detectedProdi = 'S1 Sains Data';
      }

      if (detectedProdi && prodiInput) {
        prodiInput.value = detectedProdi;
      }
    }

    // Feedback Badge
    if (detectionBadge && detectionText) {
      if (rawNim.length === 10 && detectedProdi) {
        detectionBadge.classList.remove('hidden');
        detectionText.innerHTML = `Terdeteksi: <strong class="text-white">${detectedProdi}</strong> (Angkatan <strong class="text-white">${detectedAngkatan}</strong>)`;
      } else if (rawNim.length >= 7 && detectedProdi) {
        detectionBadge.classList.remove('hidden');
        detectionText.innerHTML = `Terdeteksi: <strong class="text-white">${detectedProdi}</strong>`;
      } else if (rawNim.length === 10 && !detectedProdi) {
        detectionBadge.classList.remove('hidden');
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
          photoFilenameLabel.textContent = `✓ ${file.name} (WebP / EXIF Stripped)`;
          photoFilenameLabel.classList.add('text-emerald-300');
        }
        showToast('Foto berhasil diproses & dibersihkan dari metadata EXIF (UU PDP)!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Gagal memproses foto: ${err.detail || 'Format file tidak didukung'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal terhubung ke storage server backend.', 'error');
    }
  });

  // Handle CV / Resume File Upload
  cvFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas CV maksimal 5MB!', 'error');
      cvFileInput.value = '';
      return;
    }

    uploadedCvName = file.name;
    if (cvFilenameLabel) {
      cvFilenameLabel.textContent = `✓ ${file.name}`;
      cvFilenameLabel.classList.add('text-emerald-300');
    }
    showToast(`Berkas CV "${file.name}" siap dilampirkan.`, 'info');
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

    const originalBtnText = submitBtn?.innerHTML || 'Kirim Formulir Pendaftaran';

    let motivationText = motivationInput?.value.trim() || '';
    if (uploadedCvName) {
      motivationText += ` [Lampiran Berkas: ${uploadedCvName}]`;
    }

    const rawNim = nimInput.value.trim().replace(/\D/g, '');
    if (rawNim.length !== 10) {
      showToast('NIM Mahasiswa harus terdiri dari tepat 10 digit angka!', 'error');
      nimInput.focus();
      return;
    }

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
      consent_given: true
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-flex items-center space-x-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan ke Database...</span></span>`;
        initIcons();
      }

      const res = await fetch(`${API_BASE_URL}/registrations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Pendaftaran Berhasil! Data NIM ${data.student_id} resmi tersimpan di database.`, 'success');
        if (stepIcon2) {
          stepIcon2.className = 'w-8 h-8 rounded-full bg-[#9B5CE8] text-white flex items-center justify-center font-bold text-xs shadow-sm';
        }
        form.reset();
        uploadedPhotoBase64 = '';
        uploadedCvName = '';
        if (photoFilenameLabel) photoFilenameLabel.textContent = 'Pilih file (JPG / PNG, maks 2MB)';
        if (cvFilenameLabel) {
          cvFilenameLabel.textContent = 'Pilih file (PDF, maks 5MB)';
          cvFilenameLabel.classList.remove('text-emerald-300');
        }
        updateLiveCard();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Gagal menyimpan pendaftaran ke database.', 'error');
      }
    } catch (err) {
      console.error('Registration API Error:', err);
      showToast('Koneksi backend gagal. Pastikan server API aktif di port 8000!', 'error');
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
        window.location.href = '/pages/dashboard.html';
      }
    });
  }

});
