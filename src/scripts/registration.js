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
  populateDynamicAngkatan();

  // Smart Auto-detection from NIM (First 2 digits -> Angkatan, digits -> Prodi)
  nimInput?.addEventListener('input', () => {
    const rawNim = nimInput.value.trim();
    if (rawNim.length >= 2) {
      const prefixYear = '20' + rawNim.slice(0, 2);
      const matchingOption = Array.from(angkatanInput?.options || []).find(opt => opt.value === prefixYear);
      if (matchingOption && angkatanInput.value !== prefixYear) {
        angkatanInput.value = prefixYear;
        showToast(`Tahun angkatan otomatis terdeteksi: ${prefixYear}`, 'info');
      }
    }

    // Auto-detect prodi UPNVJ if match prefix (2410511... / 2410512...)
    if (rawNim.length >= 7 && prodiInput) {
      if (rawNim.includes('10511') || rawNim.includes('511')) {
        prodiInput.value = 'S1 Informatika';
      } else if (rawNim.includes('10512') || rawNim.includes('512')) {
        prodiInput.value = 'S1 Sistem Informasi';
      } else if (rawNim.includes('10513') || rawNim.includes('513')) {
        prodiInput.value = 'S1 Sains Data';
      } else if (rawNim.includes('00511') || rawNim.includes('051')) {
        prodiInput.value = 'D3 Sistem Informasi';
      }
    }

    updateLiveCard();
  });

  // Handle Photo File Upload & Base64 Conversion
  photoFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 2MB!', 'error');
      photoFileInput.value = '';
      return;
    }

    if (photoFilenameLabel) {
      photoFilenameLabel.textContent = file.name;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedPhotoBase64 = event.target.result;
      if (cardPhoto) {
        cardPhoto.src = uploadedPhotoBase64;
      }
      showToast('Foto berhasil dimuat ke kartu preview!', 'info');
    };
    reader.readAsDataURL(file);
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
    showToast(`Berkas CV "${file.name}" siap diunggah.`, 'info');
  });

  // Live Mirror to Member Card
  function updateLiveCard() {
    if (cardName) cardName.textContent = nameInput?.value.trim() || 'Nama Mahasiswa';
    if (cardNim) cardNim.textContent = nimInput?.value.trim() || '2410511088';
    if (cardProdi) cardProdi.textContent = prodiInput?.value || 'S1 Informatika';
    if (cardTrack) cardTrack.textContent = trackInput?.value || 'Hardware & IoT';
  }

  [nimInput, nameInput, prodiInput, trackInput].forEach(el => {
    el?.addEventListener('input', updateLiveCard);
    el?.addEventListener('change', updateLiveCard);
  });

  // Submit Handler - Direct Database Endpoint Hit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.innerHTML || 'Kirim Formulir Pendaftaran';

    const photoPayload = uploadedPhotoBase64 || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';
    let motivationText = motivationInput?.value.trim() || '';
    if (uploadedCvName) {
      motivationText += ` [Lampiran Berkas: ${uploadedCvName}]`;
    }

    const payload = {
      student_id: nimInput.value.trim(),
      full_name: nameInput.value.trim(),
      program_of_study: prodiInput.value,
      email: emailInput.value.trim(),
      contact_info: phoneInput.value.trim(),
      intake_period: angkatanInput.value,
      interest_track: trackInput.value,
      motivation: motivationText,
      photo: photoPayload
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
});
