import '../style.css';
import { initCRMLayout } from '../modules/crm-layout.js';
import { showToast } from '../modules/ui.js';
import { initialFinanceData } from '../modules/data.js';

let financeTransactions = [...initialFinanceData];

function renderFinance() {
  const tbody = document.getElementById('transaction-tbody');
  if (!tbody) return;

  let totalIncome = 0;
  let totalExpense = 0;

  financeTransactions.forEach(tx => {
    if (tx.type === 'Pemasukan') totalIncome += tx.amount;
    if (tx.type === 'Pengeluaran') totalExpense += tx.amount;
  });

  const activeBalance = totalIncome - totalExpense;

  document.getElementById('stat-active-balance').textContent = `Rp ${activeBalance.toLocaleString('id-ID')}`;
  document.getElementById('stat-total-income').textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  document.getElementById('stat-total-expense').textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;

  tbody.innerHTML = financeTransactions.map(tx => `
    <tr class="hover:bg-slate-900/60 transition-colors whitespace-nowrap">
      <td class="py-4 px-5 text-slate-400 font-mono text-xs whitespace-nowrap">${tx.date}</td>
      <td class="py-4 px-5 font-bold text-white whitespace-nowrap">${tx.desc}</td>
      <td class="py-4 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">${tx.category}</td>
      <td class="py-4 px-5 whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium whitespace-nowrap ${
          tx.type === 'Pemasukan' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-pink-950 text-aiot-pink border border-pink-800'
        }">${tx.type}</span>
      </td>
      <td class="py-4 px-5 font-mono font-bold whitespace-nowrap ${tx.type === 'Pemasukan' ? 'text-emerald-400' : 'text-aiot-pink'}">
        ${tx.type === 'Pemasukan' ? '+' : '-'}Rp ${tx.amount.toLocaleString('id-ID')}
      </td>
      <td class="py-4 px-5 text-slate-300 font-medium text-xs whitespace-nowrap">${tx.pic}</td>
      <td class="py-4 px-5 text-center whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">${tx.status}</span>
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initCRMLayout('finance', 'Kas & Finansial KSM');
  renderFinance();

  const txModal = document.getElementById('transaction-modal');
  document.getElementById('open-add-transaction-modal')?.addEventListener('click', () => {
    txModal.classList.remove('hidden');
    txModal.classList.add('flex');
  });

  document.getElementById('close-transaction-modal')?.addEventListener('click', () => {
    txModal.classList.add('hidden');
    txModal.classList.remove('flex');
  });

  document.getElementById('add-tx-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('tx-desc').value.trim();
    const type = document.getElementById('tx-type').value;
    const amount = parseInt(document.getElementById('tx-amount').value, 10);
    const category = document.getElementById('tx-category').value;

    financeTransactions.unshift({
      id: `TX-0${financeTransactions.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      desc: desc,
      category: category,
      type: type,
      amount: amount,
      pic: 'Dzulfikri Adjmal (Super Admin)',
      status: 'Selesai'
    });

    renderFinance();
    txModal.classList.add('hidden');
    txModal.classList.remove('flex');
    e.target.reset();
    showToast(`Transaksi "${desc}" sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`, 'success');
  });
});
