import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { getAuthToken, getValidAccessToken } from '../modules/auth.js';
import { initIcons, showToast } from '../modules/ui.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/orion/api/v1';

let logsData = [];
let filteredLogs = [];
let totalDatabaseLogs = 0;
let databaseStats = { total: 0, success: 0, failed: 0, admin_actions: 0 };
let selectedLog = null;
let currentLimit = 50;
let currentOffset = 0;
let searchQuery = '';
let actionFilter = 'all';
let statusFilter = 'all';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return escapeHtml(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function simplifyUserAgent(ua) {
  if (!ua) return '-';
  const str = String(ua);
  if (str.includes('Chrome')) return 'Chrome / Windows';
  if (str.includes('Firefox')) return 'Firefox / Desktop';
  if (str.includes('Safari') && !str.includes('Chrome')) return 'Safari / Apple';
  if (str.includes('curl')) return 'cURL CLI';
  if (str.includes('Postman')) return 'Postman';
  return str.length > 25 ? str.substring(0, 22) + '...' : str;
}

function formatDetails(details) {
  if (details === null || details === undefined) return 'null';
  if (typeof details === 'object') {
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(details);
  }
}

function resourceTypeLabel(type) {
  const labels = { USER: 'Pengguna', MEMBER: 'Anggota', REGISTRATION: 'Pendaftaran', FILE: 'Berkas' };
  return labels[String(type || '').toUpperCase()] || type || '-';
}

function resourceInfoLabel(log) {
  if (log.resource_label) return log.resource_label;
  const value = log.resource_id;
  if (!value) return '-';
  // Older entries store only the users.id UUID. Newer login entries include a readable account label.
  if (String(log.resource_type || '').toUpperCase() === 'USER' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(value))) {
    return `ID pengguna: ${value}`;
  }
  return value;
}

function isSuperadminLog(log) {
  if (typeof log.is_superadmin === 'boolean') return log.is_superadmin;
  let details = log.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = null; }
  }
  if (typeof details?.is_superadmin === 'boolean') return details.is_superadmin;
  if (log.actor_role) return String(log.actor_role).toUpperCase() === 'SUPERADMIN';
  return null;
}

function superadminLabel(log) {
  const isSuperadmin = isSuperadminLog(log);
  return isSuperadmin === true ? 'Ya' : isSuperadmin === false ? 'Tidak' : 'Tidak diketahui';
}

function updateStats() {
  const statTotal = document.getElementById('stat-total-logs');
  const statSuccess = document.getElementById('stat-success-logs');
  const statFailed = document.getElementById('stat-failed-logs');
  const statAdmin = document.getElementById('stat-admin-actions');

  if (statTotal) statTotal.textContent = String(databaseStats.total);
  if (statSuccess) statSuccess.textContent = String(databaseStats.success);
  if (statFailed) statFailed.textContent = String(databaseStats.failed);
  if (statAdmin) statAdmin.textContent = String(databaseStats.admin_actions);
}

