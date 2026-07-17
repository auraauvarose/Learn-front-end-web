const STORAGE_KEY = 'EXPENSE_TRACKER';
const RENDER_EVENT = 'transaction:updated';

let transactions = [];
let editingId = null;
let searchKeyword = '';

const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');
const transactionForm = document.getElementById('transactionForm');
const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');
const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]');
const formHeading = document.getElementById('form-heading');

function generateId() {
  return +new Date();
}

function isStorageExist() {
  return typeof Storage !== 'undefined';
}

function formatRupiah(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function typeLabel(type) {
  return type === 'income' ? 'Pemasukan' : 'Pengeluaran';
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('transactionFormDateInput').value = today;
}

function saveDataToStorage() {
  if (isStorageExist()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}

function loadDataFromStorage() {
  if (isStorageExist()) {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const data = JSON.parse(serialized);
      if (data) {
        transactions = data;
      }
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

function makeTransactionElement(transaction) {
  const isIncome = transaction.type === 'income';

  const container = document.createElement('div');
  container.setAttribute('data-testid', 'transactionItem');
  container.classList.add('tracker-transaction-item');

  const icon = document.createElement('div');
  icon.classList.add(
    'tracker-transaction-item__icon',
    isIncome
      ? 'tracker-transaction-item__icon--income'
      : 'tracker-transaction-item__icon--expense'
  );
  icon.textContent = isIncome ? '💰' : '💸';

  const detail = document.createElement('div');
  detail.classList.add('tracker-transaction-item__detail');

  const titleEl = document.createElement('h3');
  titleEl.setAttribute('data-testid', 'transactionItemTitle');
  titleEl.classList.add('tracker-transaction-item__title');
  titleEl.textContent = transaction.title;

  const dateEl = document.createElement('p');
  dateEl.setAttribute('data-testid', 'transactionItemDate');
  dateEl.classList.add('tracker-transaction-item__date');
  dateEl.textContent = 'Tanggal: ' + transaction.date;

  detail.append(titleEl, dateEl);

  const right = document.createElement('div');
  right.classList.add('tracker-transaction-item__right');

  const amountEl = document.createElement('p');
  amountEl.setAttribute('data-testid', 'transactionItemAmount');
  amountEl.classList.add(
    'tracker-transaction-item__amount',
    isIncome
      ? 'tracker-transaction-item__amount--income'
      : 'tracker-transaction-item__amount--expense'
  );
  amountEl.textContent = 'Nominal: Rp' + transaction.amount.toLocaleString('id-ID');

  const typeEl = document.createElement('p');
  typeEl.setAttribute('data-testid', 'transactionItemType');
  typeEl.textContent = 'Tipe: ' + typeLabel(transaction.type);

  const actions = document.createElement('div');
  actions.classList.add('tracker-transaction-item__actions');

  const editBtn = document.createElement('button');
  editBtn.setAttribute('data-testid', 'transactionItemEditButton');
  editBtn.classList.add('tracker-transaction-item__btn');
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function () {
    editTransaction(transaction.id);
  });

  const changeTypeBtn = document.createElement('button');
  changeTypeBtn.setAttribute('data-testid', 'transactionItemEditTypeButton');
  changeTypeBtn.classList.add('tracker-transaction-item__btn');
  changeTypeBtn.textContent = 'Ubah Tipe';
  changeTypeBtn.addEventListener('click', function () {
    changeTransactionType(transaction.id);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteBtn.classList.add('tracker-transaction-item__btn');
  deleteBtn.textContent = 'Hapus';
  deleteBtn.addEventListener('click', function () {
    deleteTransaction(transaction.id);
  });

  actions.append(editBtn, changeTypeBtn, deleteBtn);
  right.append(amountEl, typeEl, actions);

  container.append(icon, detail, right);

  return container;
}

function renderTransactions() {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  const filtered = searchKeyword
    ? transactions.filter(function (t) {
        return t.title.toLowerCase().includes(searchKeyword.toLowerCase());
      })
    : transactions;

  for (const transaction of filtered) {
    const element = makeTransactionElement(transaction);
    if (transaction.type === 'income') {
      incomeList.append(element);
    } else {
      expenseList.append(element);
    }
  }
}

function updateDashboard() {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  }

  const balance = totalIncome - totalExpense;

  document.querySelector('.tracker-summary__balance-amount').textContent = formatRupiah(balance);
  document.querySelector('.tracker-summary__stat-amount--income').textContent = formatRupiah(totalIncome);
  document.querySelector('.tracker-summary__stat-amount--expense').textContent = formatRupiah(totalExpense);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('transactionFormTitleInput').value.trim();
  const amount = Number(document.getElementById('transactionFormAmountInput').value);
  const date = document.getElementById('transactionFormDateInput').value;
  const type = document.getElementById('transactionFormTypeSelect').value;

  if (!title) {
    alert('Judul transaksi tidak boleh kosong!');
    return;
  }
  if (!amount || amount < 1) {
    alert('Nominal harus minimal 1 rupiah!');
    return;
  }

  if (editingId !== null) {
    const index = transactions.findIndex(function (t) {
      return t.id === editingId;
    });
    if (index !== -1) {
      transactions[index] = {
        id: editingId,
        title: title,
        amount: amount,
        date: date,
        type: type,
      };
    }
    editingId = null;
    resetFormToAddMode();
  } else {
    const transaction = {
      id: generateId(),
      title: title,
      amount: amount,
      date: date,
      type: type,
    };
    transactions.push(transaction);
  }

  saveDataToStorage();
  transactionForm.reset();
  setDefaultDate();
  document.dispatchEvent(new Event(RENDER_EVENT));
}

function deleteTransaction(id) {
  const index = transactions.findIndex(function (t) {
    return t.id === id;
  });
  if (index !== -1) {
    transactions.splice(index, 1);
    saveDataToStorage();
    document.dispatchEvent(new Event(RENDER_EVENT));
  }
}

function editTransaction(id) {
  const transaction = transactions.find(function (t) {
    return t.id === id;
  });
  if (!transaction) return;

  document.getElementById('transactionFormTitleInput').value = transaction.title;
  document.getElementById('transactionFormAmountInput').value = transaction.amount;
  document.getElementById('transactionFormDateInput').value = transaction.date;
  document.getElementById('transactionFormTypeSelect').value = transaction.type;

  editingId = id;
  submitButton.textContent = 'Perbarui';
  formHeading.textContent = 'Edit Transaksi';

  transactionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function changeTransactionType(id) {
  const transaction = transactions.find(function (t) {
    return t.id === id;
  });
  if (!transaction) return;

  transaction.type = transaction.type === 'income' ? 'expense' : 'income';
  saveDataToStorage();
  document.dispatchEvent(new Event(RENDER_EVENT));
}

function resetFormToAddMode() {
  submitButton.textContent = 'Simpan';
  formHeading.textContent = 'Tambah Pencatatan Baru';
}

function handleSearchInput(e) {
  searchKeyword = e.target.value;
  document.dispatchEvent(new Event(RENDER_EVENT));
}

document.addEventListener('DOMContentLoaded', function () {
  setDefaultDate();

  transactionForm.addEventListener('submit', handleFormSubmit);

  searchInput.addEventListener('input', handleSearchInput);

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    searchKeyword = searchInput.value;
    document.dispatchEvent(new Event(RENDER_EVENT));
  });

  document.addEventListener(RENDER_EVENT, function () {
    renderTransactions();
    updateDashboard();
  });

  loadDataFromStorage();
});
