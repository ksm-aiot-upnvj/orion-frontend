import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons, resolveAvatarUrl } from '../modules/ui.js';
import { getAuthToken, getAuthUser } from '../modules/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let userProfile = null;
let selectedAvatarPath = '';

function setProfileAvatarPreview(path, seed = 'orion') {
  const preview = document.getElementById('profile-form-avatar-preview');
  if (!preview) return;

  const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=240d42`;
  preview.src = path ? resolveAvatarUrl(path, seed) : fallback;
  preview.onerror = () => {
    preview.onerror = null;
    preview.src = fallback;
  };
}

async function fetchUserProfile() {
  const localUser = getAuthUser();
  const token = getAuthToken();

  try {
    if (token) {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        userProfile = await res.json();
        localStorage.setItem('ksm_user', JSON.stringify(userProfile));
      } else {
        userProfile = localUser;
      }
    } else {
      userProfile = localUser;
    }
  } catch {
    userProfile = localUser;
  }

  populateProfileUI(userProfile);
}

function populateProfileUI(user) {
  if (!user) return;

  selectedAvatarPath = user.avatar || '';

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.student_id || 'orion')}&backgroundColor=240d42`;
  const avatarUrl = resolveAvatarUrl(user.avatar, user.student_id || 'orion');

  // Left Card Overview
  const cardAvatar = document.getElementById('profile-card-avatar');
  if (cardAvatar) {
    cardAvatar.src = avatarUrl;
    cardAvatar.onerror = () => {
      cardAvatar.onerror = null;
      cardAvatar.src = defaultAvatar;
    };
  }

  const cardName = document.getElementById('profile-card-name');
  if (cardName) cardName.textContent = user.full_name || 'Pengurus KSM';

  const cardNim = document.getElementById('profile-card-nim');
  if (cardNim) cardNim.textContent = `NIM: ${user.student_id || '-'}`;

  const cardRole = document.getElementById('profile-card-role');
  if (cardRole) cardRole.textContent = user.role || 'ANGGOTA';

  const cardDivision = document.getElementById('profile-card-division');
  if (cardDivision) cardDivision.textContent = user.division ? `Divisi ${user.division}` : 'Non-Divisi (Anggota Biasa)';

  const cardEmail = document.getElementById('profile-card-email');
  if (cardEmail) cardEmail.textContent = user.email || '-';

  // Right Edit Form
  const formNim = document.getElementById('form-nim-disabled');
  if (formNim) formNim.value = user.student_id || '';

  const formFullName = document.getElementById('form-full-name');
  if (formFullName) formFullName.value = user.full_name || '';

  const formEmail = document.getElementById('form-email');
  if (formEmail) formEmail.value = user.email || '';

  const formAvatar = document.getElementById('form-avatar-url');
  if (formAvatar) formAvatar.value = user.avatar || '';
  setProfileAvatarPreview(user.avatar, user.student_id || 'orion');

  const seedInput = document.getElementById('avatar-seed-input');
  if (seedInput) seedInput.value = user.student_id || '';

  initIcons();
}

function setupProfileAvatarUpload() {
  const fileInput = document.getElementById('profile-avatar-file');
  const filename = document.getElementById('profile-avatar-filename');

  fileInput?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 2MB.', 'error');
      fileInput.value = '';
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast('Format foto harus PNG, JPG, atau WebP.', 'error');
      fileInput.value = '';
      return;
    }

    if (filename) filename.textContent = `Mengunggah ${file.name}...`;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/uploads/avatar`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Gagal mengunggah foto profil.');
      }

      const data = await res.json();
      selectedAvatarPath = data.path || '';
      setProfileAvatarPreview(selectedAvatarPath, userProfile?.student_id || 'orion');
      const avatarUrlInput = document.getElementById('form-avatar-url');
      if (avatarUrlInput) avatarUrlInput.value = selectedAvatarPath;
      if (filename) filename.textContent = `✓ ${file.name}`;
      showToast('Foto profil berhasil diunggah. Klik Simpan Perubahan untuk menerapkan.', 'success');
    } catch (error) {
      if (filename) filename.textContent = 'Foto saat ini dipertahankan jika tidak diganti.';
      showToast(error.message || 'Gagal mengunggah foto profil.', 'error');
    }
  });
}

// Avatar Generator Button
function setupAvatarGenerator() {
  const seedInput = document.getElementById('avatar-seed-input');
  const generateBtn = document.getElementById('btn-generate-avatar');
  const cardAvatar = document.getElementById('profile-card-avatar');
  const formAvatar = document.getElementById('form-avatar-url');

  generateBtn?.addEventListener('click', () => {
    const seed = seedInput?.value.trim() || Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=240d42`;
    if (cardAvatar) cardAvatar.src = newAvatarUrl;
    if (formAvatar) formAvatar.value = newAvatarUrl;
    showToast('Avatar dipilih. Klik "Simpan Perubahan" untuk menerapkan.', 'info');
  });
}

// Form 1: Edit Profile Submit
function setupProfileEditForm() {
  const form = document.getElementById('profile-edit-form');
  const submitBtn = document.getElementById('btn-save-profile');
  const labelEl = document.getElementById('btn-save-profile-label');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getAuthToken();

    const fullName = document.getElementById('form-full-name')?.value.trim();
    const email = document.getElementById('form-email')?.value.trim();
    const avatar = document.getElementById('form-avatar-url')?.value.trim() || selectedAvatarPath || null;

    if (!fullName || !email) {
      showToast('Nama Lengkap dan Email wajib diisi!', 'error');
      return;
    }

    submitBtn.disabled = true;
    labelEl.textContent = 'Menyimpan...';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          avatar: avatar
        })
      });

      if (res.ok) {
        const updated = await res.json();
        userProfile = updated;
        localStorage.setItem('ksm_user', JSON.stringify(updated));
        localStorage.setItem('aiot_auth_user', JSON.stringify(updated));
        populateProfileUI(updated);
        showToast('Profil akun berhasil diperbarui!', 'success');
      } else {
        const err = await res.json();
        showToast(`Gagal memperbarui profil: ${err.detail || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      labelEl.textContent = 'Simpan Perubahan';
    }
  });
}

// Form 2: Password Change Submit
function setupPasswordChangeForm() {
  const form = document.getElementById('password-change-form');
  const submitBtn = document.getElementById('btn-save-password');
  const labelEl = document.getElementById('btn-save-password-label');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getAuthToken();

    const currentPassword = document.getElementById('form-current-password')?.value;
    const newPassword = document.getElementById('form-new-password')?.value;
    const confirmPassword = document.getElementById('form-confirm-password')?.value;

    if (!currentPassword || !newPassword) {
      showToast('Harap isi kata sandi saat ini dan kata sandi baru!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok!', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter!', 'error');
      return;
    }

    submitBtn.disabled = true;
    labelEl.textContent = 'Memperbarui...';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        showToast('Kata sandi berhasil diperbarui.', 'success');
        form.reset();
      } else {
        const err = await res.json();
        showToast(`Gagal mengganti kata sandi: ${err.detail || 'Password lama salah'}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      labelEl.textContent = 'Perbarui Kata Sandi';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('profile', 'Profil & Pengaturan Akun');
  fetchUserProfile();
  setupAvatarGenerator();
  setupProfileAvatarUpload();
  setupProfileEditForm();
  setupPasswordChangeForm();
});
