/**
 * Single source of truth for backend API endpoints and frontend page URLs.
 * Path segments that come from data are URL-encoded here so callers never build URLs by hand.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

const seg = (value) => encodeURIComponent(String(value));

export const API_ROUTES = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  myPassword: '/auth/me/password',

  members: '/members',
  memberStats: '/members/stats',
  publicMembers: '/members/public',
  memberImports: '/members/imports',
  member: (id) => `/members/${seg(id)}`,
  memberAccess: (id) => `/members/${seg(id)}/access`,
  memberPassword: (id) => `/members/${seg(id)}/password`,

  registrations: '/registrations',
  registrationBulkDelete: '/registrations/bulk-delete',
  intakeStatus: '/registrations/intake-status',
  registration: (id) => `/registrations/${seg(id)}`,
  registrationApprove: (id) => `/registrations/${seg(id)}/approve`,
  registrationReject: (id) => `/registrations/${seg(id)}/reject`,

  auditLogs: '/audit-logs',

  avatarUploads: '/uploads/avatars',
  cvUploads: '/uploads/cvs',
  // Stored file paths ('avatars/<uuid>.webp', 'tmp/cvs/<uuid>.pdf') are served under /uploads/
  upload: (relativePath) => `/uploads/${String(relativePath).replace(/^\/+|^uploads\//g, '')}`,
};

/** Build an absolute API URL, with an optional query object ({ key: value }, empty values skipped). */
export function apiUrl(path, query) {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const BASE = import.meta.env.BASE_URL;

/** Clean page URLs (no /pages/ segment, no .html, no trailing slash). */
export const PAGE_URLS = {
  home: BASE,
  registration: `${BASE}registration`,
  profile: `${BASE}profile`,
  selection: `${BASE}selection`,
  members: `${BASE}members`,
  inventory: `${BASE}inventory`,
  finance: `${BASE}finance`,
  archive: `${BASE}archive`,
  log: `${BASE}log`,
};
