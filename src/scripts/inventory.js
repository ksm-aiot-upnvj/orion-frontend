import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast } from '../modules/ui.js';
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

  document.getElementById('stat-total-units').textContent = totalUnits;
  document.getElementById('stat-available-units').textContent = availableUnits;
  document.getElementById('stat-borrowed-units').textContent = borrowedUnits;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-slate-500 font-mono whitespace-nowrap">Tidak ada perangkat yang sesuai pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr class="hover:bg-slate-900/60 transition-colors whitespace-nowrap">
      <td class="py-4 px-5 font-bold text-white whitespace-nowrap">${item.name}</td>
      <td class="py-4 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">${item.category}</td>
      <td class="py-4 px-5 font-mono font-bold text-slate-200 whitespace-nowrap">${item.total}</td>
      <td class="py-4 px-5 font-mono font-extrabold text-emerald-400 whitespace-nowrap">${item.available}</td>
      <td class="py-4 px-5 font-mono font-bold text-amber-400 whitespace-nowrap">${item.borrowed}</td>
      <td class="py-4 px-5 whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 whitespace-nowrap">${item.condition}</span>
      </td>
      <td class="py-4 px-5 text-center whitespace-nowrap">
        <div class="flex items-center justify-center space-x-2 whitespace-nowrap">
          <button onclick="window.handleBorrow(${item.id})" class="px-3 py-1.5 rounded-xl bg-aiot-cyan/20 hover:bg-aiot-cyan text-aiot-cyan hover:text-slate-950 text-xs font-mono font-bold transition-all whitespace-nowrap">
            Pinjam
          </button>
          <button onclick="window.handleReturn(${item.id})" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700 whitespace-nowrap">
            Kembalikan
          </button>
        </div>
      </td>
    </tr>
  `).join('');
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
  showToast(`Simulasi: 1x ${item.name} berhasil dipinjam untuk riset!`, 'success');
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
  showToast(`Simulasi: 1x ${item.name} berhasil dikembalikan ke Lab AIoT!`, 'success');
};

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('inventory', 'Inventaris Hardware & Lab');
  renderInventory();

  const searchInput = document.getElementById('search-inventory-input');
  const catSelect = document.getElementById('filter-category');

  function update() {
    renderInventory(searchInput.value, catSelect.value);
  }

  searchInput?.addEventListener('input', update);
  catSelect?.addEventListener('change', update);
});
