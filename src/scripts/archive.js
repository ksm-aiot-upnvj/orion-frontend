import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, computeOfficialLetterNumber, generateLaTeXSource, initIcons } from '../modules/ui.js';
import { initialArchiveData } from '../modules/data.js';

let archiveLetters = [...initialArchiveData];
let currentZoom = 100;

function renderArchiveList() {
  const tbody = document.getElementById('archive-tbody');
  if (!tbody) return;

  tbody.innerHTML = archiveLetters.map((l, index) => `
    <tr class="hover:bg-slate-900/60 transition-colors whitespace-nowrap">
      <td class="py-4 px-5 font-mono font-bold text-aiot-cyan whitespace-nowrap">${l.noSurat}</td>
      <td class="py-4 px-5 font-mono text-xs whitespace-nowrap">${l.sifat}</td>
      <td class="py-4 px-5 font-bold text-white whitespace-nowrap">${l.perihal}</td>
      <td class="py-4 px-5 text-slate-300 text-xs whitespace-nowrap">${l.tujuan}</td>
      <td class="py-4 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">${l.date}</td>
      <td class="py-4 px-5 text-slate-300 font-semibold text-xs whitespace-nowrap">${l.signer}</td>
      <td class="py-4 px-5 text-center whitespace-nowrap">
        <button onclick="window.previewLetter(${index})" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-aiot-cyan text-xs font-mono font-bold transition-all border border-slate-700 whitespace-nowrap">
          Lihat Kop
        </button>
      </td>
    </tr>
  `).join('');
}

