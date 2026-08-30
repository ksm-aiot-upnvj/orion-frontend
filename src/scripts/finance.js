import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast, initIcons } from '../modules/ui.js';
import { initialFinanceData } from '../modules/data.js';

let financeTransactions = [...initialFinanceData];

function renderFinance(search = '', typeFilter = 'all', categoryFilter = 'all') {
  const tbody = document.getElementById('transaction-tbody');
  if (!tbody) return;

  let totalIncome = 0;
  let totalExpense = 0;

  financeTransactions.forEach(tx => {
    if (tx.type === 'Pemasukan' || tx.type === 'INCOME') totalIncome += tx.amount;
    if (tx.type === 'Pengeluaran' || tx.type === 'EXPENSE') totalExpense += tx.amount;
  });

  const activeBalance = totalIncome - totalExpense;

  const balEl = document.getElementById('stat-active-balance');
  const incEl = document.getElementById('stat-total-income');
  const expEl = document.getElementById('stat-total-expense');

  if (balEl) balEl.textContent = `Rp ${activeBalance.toLocaleString('id-ID')}`;
  if (incEl) incEl.textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  if (expEl) expEl.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;

  const query = search.toLowerCase().trim();
  const filtered = financeTransactions.filter(tx => {
    const isIncome = tx.type === 'Pemasukan' || tx.type === 'INCOME';
    const txTypeNormalized = isIncome ? 'INCOME' : 'EXPENSE';

    const matchSearch = tx.desc.toLowerCase().includes(query) ||
                        (tx.pic && tx.pic.toLowerCase().includes(query)) ||
                        (tx.category && tx.category.toLowerCase().includes(query));
    
    const matchType = typeFilter === 'all' || txTypeNormalized === typeFilter;
    const matchCategory = categoryFilter === 'all' || tx.category === categoryFilter;

    return matchSearch && matchType && matchCategory;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 font-mono text-xs">Tidak ada transaksi yang sesuai filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(tx => {
    const isIncome = tx.type === 'Pemasukan' || tx.type === 'INCOME';
    return `
      <tr class="hover:bg-[#2d1052] transition-colors">
        <td class="text-[#D8B4FE] font-mono text-xs">${tx.date}</td>
        <td class="font-medium text-white">${tx.desc}</td>
        <td class="text-[#E9D8FD] text-xs">${tx.category}</td>
        <td>
          <span class="badge-status ${isIncome ? 'badge-approved' : 'badge-danger'} text-[10px]">
            ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </span>
        </td>
        <td class="font-mono font-bold ${isIncome ? 'text-emerald-300' : 'text-rose-300'}">
          ${isIncome ? '+' : '-'}Rp ${tx.amount.toLocaleString('id-ID')}
        </td>
        <td class="text-white text-xs">${tx.pic}</td>
        <td class="text-center">
          <span class="badge-status badge-neutral text-[10px]">${tx.status || 'Selesai'}</span>
        </td>
      </tr>
    `;
  }).join('');

  initIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('finance', 'Kas & Keuangan');
  renderFinance();

  const searchInput = document.getElementById('search-finance-input');
  const typeSelect = document.getElementById('filter-finance-type');
  const catSelect = document.getElementById('filter-finance-category');

  function applyFilter() {
    renderFinance(searchInput?.value || '', typeSelect?.value || 'all', catSelect?.value || 'all');
  }

  searchInput?.addEventListener('input', applyFilter);
  typeSelect?.addEventListener('change', applyFilter);
  catSelect?.addEventListener('change', applyFilter);

  const txModal = document.getElementById('transaction-modal');
  const form = document.getElementById('transaction-form');

  document.getElementById('open-add-transaction-modal')?.addEventListener('click', () => {
    txModal?.classList.remove('hidden');
    txModal?.classList.add('flex');
  });

  document.getElementById('close-transaction-modal')?.addEventListener('click', () => {
    txModal?.classList.add('hidden');
    txModal?.classList.remove('flex');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('tx-description').value.trim();
    const type = document.getElementById('tx-type').value;
    const amount = parseInt(document.getElementById('tx-amount').value, 10);
    const category = document.getElementById('tx-category').value;
    const pic = document.getElementById('tx-pic').value.trim();

    financeTransactions.unshift({
      id: `TX-0${financeTransactions.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      desc: desc,
      category: category,
      type: type,
      amount: amount,
      pic: pic || 'Bendahara KSM AIoT',
      status: 'Selesai'
    });

    renderFinance();
    txModal?.classList.add('hidden');
    txModal?.classList.remove('flex');
    form.reset();
    showToast(`Transaksi "${desc}" sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`, 'success');
  });
});
