import { showToast } from './ui.js';

const AUTH_USER_KEY = 'aiot_auth_user';
const AUTH_TOKEN_KEY = 'aiot_auth_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
const APP_BASE_URL = import.meta.env.BASE_URL;

let sessionTimerId = null;
let sessionCheckIntervalId = null;

/**
 * Safely parse base64url JWT payload
 */
export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Gagal membaca payload token:', err);
    return null;
  }
}

/**
 * Check if the stored JWT token has expired
 */
export function isTokenExpired(token = getAuthToken()) {
  if (!token) return true;
  if (token === 'dev-mock-jwt-token') return false;

  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds; check with a 5-second buffer for clock skew
  const expirationMs = payload.exp * 1000;
  return Date.now() >= expirationMs - 5000;
}

/**
 * Get remaining milliseconds until the current token expires
 */
export function getTokenRemainingTime(token = getAuthToken()) {
  if (!token || token === 'dev-mock-jwt-token') return Infinity;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return 0;
  const remaining = payload.exp * 1000 - Date.now();
  return Math.max(0, remaining);
}

/**
 * Get currently authenticated user object from localStorage
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get JWT access token from localStorage
 */
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Clear stored auth session from localStorage
 */
export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  if (sessionTimerId) clearTimeout(sessionTimerId);
  if (sessionCheckIntervalId) clearInterval(sessionCheckIntervalId);
}

/**
 * Check if a valid session exists and is unexpired
 */
export function isAuthenticated() {
  const user = getAuthUser();
  const token = getAuthToken();
  return !!user && !!token && !isTokenExpired(token);
}

/**
 * Perform login using NIM/Email & Password against backend API
 * Falls back to dev session if backend is temporarily unreachable.
 */
export async function login(studentId, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: studentId.trim(),
        password: password
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user && data.user.role === 'Anggota') {
        return {
          success: false,
          message: 'Akun Anda terdaftar sebagai Anggota Umum dan tidak memiliki akses ke CRM Internal.'
        };
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.detail || 'NIM / Password tidak valid. Silakan coba lagi.'
    };
  } catch {
    // Development offline fallback for seamless pairing
    if (studentId.trim() === '2310511001' && password === 'aiotupnvj2026') {
      const fallbackUser = {
        id: '01a04935-646a-779a-a858-ca2f001ed71e',
        student_id: '2310511001',
        full_name: 'Dzulfikri Adjmal',
        email: 'dzulfikri@mahasiswa.upnvj.ac.id',
        role: 'SUPERADMIN',
        division: 'BPH',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        is_active: true
      };
      localStorage.setItem(AUTH_TOKEN_KEY, 'dev-mock-jwt-token');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser };
    }
    return {
      success: false,
      message: 'Gagal terhubung ke server autentikasi backend.'
    };
  }
}

/**
 * Logout pengurus session and redirect to landing page
 */
export function logout(redirect = true) {
  clearAuthSession();
  showToast('Anda telah berhasil keluar (Logout).', 'info');
  if (redirect) {
    setTimeout(() => {
      window.location.href = `${APP_BASE_URL}index.html`;
    }, 400);
  }
}

/**
 * Route guard: Protect internal CRM pages from unauthenticated or expired access
 */
export function requireAuth() {
  const user = getAuthUser();
  const token = getAuthToken();

  if (!user || !token) {
    showToast('Akses Dibatasi: Silakan login sebagai Pengurus KSM.', 'error');
    setTimeout(() => {
      window.location.href = `${APP_BASE_URL}index.html?login_required=1`;
    }, 600);
    return false;
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
    setTimeout(() => {
      window.location.href = `${APP_BASE_URL}index.html?login_required=1&expired=1`;
    }, 600);
    return false;
  }

  if (user.role === 'Anggota') {
    showToast('Akses Ditolak: Anggota Umum tidak memiliki hak akses ke CRM Internal.', 'error');
    logout();
    return false;
  }
  return true;
}

/**
 * Real-time Proactive Session Expiry Watcher
 * Watches active token and triggers callback when token reaches expiration
 */
export function initSessionWatcher(onSessionExpired) {
  const token = getAuthToken();
  if (!token || token === 'dev-mock-jwt-token') return;

  if (sessionTimerId) clearTimeout(sessionTimerId);
  if (sessionCheckIntervalId) clearInterval(sessionCheckIntervalId);

  const remaining = getTokenRemainingTime(token);
  if (remaining <= 0) {
    if (typeof onSessionExpired === 'function') {
      onSessionExpired();
    }
    return;
  }

  // Set timeout for exact expiry
  sessionTimerId = setTimeout(() => {
    if (typeof onSessionExpired === 'function') {
      onSessionExpired();
    }
  }, remaining);

  // Fallback periodic check every 15 seconds (handles system sleep / background tab resume)
  sessionCheckIntervalId = setInterval(() => {
    if (isTokenExpired(getAuthToken())) {
      clearInterval(sessionCheckIntervalId);
      if (sessionTimerId) clearTimeout(sessionTimerId);
      if (typeof onSessionExpired === 'function') {
        onSessionExpired();
      }
    }
  }, 15000);
}
