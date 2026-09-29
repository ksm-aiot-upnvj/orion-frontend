import { showToast } from './ui.js';

const AUTH_USER_KEY = 'aiot_auth_user';
const AUTH_TOKEN_KEY = 'aiot_auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'aiot_refresh_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';
const APP_BASE_URL = import.meta.env.BASE_URL;

let sessionTimerId = null;
let sessionCheckIntervalId = null;
let isRefreshing = false;
let refreshPromise = null;
let visibilityRefreshHandler = null;

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
 * Get long-lived JWT refresh token from localStorage
 */
export function getRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

/**
 * Clear stored auth session from localStorage
 */
export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  if (sessionTimerId) clearTimeout(sessionTimerId);
  if (sessionCheckIntervalId) clearInterval(sessionCheckIntervalId);
  if (visibilityRefreshHandler) {
    window.removeEventListener('focus', visibilityRefreshHandler);
    document.removeEventListener('visibilitychange', visibilityRefreshHandler);
    visibilityRefreshHandler = null;
  }
}

/**
 * Refresh current access token using the 7-day refresh token
 * Seamlessly extends user session without prompting re-login
 */
export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken || refreshToken === 'dev-mock-jwt-token') return false;

  // Prevent multiple concurrent refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (!data.access_token) return false;
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      }
      return true;
    } catch (err) {
      console.warn('Gagal memperpanjang sesi via refresh token:', err);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Check if a valid session exists (either access token or valid refresh token)
 */
export function isAuthenticated() {
  const user = getAuthUser();
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  return !!user && ((!!token && !isTokenExpired(token)) || (!!refreshToken && !isTokenExpired(refreshToken)));
}

/** Return a usable access token, refreshing it first when it has expired. */
export async function getValidAccessToken() {
  let token = getAuthToken();
  if (token && !isTokenExpired(token)) return token;
  if (!(await refreshSession())) return null;
  token = getAuthToken();
  return token && !isTokenExpired(token) ? token : null;
}

/**
 * Perform login using NIM/Email & Password against backend API
 * Saves both 30-minute access_token and 7-day refresh_token.
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
      const user = data.user;

      if (user) {
        if (!user.is_active) {
          return {
            success: false,
            message: 'Akun Anda saat ini tidak aktif. Silakan hubungi admin untuk bantuan.'
          };
        }

        // Store tokens
        if (data.access_token) {
          localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, data.refresh_token);
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

        if (user.is_superadmin === true) {
          return {
            success: true,
            user: user,
            message: 'Login berhasil sebagai SUPERADMIN. Anda memiliki akses penuh ke sistem.'
          };
        }

        const restrictedRoles = ['Anggota', 'Guest'];
        if (restrictedRoles.includes(user.role)) {
          clearAuthSession();
          return {
            success: false,
            message: 'Akses Ditolak: Akun Anda tidak memiliki hak akses ke CRM Internal.'
          };
        }

        return { success: true, user: user };
      }

      return {
        success: false,
        message: 'Gagal mendapatkan informasi pengguna. Silakan coba lagi.'
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.detail || 'NIM / Password tidak valid. Silakan coba lagi.'
    };
  } catch {
    // Development offline fallback
    if (studentId.trim() === '2310511001' && password === 'aiotupnvj2026') {
      const fallbackUser = {
        id: '01a04935-646a-779a-a858-ca2f001ed71e',
        student_id: '2310511001',
        full_name: 'Dzulfikri Adjmal',
        email: 'dzulfikri@mahasiswa.upnvj.ac.id',
        role: 'SUPERADMIN',
        division: 'BPH',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        is_superadmin: true,
        is_active: true
      };
      localStorage.setItem(AUTH_TOKEN_KEY, 'dev-mock-jwt-token');
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'dev-mock-refresh-token');
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
      window.location.href = `${APP_BASE_URL}`;
    }, 400);
  }
}

/**
 * Route guard: Protect internal CRM pages from unauthenticated or expired access
 */
export function requireAuth() {
  const user = getAuthUser();
  const token = getAuthToken();
  const refreshToken = getRefreshToken();

  if (!user || (!token && !refreshToken)) {
    showToast('Akses Dibatasi: Silakan login sebagai Pengurus KSM.', 'error');
    setTimeout(() => {
      window.location.href = `${APP_BASE_URL}?login_required=1`;
    }, 600);
    return false;
  }

  if (isTokenExpired(token)) {
    if (refreshToken && !isTokenExpired(refreshToken)) {
      // Proactively refresh in background
      refreshSession();
      return true;
    }

    clearAuthSession();
    showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
    setTimeout(() => {
      window.location.href = `${APP_BASE_URL}?login_required=1&expired=1`;
    }, 600);
    return false;
  }

  if (user.is_superadmin === true) {
    return true;
  }

  const allowedRoles = [
    'SUPERADMIN',
    'Ketua',
    'Wakil Ketua',
    'Sekretaris',
    'Bendahara',
    'Kepala Divisi',
    'Staff'
  ];

  if (!allowedRoles.includes(user.role)) {
    showToast(`Akses Ditolak: Role "${user.role || 'Tidak Dikenal'}" tidak memiliki hak akses ke CRM Internal.`, 'error');
    logout();
    return false;
  }

  return true;
}

/**
 * Real-time Proactive Session Expiry Watcher
 * Proactively refreshes the 30-minute access token 2 minutes before it expires
 * using the 7-day refresh token, ensuring seamless uninterrupted user sessions.
 */
export function initSessionWatcher(onSessionExpired) {
  const token = getAuthToken();
  if (!token || token === 'dev-mock-jwt-token') return;

  if (sessionTimerId) clearTimeout(sessionTimerId);
  if (sessionCheckIntervalId) clearInterval(sessionCheckIntervalId);
  if (visibilityRefreshHandler) {
    window.removeEventListener('focus', visibilityRefreshHandler);
    document.removeEventListener('visibilitychange', visibilityRefreshHandler);
  }

  const remaining = getTokenRemainingTime(token);
  // Auto-refresh 2 minutes before access token expiry
  const refreshThreshold = 2 * 60 * 1000;
  const timeToRefresh = Math.max(1000, remaining - refreshThreshold);

  sessionTimerId = setTimeout(async () => {
    const refreshed = await refreshSession();
    if (refreshed) {
      // Sesi berhasil diperpanjang, arm ulang session watcher
      initSessionWatcher(onSessionExpired);
    } else {
      if (isTokenExpired(getAuthToken())) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
      }
    }
  }, timeToRefresh);

  // Fallback periodic check every 30 seconds
  sessionCheckIntervalId = setInterval(async () => {
    const currentToken = getAuthToken();
    if (isTokenExpired(currentToken)) {
      const refreshed = await refreshSession();
      if (!refreshed) {
        clearInterval(sessionCheckIntervalId);
        if (sessionTimerId) clearTimeout(sessionTimerId);
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
      }
    }
  }, 30000);

  // Browser timers can be suspended in background tabs. Re-check the session as soon as
  // the user returns so an expired access token does not leave API requests using a stale JWT.
  visibilityRefreshHandler = async () => {
    if (document.visibilityState === 'hidden') return;
    const validToken = await getValidAccessToken();
    if (validToken) {
      initSessionWatcher(onSessionExpired);
    } else if (typeof onSessionExpired === 'function') {
      onSessionExpired();
    }
  };
  window.addEventListener('focus', visibilityRefreshHandler);
  document.addEventListener('visibilitychange', visibilityRefreshHandler);
}
