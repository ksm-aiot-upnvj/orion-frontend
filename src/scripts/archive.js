import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, computeOfficialLetterNumber, generateLaTeXSource, initIcons } from '../modules/ui.js';
import { initialArchiveData } from '../modules/data.js';

let archiveLetters = [...initialArchiveData];

function renderArchiveList(search = '', sifatFilter = 'all') {
  const tbody = document.getElementById('archive-tbody');
  if (!tbody) return;

  const query = search.toLowerCase().trim();
  const filtered = archiveLetters.filter(l => {
    const matchSearch = l.noSurat.toLowerCase().includes(query) ||
                        l.perihal.toLowerCase().includes(query) ||
                        l.tujuan.toLowerCase().includes(query) ||
                        l.signer.toLowerCase().includes(query);

    const matchSifat = sifatFilter === 'all' || l.sifat.startsWith(sifatFilter);
    return matchSearch && matchSifat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 font-mono text-xs">Tidak ada arsip surat yang sesuai filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((l, index) => `
    <tr class="hover:bg-[#2d1052] transition-colors">
      <td class="font-mono text-xs font-bold text-[#C9A4F6]">${l.noSurat}</td>
      <td class="font-mono text-xs text-[#D8B4FE]">${l.sifat}</td>
      <td class="font-medium text-white">${l.perihal}</td>
      <td class="text-[#E9D8FD] text-xs">${l.tujuan}</td>
      <td class="text-[#D8B4FE] font-mono text-xs">${l.date}</td>
      <td class="text-white text-xs font-semibold">${l.signer}</td>
      <td class="text-center">
        <button onclick="window.previewLetter(${index})" class="px-2.5 py-1 rounded-md bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white text-xs font-semibold transition-colors border border-[#561F99]">
          Lihat Kop
        </button>
      </td>
    </tr>
  `).join('');

  initIcons();
}

window.previewLetter = function(index) {
  const item = archiveLetters[index];
  if (!item) return;

  const perihalInput = document.getElementById('gen-perihal');
  const tujuanInput = document.getElementById('gen-tujuan');
  const dateInput = document.getElementById('gen-date');

  if (perihalInput) perihalInput.value = item.perihal;
  if (tujuanInput) tujuanInput.value = item.tujuan;
  if (dateInput) dateInput.value = item.date;

  document.getElementById('tab-generator-btn')?.click();
  showToast(`Surat ${item.noSurat} dimuat ke Kop Previewer!`, 'info');
};

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('archive', 'Arsip & Persuratan');
  renderArchiveList();

  const searchInput = document.getElementById('search-archive-input');
  const sifatSelect = document.getElementById('filter-archive-sifat');

  function applyFilter() {
    renderArchiveList(searchInput?.value || '', sifatSelect?.value || 'all');
  }

  searchInput?.addEventListener('input', applyFilter);
  sifatSelect?.addEventListener('change', applyFilter);

  // Tab switching
  const tabBtns = document.querySelectorAll('.archive-tab-btn');
  const tabPanels = document.querySelectorAll('.archive-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.className = 'archive-tab-btn px-4 py-1.5 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all';
      });
      btn.className = 'archive-tab-btn px-4 py-1.5 rounded-md text-xs font-semibold bg-white text-[#301057] shadow-sm transition-all';

      tabPanels.forEach(p => {
        if (p.id === `tab-${tab}`) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      });
    });
  });

  const genSifat = document.getElementById('gen-sifat');
  const genNomor = document.getElementById('gen-nomor');
  const genDate = document.getElementById('gen-date');
  const genLampiran = document.getElementById('gen-lampiran');
  const genPerihal = document.getElementById('gen-perihal');
  const genTujuan = document.getElementById('gen-tujuan');
  const genBody = document.getElementById('gen-body');

  function updateLiveLetterPreview() {
    if (!genSifat || !genNomor || !genDate) return;
    const sifat = genSifat.value;
    const nomor = genNomor.value || 1;
    const dateStr = genDate.value || '2026-03-06';
    const computedCode = computeOfficialLetterNumber(sifat, nomor, dateStr);

    const numEl = document.getElementById('generated-letter-number');
    const pNumEl = document.getElementById('preview-letter-num');
    const pLampEl = document.getElementById('preview-lampiran');
    const pPerihalEl = document.getElementById('preview-perihal');
    const pTujuanEl = document.getElementById('preview-tujuan');
    const pBodyEl = document.getElementById('preview-body');
    const pDateEl = document.getElementById('preview-date');

    if (numEl) numEl.textContent = computedCode;
    if (pNumEl) pNumEl.textContent = computedCode;
    if (pLampEl) pLampEl.textContent = genLampiran?.value || '-';
    if (pPerihalEl) pPerihalEl.textContent = genPerihal?.value || '';
    if (pTujuanEl) pTujuanEl.textContent = genTujuan?.value || '';
    if (pBodyEl) pBodyEl.textContent = genBody?.value || '';

    if (pDateEl) {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', options);
      pDateEl.textContent = `Jakarta, ${formattedDate}`;
    }
  }

  [genSifat, genNomor, genDate, genLampiran, genPerihal, genTujuan, genBody].forEach(input => {
    input?.addEventListener('input', updateLiveLetterPreview);
    input?.addEventListener('change', updateLiveLetterPreview);
  });

  updateLiveLetterPreview();

  // Save to Archive
  document.getElementById('btn-save-archive')?.addEventListener('click', () => {
    const code = document.getElementById('generated-letter-number').textContent.trim();
    const perihal = genPerihal.value;
    const tujuan = genTujuan.value;
    const dateStr = genDate.value;

    archiveLetters.unshift({
      noSurat: code,
      sifat: `${genSifat.value} (${genSifat.options[genSifat.selectedIndex].text.split('—')[1]?.trim() || 'Resmi'})`,
      perihal: perihal,
      tujuan: tujuan,
      date: dateStr,
      signer: 'Dzulfikri Adjmal (Ketua)'
    });

    renderArchiveList();
    genNomor.value = parseInt(genNomor.value, 10) + 1;
    updateLiveLetterPreview();
    showToast(`Surat resmi ${code} berhasil didokumentasikan ke Buku Arsip!`, 'success');
  });

  // Export LaTeX
  document.getElementById('btn-export-latex')?.addEventListener('click', () => {
    const code = document.getElementById('generated-letter-number').textContent.trim();
    const latex = generateLaTeXSource(code, genDate.value, genPerihal.value, genTujuan.value, genBody.value, 'Dzulfikri Adjmal');
    const blob = new Blob([latex], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Surat_Resmi_${code.replace(/\//g, '_')}.tex`);
    a.click();
    showToast(`Source LaTeX surat resmi berhasil diunduh!`, 'success');
  });
});