function renderLogs() {
  const tbody = document.getElementById('audit-log-tbody');
  const summary = document.getElementById('log-summary');
  const paginationInfo = document.getElementById('pagination-info');
  if (!tbody) return;

  if (paginationInfo) {
    const firstRow = logsData.length ? currentOffset + 1 : 0;
    const lastRow = currentOffset + logsData.length;
    paginationInfo.textContent = `Baris ${firstRow}–${lastRow} dari ${totalDatabaseLogs} total data`;
  }

  if (!Array.isArray(filteredLogs) || filteredLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
      <td colspan="10" class="text-center py-12 text-[#C9A4F6] font-mono text-xs">
          <div class="flex flex-col items-center justify-center space-y-2">
            <i data-lucide="inbox" class="w-8 h-8 text-[#561F99]"></i>
            <span class="text-white font-semibold">Tidak ada log aktivitas yang cocok</span>
            <span class="text-[11px] text-[#D8B4FE]">Coba ubah kata kunci pencarian atau reset filter.</span>
          </div>
        </td>
      </tr>
    `;
    if (summary) summary.textContent = `Menampilkan ${filteredLogs.length} dari ${logsData.length} data pada halaman ini; total ${totalDatabaseLogs} data di database`;
    initIcons();
    return;
  }

  tbody.innerHTML = filteredLogs.map((log) => {
    const isSuccess = String(log.status || '').toUpperCase() === 'SUCCESS';
    const statusBadge = isSuccess
      ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">SUCCESS</span>'
      : '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950/70 text-rose-300 border border-rose-500/40">FAILED</span>';

    const actor = log.actor_name || 'ANONYMOUS / SISTEM';
    const actorRole = log.actor_role || 'SISTEM';
    const resourceType = resourceTypeLabel(log.resource_type);
    const resourceInfo = resourceInfoLabel(log);
    const uaShort = simplifyUserAgent(log.user_agent);
    const superadmin = isSuperadminLog(log);
    const superadminBadge = superadmin === true
      ? '<span class="inline-flex px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[10px] font-mono">Ya</span>'
      : superadmin === false
        ? '<span class="inline-flex px-1.5 py-0.5 rounded bg-slate-900/70 text-slate-300 border border-slate-600/40 text-[10px] font-mono">Tidak</span>'
        : '<span class="text-[10px] text-slate-400 font-mono">Tidak diketahui</span>';

    return `
      <tr class="hover:bg-[#250d42]/70 transition-colors align-middle">
        <td class="text-[#D8B4FE] font-mono text-[11px] whitespace-nowrap">
          <div class="font-medium text-white">${formatTimestamp(log.timestamp)}</div>
        </td>
        <td>
          <div class="font-semibold text-white text-xs">${escapeHtml(actor)}</div>
        </td>
        <td class="text-[11px] text-[#C9A4F6]">${escapeHtml(actorRole)}</td>
        <td class="text-center">${superadminBadge}</td>
        <td>
          <span class="px-2 py-1 rounded bg-[#301057] border border-[#561F99] font-mono text-[11px] font-bold text-[#C9A4F6] whitespace-nowrap">
            ${escapeHtml(log.action || '-')}
          </span>
        </td>
        <td class="text-[11px] text-[#E9D8FD]">${escapeHtml(resourceType)}</td>
        <td class="font-mono text-[11px] text-[#E9D8FD] max-w-[240px] truncate" title="${escapeHtml(resourceInfo)}">
          ${escapeHtml(resourceInfo)}
        </td>
        <td class="font-mono text-[11px] text-[#D8B4FE] whitespace-nowrap">
          <div class="text-white">${escapeHtml(log.ip_address || '-')}</div>
          <div class="text-[10px] text-[#A855F7] truncate max-w-[140px]" title="${escapeHtml(log.user_agent || '')}">${escapeHtml(uaShort)}</div>
        </td>
        <td class="text-center whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="text-center whitespace-nowrap">
          <button type="button" data-log-id="${escapeHtml(log.id)}" class="btn-view-detail px-2.5 py-1.5 rounded-lg bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white border border-[#561F99] text-[11px] font-semibold transition-all inline-flex items-center space-x-1">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Detail</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (summary) {
    summary.textContent = `Menampilkan ${logsData.length} dari ${totalDatabaseLogs} data di database`;
    if (filteredLogs.length !== logsData.length) {
      summary.textContent += ` (${filteredLogs.length} cocok dengan pencarian/filter)`;
    }
  }

  // Attach detail button listeners
  tbody.querySelectorAll('.btn-view-detail').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-log-id');
      openDetailModal(id);
    });
  });

  initIcons();
}