window.previewLetter = function(index) {
  const item = archiveLetters[index];
  if (!item) return;

  document.getElementById('gen-perihal').value = item.perihal;
  document.getElementById('gen-tujuan').value = item.tujuan;
  document.getElementById('gen-date').value = item.date;
  document.getElementById('gen-signer').value = item.signer;
  
  document.getElementById('tab-generator-btn')?.click();
  showToast(`Surat ${item.noSurat} dimuat ke PDF Viewer!`, 'info');
};

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('archive', 'Arsip & Kop Surat Resmi');
  renderArchiveList();

  const genSifat = document.getElementById('gen-sifat');
  const genNomor = document.getElementById('gen-nomor');
  const genDate = document.getElementById('gen-date');
  const genLampiran = document.getElementById('gen-lampiran');
  const genPerihal = document.getElementById('gen-perihal');
  const genTujuan = document.getElementById('gen-tujuan');
  const genIsi = document.getElementById('gen-isi');
  const genSigner = document.getElementById('gen-signer');

  function updateLiveLetterPreview() {
    if (!genSifat || !genNomor || !genDate) return;
    const sifat = genSifat.value;
    const nomor = genNomor.value || 1;
    const dateStr = genDate.value || '2026-03-06';
    const computedCode = computeOfficialLetterNumber(sifat, nomor, dateStr);

    document.getElementById('generated-letter-number').textContent = computedCode;
    document.getElementById('preview-no-surat').textContent = computedCode;
    
    if (document.getElementById('preview-lampiran')) {
      document.getElementById('preview-lampiran').textContent = genLampiran?.value || '-';
    }
    
    document.getElementById('preview-perihal').textContent = genPerihal.value;
    document.getElementById('preview-tujuan').textContent = genTujuan.value;
    document.getElementById('preview-isi').textContent = genIsi.value;
    document.getElementById('preview-signer').textContent = genSigner.value;

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', options);
    document.getElementById('preview-tanggal').textContent = formattedDate;
  }

  [genSifat, genNomor, genDate, genLampiran, genPerihal, genTujuan, genIsi, genSigner].forEach(input => {
    input?.addEventListener('input', updateLiveLetterPreview);
    input?.addEventListener('change', updateLiveLetterPreview);
  });

  updateLiveLetterPreview();

  // Save to Archive
  document.getElementById('btn-save-to-archive')?.addEventListener('click', () => {
    const code = document.getElementById('generated-letter-number').textContent.trim();
    const perihal = genPerihal.value;
    const tujuan = genTujuan.value;
    const dateStr = genDate.value;
    const signer = genSigner.value;

    archiveLetters.unshift({
      noSurat: code,
      sifat: `${genSifat.value} (${genSifat.options[genSifat.selectedIndex].text.split('—')[1]?.trim() || 'Resmi'})`,
      perihal: perihal,
      tujuan: tujuan,
      date: dateStr,
      signer: signer
    });

    renderArchiveList();
    genNomor.value = parseInt(genNomor.value, 10) + 1;
    updateLiveLetterPreview();
    showToast(`Surat resmi ${code} berhasil didokumentasikan ke Buku Arsip!`, 'success');
  });

  // Print PDF (Reset zoom before printing to guarantee full 1:1 scale)
  function triggerPrint() {
    const prevZoom = currentZoom;
    currentZoom = 100;
    applyZoom();
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        currentZoom = prevZoom;
        applyZoom();
      }, 500);
    }, 100);
  }

  document.getElementById('btn-print-pdf')?.addEventListener('click', triggerPrint);
  document.getElementById('toolbar-print-btn')?.addEventListener('click', triggerPrint);

  // PDF Viewer Zoom Controls
  const paper = document.getElementById('printable-letterhead');
  const zoomLevelLabel = document.getElementById('pdf-zoom-label');

  document.getElementById('pdf-zoom-in')?.addEventListener('click', () => {
    if (currentZoom < 130) {
      currentZoom += 10;
      applyZoom();
    }
  });

  document.getElementById('pdf-zoom-out')?.addEventListener('click', () => {
    if (currentZoom > 80) {
      currentZoom -= 10;
      applyZoom();
    }
  });

  function applyZoom() {
    if (!paper) return;
    paper.style.transform = `scale(${currentZoom / 100})`;
    paper.style.transformOrigin = 'top center';
    if (zoomLevelLabel) zoomLevelLabel.textContent = `${currentZoom}%`;
  }

  // LaTeX Modal
  const latexModal = document.getElementById('latex-modal');
  function openLatexModal() {
    const noSurat = document.getElementById('generated-letter-number').textContent.trim();
    const perihal = genPerihal.value;
    const lampiran = genLampiran?.value || '-';
    const tujuan = genTujuan.value;
    const isi = genIsi.value;
    const signer = genSigner.value;
    const dateStr = genDate.value;

    const latexCode = generateLaTeXSource(noSurat, perihal, lampiran, tujuan, isi, signer, dateStr);
    document.getElementById('latex-code-content').value = latexCode;

    latexModal.classList.remove('hidden');
    latexModal.classList.add('flex');
    initIcons();
  }

  document.getElementById('btn-view-latex')?.addEventListener('click', openLatexModal);
  document.getElementById('toolbar-latex-btn')?.addEventListener('click', openLatexModal);

  document.getElementById('close-latex-modal')?.addEventListener('click', () => {
    latexModal.classList.add('hidden');
    latexModal.classList.remove('flex');
  });

  document.getElementById('btn-copy-latex')?.addEventListener('click', () => {
    const codeArea = document.getElementById('latex-code-content');
    codeArea.select();
    navigator.clipboard.writeText(codeArea.value);
    showToast('Source Code LaTeX berhasil disalin ke clipboard!', 'success');
  });

  // Subtabs switching
  const tabBtns = document.querySelectorAll('.archive-tab-btn');
  const tabPanels = document.querySelectorAll('.archive-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach(b => {
        b.className = 'archive-tab-btn px-5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all text-slate-400 hover:text-white whitespace-nowrap';
      });
      btn.className = 'archive-tab-btn px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all bg-aiot-cyan text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)] whitespace-nowrap';

      tabPanels.forEach(p => {
        if (p.id === `tab-${target}`) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      });
      initIcons();
    });
  });
});
