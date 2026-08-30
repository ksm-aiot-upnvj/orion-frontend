import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons } from '../modules/ui.js';
import { initialInventoryData } from '../modules/data.js';

let inventoryList = [...initialInventoryData];

function renderInventory(search = '', category = 'all') {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  const filtered = inventoryList.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                        i.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || i.category === category;
    return matchSearch && matchCat;
  });

  const totalUnits = inventoryList.reduce((acc, curr) => acc + curr.total, 0);
  const availableUnits = inventoryList.reduce((acc, curr) => acc + curr.available, 0);
  const borrowedUnits = inventoryList.reduce((acc, curr) => acc + curr.borrowed, 0);

  const totalEl = document.getElementById('stat-total-units');
  const availEl = document.getElementById('stat-available-units');
  const borrowEl = document.getElementById('stat-borrowed-units');

  if (totalEl) totalEl.textContent = totalUnits;
  if (availEl) availEl.textContent = availableUnits;
  if (borrowEl) borrowEl.textContent = borrowedUnits;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 font-mono text-xs">Tidak ada perangkat yang sesuai pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr class="hover:bg-[#2d1052] transition-colors">
      <td class="font-medium text-white">${item.name}</td>
      <td class="text-[#D8B4FE] font-mono text-xs">${item.category}</td>
      <td class="font-mono font-bold text-white">${item.total}</td>
      <td class="font-mono font-bold text-emerald-300">${item.available}</td>
      <td class="font-mono font-bold text-amber-300">${item.borrowed}</td>
      <td>
        <span class="badge-status badge-approved text-[10px]">${item.condition}</span>
      </td>
      <td class="text-center">
        <div class="inline-flex items-center space-x-1.5">
          <button onclick="window.handleBorrow(${item.id})" class="px-2.5 py-1 rounded-md bg-[#301057] hover:bg-[#561F99] text-[#C9A4F6] hover:text-white text-xs font-semibold transition-colors border border-[#561F99]">
            Pinjam
          </button>
          <button onclick="window.handleReturn(${item.id})" class="px-2.5 py-1 rounded-md bg-[#240d42] hover:bg-[#301057] text-[#D8B4FE] hover:text-white text-xs font-semibold transition-colors border border-[#561F99]">
            Kembalikan
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  initIcons();
}

window.handleBorrow = function(id) {
  const item = inventoryList.find(i => i.id === id);
  if (!item) return;

  if (item.available <= 0) {
    showToast(`Stok ${item.name} di Lab sedang kosong!`, 'error');
    return;
  }

  item.available -= 1;
  item.borrowed += 1;
  renderInventory(document.getElementById('search-inventory-input').value, document.getElementById('filter-category').value);
  showToast(`Simulasi: 1 unit ${item.name} berhasil dipinjam.`, 'success');
};

window.handleReturn = function(id) {
  const item = inventoryList.find(i => i.id === id);
  if (!item) return;

  if (item.borrowed <= 0) {
    showToast(`Tidak ada unit ${item.name} yang sedang dalam peminjaman.`, 'error');
    return;
  }

  item.available += 1;
  item.borrowed -= 1;
  renderInventory(document.getElementById('search-inventory-input').value, document.getElementById('filter-category').value);
  showToast(`Simulasi: 1 unit ${item.name} berhasil dikembalikan ke Lab.`, 'success');
};

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('inventory', 'Inventaris Hardware & Lab');
  renderInventory();

  const searchInput = document.getElementById('search-inventory-input');
  const catSelect = document.getElementById('filter-category');

  function update() {
    renderInventory(searchInput?.value || '', catSelect?.value || 'all');
  }

  searchInput?.addEventListener('input', update);
  catSelect?.addEventListener('change', update);
});