function applyFilters() {
  const query = searchQuery.trim().toLowerCase();

  filteredLogs = logsData.filter((log) => {
    // Action category filter
    if (actionFilter !== 'all') {
      const actionStr = String(log.action || '').toUpperCase();
      if (!actionStr.startsWith(actionFilter)) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isSuccess = String(log.status || '').toUpperCase() === 'SUCCESS';
      if (statusFilter === 'SUCCESS' && !isSuccess) return false;
      if (statusFilter === 'FAILED' && isSuccess) return false;
    }

    // Search query filter
    if (query) {
      const haystack = [
        log.actor_name,
        log.actor_role,
        superadminLabel(log),
        log.action,
        resourceTypeLabel(log.resource_type),
        resourceInfoLabel(log),
        log.ip_address,
        log.user_agent,
        log.id
      ].filter(Boolean).join(' ').toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  renderLogs();
}

export async function loadLogs() {
  const tbody = document.getElementById('audit-log-tbody');
  const summary = document.getElementById('log-summary');
  const prevBtn = document.getElementById('log-prev-btn');
  const nextBtn = document.getElementById('log-next-btn');
  let token = getAuthToken();

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-12 text-[#C9A4F6] font-mono text-xs">
          <div class="flex flex-col items-center justify-center space-y-2">
            <i data-lucide="loader" class="w-5 h-5 animate-spin text-[#C9A4F6]"></i>
            <span>Memuat log aktivitas dari server...</span>
          </div>
        </td>
      </tr>
    `;
    initIcons();
  }
  if (summary) summary.textContent = 'Memuat data...';

  try {
    const url = `${API_BASE_URL}/audit-logs/?limit=${currentLimit}&offset=${currentOffset}`;
    let response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (response.status === 401) {
      token = await getValidAccessToken();
      if (token) response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Gagal mengambil log aktivitas (HTTP ${response.status}).`);
    }

    const data = await response.json();
    logsData = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    totalDatabaseLogs = Number.isFinite(data.total) ? data.total : logsData.length;
    databaseStats = data.stats || {
      total: totalDatabaseLogs,
      success: logsData.filter((log) => String(log.status || '').toUpperCase() === 'SUCCESS').length,
      failed: logsData.filter((log) => String(log.status || '').toUpperCase() !== 'SUCCESS').length,
      admin_actions: logsData.filter((log) => !String(log.action || '').startsWith('AUTH_')).length
    };
    updateStats();
    applyFilters();

    // Update pagination button states
    if (prevBtn) {
      prevBtn.disabled = currentOffset <= 0;
    }
    if (nextBtn) {
      nextBtn.disabled = currentOffset + logsData.length >= totalDatabaseLogs;
    }
  } catch (error) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
        <td colspan="10" class="text-center py-10 text-rose-300 text-xs">
            <div class="flex flex-col items-center justify-center space-y-2">
              <i data-lucide="alert-circle" class="w-6 h-6 text-rose-400"></i>
              <span class="font-semibold">${escapeHtml(error.message)}</span>
              <button id="retry-load-btn" type="button" class="btn-outline-neutral text-xs py-1 px-3 mt-2">
                Coba Lagi
              </button>
            </div>
          </td>
        </tr>
      `;
      initIcons();
      document.getElementById('retry-load-btn')?.addEventListener('click', loadLogs);
    }
    if (summary) summary.textContent = 'Gagal memuat';
    showToast(error.message, 'error');
  }
}

function openDetailModal(logId) {
  selectedLog = logsData.find((l) => String(l.id) === String(logId));
  if (!selectedLog) return;

  const modal = document.getElementById('logDetailModal');
  if (!modal) return;

  document.getElementById('modal-log-id').textContent = `UUID: ${selectedLog.id}`;
  document.getElementById('modal-timestamp').textContent = formatTimestamp(selectedLog.timestamp);

  const isSuccess = String(selectedLog.status || '').toUpperCase() === 'SUCCESS';
  document.getElementById('modal-status').innerHTML = isSuccess
    ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">SUCCESS</span>'
    : '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950/70 text-rose-300 border border-rose-500/40">FAILED</span>';

  document.getElementById('modal-actor').textContent = selectedLog.actor_name || 'ANONYMOUS / SISTEM';
  document.getElementById('modal-role').textContent = selectedLog.actor_role || '-';
  document.getElementById('modal-action').textContent = selectedLog.action || '-';
  document.getElementById('modal-resource').textContent = resourceTypeLabel(selectedLog.resource_type);
  document.getElementById('modal-resource-info').textContent = resourceInfoLabel(selectedLog);
  const superadmin = isSuperadminLog(selectedLog);
  document.getElementById('modal-is-superadmin').innerHTML = superadmin === true
    ? '<span class="inline-flex px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 font-mono text-[10px]">Ya</span>'
    : superadmin === false
      ? '<span class="inline-flex px-2 py-0.5 rounded bg-slate-900/70 text-slate-300 border border-slate-600/40 font-mono text-[10px]">Tidak</span>'
      : '<span class="inline-flex px-2 py-0.5 rounded bg-slate-900/70 text-slate-300 border border-slate-600/40 font-mono text-[10px]">Tidak diketahui</span>';
  document.getElementById('modal-ip').textContent = selectedLog.ip_address || '-';
  document.getElementById('modal-actor-id').textContent = selectedLog.actor_id || '-';
  document.getElementById('modal-user-agent').textContent = selectedLog.user_agent || '-';

  const detailsFormatted = formatDetails(selectedLog.details);
  document.getElementById('modal-details-json').textContent = detailsFormatted;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  initIcons();
}

function closeDetailModal() {
  const modal = document.getElementById('logDetailModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  selectedLog = null;
}

function copyDetailsJSON() {
  if (!selectedLog) return;
  const jsonStr = formatDetails(selectedLog.details);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast('Payload detail berhasil disalin ke clipboard!', 'success');
  }).catch(() => {
    showToast('Gagal menyalin detail ke clipboard.', 'error');
  });
}

function exportLogsJSON() {
  if (!logsData || logsData.length === 0) {
    showToast('Tidak ada data log untuk diekspor.', 'error');
    return;
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `orion-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(`${filteredLogs.length} data log berhasil diekspor.`, 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('log', 'Log Aktivitas');

  // Search input listener with debouncing
  let searchTimeout = null;
  const searchInput = document.getElementById('log-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        applyFilters();
      }, 200);
    });
  }

  // Filter dropdown listeners
  document.getElementById('log-filter-action')?.addEventListener('change', (e) => {
    actionFilter = e.target.value;
    applyFilters();
  });

  document.getElementById('log-filter-status')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    applyFilters();
  });

  document.getElementById('log-limit-select')?.addEventListener('change', (e) => {
    currentLimit = parseInt(e.target.value, 10) || 50;
    currentOffset = 0;
    loadLogs();
  });

  // Action buttons
  document.getElementById('refresh-log-btn')?.addEventListener('click', loadLogs);
  document.getElementById('export-log-btn')?.addEventListener('click', exportLogsJSON);

  // Pagination buttons
  document.getElementById('log-prev-btn')?.addEventListener('click', () => {
    if (currentOffset > 0) {
      currentOffset = Math.max(0, currentOffset - currentLimit);
      loadLogs();
    }
  });

  document.getElementById('log-next-btn')?.addEventListener('click', () => {
    currentOffset += currentLimit;
    loadLogs();
  });

  // Modal close handlers
  document.getElementById('close-detail-modal-btn')?.addEventListener('click', closeDetailModal);
  document.getElementById('close-detail-modal-bottom-btn')?.addEventListener('click', closeDetailModal);
  document.getElementById('logDetailBackdrop')?.addEventListener('click', closeDetailModal);
  document.getElementById('copy-json-btn')?.addEventListener('click', copyDetailsJSON);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });

  // Initial load
  loadLogs();
});
