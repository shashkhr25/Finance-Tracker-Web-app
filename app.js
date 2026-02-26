(() => {
  "use strict";

  const STORAGE_KEY = "financeTracker.web.v1";

  const DEFAULT_EXPENSE_CATEGORIES = [
    "Food",
    "Home",
    "Transportation",
    "Personal",
    "Rent",
    "House EMI",
    "Gym",
    "Utilities",
    "Shopping",
    "Petrol",
    "Subscription/Recharge",
    "Book",
    "Health/Medical",
    "Credit Card Bill",
    "Credit Card UPI Bill",
    "Savings",
    "Savings RD",
    "Savings FD",
    "Savings Gold",
    "Debt Cleared",
    "Others",
  ];

  const DEFAULT_EXPENSE_DEVICES = ["Cash", "UPI", "CREDIT_CARD", "CREDIT_CARD_UPI", "DEBT_BORROWED"];

  const DEFAULT_INCOME_SOURCES = [
    "Paycheck",
    "Rent",
    "Home",
    "Personal split paid",
    "Refund",
    "Savings Withdraw",
    "Taken from Savings",
    "Others",
  ];

  const ALLOWED_TX_TYPES = new Set(["expense", "income", "transfer"]);

  const state = {
    store: loadStore(),
    currentView: "dashboard-view",
    txSort: "newest",
    txFilters: defaultTxFilters(),
    categoryMode: "expense",
    sharedSelectedPerson: null,
    sharedDetailMap: new Map(),
    sharedNetMap: new Map(),
  };

  const els = {
    userScreen: document.getElementById("user-screen"),
    appShell: document.getElementById("app-shell"),
    userList: document.getElementById("user-list"),
    createUserForm: document.getElementById("create-user-form"),
    createUsername: document.getElementById("create-username"),

    navList: document.getElementById("nav-list"),
    viewTitle: document.getElementById("view-title"),
    todayLabel: document.getElementById("today-label"),
    activeUserLabel: document.getElementById("active-user-label"),
    logoutBtn: document.getElementById("logout-btn"),

    dashboardMetrics: document.getElementById("dashboard-metrics"),
    recentTransactions: document.getElementById("recent-transactions"),

    txSearch: document.getElementById("tx-search"),
    txCategoryFilter: document.getElementById("tx-category-filter"),
    txDeviceFilter: document.getElementById("tx-device-filter"),
    txDateFilter: document.getElementById("tx-date-filter"),
    txMonthFilter: document.getElementById("tx-month-filter"),
    txYearFilter: document.getElementById("tx-year-filter"),
    txSortToggle: document.getElementById("tx-sort-toggle"),
    txClearFilters: document.getElementById("tx-clear-filters"),
    transactionsTable: document.getElementById("transactions-table"),

    catModeExpense: document.getElementById("cat-mode-expense"),
    catModeIncome: document.getElementById("cat-mode-income"),
    catMonth: document.getElementById("cat-month"),
    catYear: document.getElementById("cat-year"),
    catFilter: document.getElementById("cat-filter"),
    catTotal: document.getElementById("cat-total"),
    categoryTable: document.getElementById("category-table"),

    sharedPersonFilter: document.getElementById("shared-person-filter"),
    sharedCategoryFilter: document.getElementById("shared-category-filter"),
    sharedCaption: document.getElementById("shared-caption"),
    sharedSummaryTable: document.getElementById("shared-summary-table"),
    sharedSummaryView: document.getElementById("shared-summary-view"),
    sharedPersonView: document.getElementById("shared-person-view"),
    sharedPersonTitle: document.getElementById("shared-person-title"),
    sharedPersonNet: document.getElementById("shared-person-net"),
    sharedPersonTable: document.getElementById("shared-person-table"),
    sharedBackBtn: document.getElementById("shared-back-btn"),

    networthMetrics: document.getElementById("networth-metrics"),
    savingsBreakdown: document.getElementById("savings-breakdown"),
    debtBreakdown: document.getElementById("debt-breakdown"),

    initialAccount: document.getElementById("initial-account"),
    initialCash: document.getElementById("initial-cash"),
    currencyInput: document.getElementById("currency-input"),
    saveBalancesBtn: document.getElementById("save-balances-btn"),
    openSavingsBtn: document.getElementById("open-savings-btn"),

    devicesText: document.getElementById("devices-text"),
    sourcesText: document.getElementById("sources-text"),
    saveInstrumentsBtn: document.getElementById("save-instruments-btn"),

    categoriesText: document.getElementById("categories-text"),
    addCategoryInput: document.getElementById("add-category-input"),
    addCategoryBtn: document.getElementById("add-category-btn"),
    renameOldInput: document.getElementById("rename-old-input"),
    renameNewInput: document.getElementById("rename-new-input"),
    renameCategoryBtn: document.getElementById("rename-category-btn"),
    removeCategoryInput: document.getElementById("remove-category-input"),
    removeCategoryBtn: document.getElementById("remove-category-btn"),
    saveCategoriesBtn: document.getElementById("save-categories-btn"),
    csvImportInput: document.getElementById("csv-import-input"),
    csvImportMode: document.getElementById("csv-import-mode"),
    importCsvBtn: document.getElementById("import-csv-btn"),
    csvImportStatus: document.getElementById("csv-import-status"),
    clearDebtBtn: document.getElementById("clear-debt-btn"),
    importSettingsBtn: document.getElementById("import-settings-btn"),
    exportSettingsBtn: document.getElementById("export-settings-btn"),
    exportTransactionsBtn: document.getElementById("export-transactions-btn"),

    openExpenseBtn: document.getElementById("open-expense-btn"),
    openIncomeBtn: document.getElementById("open-income-btn"),

    expenseModal: document.getElementById("expense-modal"),
    expenseForm: document.getElementById("expense-form"),
    expenseAmount: document.getElementById("expense-amount"),
    expenseDate: document.getElementById("expense-date"),
    expenseDescription: document.getElementById("expense-description"),
    expenseCategory: document.getElementById("expense-category"),
    expenseDevice: document.getElementById("expense-device"),
    expenseSharedFlag: document.getElementById("expense-shared-flag"),
    expenseSharedBox: document.getElementById("expense-shared-box"),
    expenseSharedInput: document.getElementById("expense-shared-input"),
    expenseSharedNotes: document.getElementById("expense-shared-notes"),

    incomeModal: document.getElementById("income-modal"),
    incomeForm: document.getElementById("income-form"),
    incomeAmount: document.getElementById("income-amount"),
    incomeDate: document.getElementById("income-date"),
    incomeDescription: document.getElementById("income-description"),
    incomeSource: document.getElementById("income-source"),
    incomeRefundCategory: document.getElementById("income-refund-category"),
    incomeCashFlag: document.getElementById("income-cash-flag"),
    incomeSharedFlag: document.getElementById("income-shared-flag"),
    incomeSharedBox: document.getElementById("income-shared-box"),
    incomeSharedInput: document.getElementById("income-shared-input"),
    incomeSharedNotes: document.getElementById("income-shared-notes"),

    editModal: document.getElementById("edit-modal"),
    editForm: document.getElementById("edit-form"),
    editId: document.getElementById("edit-id"),
    editAmount: document.getElementById("edit-amount"),
    editDate: document.getElementById("edit-date"),
    editType: document.getElementById("edit-type"),
    editSubType: document.getElementById("edit-sub-type"),
    editDescription: document.getElementById("edit-description"),
    editCategory: document.getElementById("edit-category"),
    editDevice: document.getElementById("edit-device"),
    editEffectsBalance: document.getElementById("edit-effects-balance"),
    editSharedFlag: document.getElementById("edit-shared-flag"),
    editSharedBox: document.getElementById("edit-shared-box"),
    editSharedInput: document.getElementById("edit-shared-input"),
    editSharedNotes: document.getElementById("edit-shared-notes"),

    savingsModal: document.getElementById("savings-modal"),
    savingsForm: document.getElementById("savings-form"),
    savingMain: document.getElementById("saving-main"),
    savingFd: document.getElementById("saving-fd"),
    savingRd: document.getElementById("saving-rd"),
    savingGold: document.getElementById("saving-gold"),

    expenseCategoriesList: document.getElementById("expense-categories-list"),
    expenseDevicesList: document.getElementById("expense-devices-list"),
    incomeSourcesList: document.getElementById("income-sources-list"),

    toast: document.getElementById("toast"),
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    boot();
  }

  function bindEvents() {
    els.createUserForm.addEventListener("submit", onCreateUser);
    els.userList.addEventListener("click", onSelectUser);

    els.navList.addEventListener("click", onNavClick);
    els.logoutBtn.addEventListener("click", logout);

    els.openExpenseBtn.addEventListener("click", () => {
      resetExpenseForm();
      openModal("expense-modal");
    });

    els.openIncomeBtn.addEventListener("click", () => {
      resetIncomeForm();
      openModal("income-modal");
    });

    els.expenseSharedFlag.addEventListener("change", () => {
      els.expenseSharedBox.classList.toggle("hidden", !els.expenseSharedFlag.checked);
    });

    els.incomeSharedFlag.addEventListener("change", () => {
      els.incomeSharedBox.classList.toggle("hidden", !els.incomeSharedFlag.checked);
    });

    els.editSharedFlag.addEventListener("change", () => {
      els.editSharedBox.classList.toggle("hidden", !els.editSharedFlag.checked);
    });

    els.expenseForm.addEventListener("submit", onExpenseSubmit);
    els.incomeForm.addEventListener("submit", onIncomeSubmit);
    els.editForm.addEventListener("submit", onEditSubmit);

    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
    });

    [els.expenseModal, els.incomeModal, els.editModal, els.savingsModal].forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    els.txSearch.addEventListener("input", () => {
      state.txFilters.search = els.txSearch.value;
      renderTransactionsView();
    });

    els.txCategoryFilter.addEventListener("input", () => {
      state.txFilters.category = els.txCategoryFilter.value;
      renderTransactionsView();
    });

    els.txDeviceFilter.addEventListener("input", () => {
      state.txFilters.device = els.txDeviceFilter.value;
      renderTransactionsView();
    });

    els.txDateFilter.addEventListener("input", () => {
      state.txFilters.date = els.txDateFilter.value;
      renderTransactionsView();
    });

    els.txMonthFilter.addEventListener("input", () => {
      state.txFilters.month = Number(els.txMonthFilter.value) || null;
      renderTransactionsView();
    });

    els.txYearFilter.addEventListener("input", () => {
      state.txFilters.year = Number(els.txYearFilter.value) || null;
      renderTransactionsView();
    });

    els.txSortToggle.addEventListener("click", () => {
      state.txSort = state.txSort === "newest" ? "oldest" : "newest";
      els.txSortToggle.textContent = `Sort: ${state.txSort === "newest" ? "Newest first" : "Oldest first"}`;
      renderTransactionsView();
    });

    els.txClearFilters.addEventListener("click", () => {
      state.txFilters = defaultTxFilters();
      syncTxFiltersToInputs();
      renderTransactionsView();
    });

    els.transactionsTable.addEventListener("click", onTransactionTableClick);
    els.recentTransactions.addEventListener("click", onTransactionTableClick);

    els.catModeExpense.addEventListener("click", () => {
      state.categoryMode = "expense";
      refreshCategoryModeButtons();
      renderCategoryView();
    });

    els.catModeIncome.addEventListener("click", () => {
      state.categoryMode = "income";
      refreshCategoryModeButtons();
      renderCategoryView();
    });

    els.catMonth.addEventListener("input", renderCategoryView);
    els.catYear.addEventListener("input", renderCategoryView);
    els.catFilter.addEventListener("input", renderCategoryView);

    els.categoryTable.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      const encodedCategory = input.dataset.budgetCat;
      if (!encodedCategory) {
        return;
      }
      const category = decodeURIComponent(encodedCategory);
      const settings = getCurrentSettings();
      settings.category_budgets[category] = round2(Number(input.value) || 0);
      saveStore();
      renderCategoryView();
      renderDashboard();
    });

    els.sharedPersonFilter.addEventListener("input", () => {
      state.sharedSelectedPerson = null;
      renderSharedView();
    });

    els.sharedCategoryFilter.addEventListener("input", () => {
      state.sharedSelectedPerson = null;
      renderSharedView();
    });

    els.sharedSummaryTable.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest("button[data-person]");
      if (!button) {
        return;
      }
      state.sharedSelectedPerson = button.getAttribute("data-person") || null;
      renderSharedView();
    });

    els.sharedBackBtn.addEventListener("click", () => {
      state.sharedSelectedPerson = null;
      renderSharedView();
    });

    els.saveBalancesBtn.addEventListener("click", saveBalances);
    els.openSavingsBtn.addEventListener("click", () => {
      hydrateSavingsModal();
      openModal("savings-modal");
    });
    els.savingsForm.addEventListener("submit", saveSavings);

    els.saveInstrumentsBtn.addEventListener("click", saveInstruments);
    els.saveCategoriesBtn.addEventListener("click", saveCategoriesFromTextarea);
    els.addCategoryBtn.addEventListener("click", addCategory);
    els.renameCategoryBtn.addEventListener("click", renameCategory);
    els.removeCategoryBtn.addEventListener("click", removeCategory);
    els.importCsvBtn.addEventListener("click", importCsvFile);
    els.csvImportInput.addEventListener("change", () => {
      setCsvImportStatus("");
    });

    els.clearDebtBtn.addEventListener("click", () => {
      clearOutstandingDebt({ silent: false, markAuto: false });
      renderAll();
    });

    els.importSettingsBtn.addEventListener("click", importSettings);
    els.exportSettingsBtn.addEventListener("click", exportSettings);
    els.exportTransactionsBtn.addEventListener("click", exportTransactions);
  }

  function boot() {
    if (!state.store.currentUser) {
      showUserScreen();
      return;
    }

    ensureUserData(state.store.currentUser);
    processMonthlyLifecycle();
    runAutoDebtClearCheck();
    showAppShell();
    hydrateFiltersForCurrentDate();
    hydrateCategoryMonthYear();
    renderAll();
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          users: [],
          currentUser: null,
          userData: {},
        };
      }
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        currentUser: typeof parsed.currentUser === "string" ? parsed.currentUser : null,
        userData: parsed.userData && typeof parsed.userData === "object" ? parsed.userData : {},
      };
    } catch (_error) {
      return {
        users: [],
        currentUser: null,
        userData: {},
      };
    }
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
  }

  function createDefaultSettings() {
    return {
      version: 1,
      currency: "INR",
      initial_balances: {
        account: 0,
        cash: 0,
      },
      initial_savings: {
        savings: 0,
        fd: 0,
        rd: 0,
        gold: 0,
      },
      category_budgets: {},
      expense_categories: [...DEFAULT_EXPENSE_CATEGORIES],
      expense_devices: [...DEFAULT_EXPENSE_DEVICES],
      income_sources: [...DEFAULT_INCOME_SOURCES],
      lifecycle: {
        last_debt_cleared: null,
        last_month_processed: null,
      },
    };
  }

  function ensureUserData(username) {
    if (!state.store.userData[username]) {
      state.store.userData[username] = {
        settings: createDefaultSettings(),
        transactions: [],
        archives: {},
      };
      saveStore();
      return;
    }

    const userData = state.store.userData[username];
    if (!userData.settings) {
      userData.settings = createDefaultSettings();
    }
    if (!Array.isArray(userData.transactions)) {
      userData.transactions = [];
    }
    if (!userData.archives || typeof userData.archives !== "object") {
      userData.archives = {};
    }

    // Backward-safe fills
    userData.settings.version ||= 1;
    userData.settings.currency ||= "INR";
    userData.settings.initial_balances ||= { account: 0, cash: 0 };
    userData.settings.initial_savings ||= { savings: 0, fd: 0, rd: 0, gold: 0 };
    userData.settings.category_budgets ||= {};
    userData.settings.expense_categories ||= [...DEFAULT_EXPENSE_CATEGORIES];
    userData.settings.expense_devices ||= [...DEFAULT_EXPENSE_DEVICES];
    userData.settings.income_sources ||= [...DEFAULT_INCOME_SOURCES];
    userData.settings.lifecycle ||= { last_debt_cleared: null, last_month_processed: null };
    userData.settings.lifecycle.last_debt_cleared ||= null;
    userData.settings.lifecycle.last_month_processed ||= null;

    saveStore();
  }

  function getCurrentUserData() {
    const username = state.store.currentUser;
    if (!username) {
      throw new Error("No active user");
    }
    ensureUserData(username);
    return state.store.userData[username];
  }

  function getCurrentSettings() {
    return getCurrentUserData().settings;
  }

  function showUserScreen() {
    els.userScreen.classList.remove("hidden");
    els.appShell.classList.add("hidden");
    renderUserList();
    els.createUsername.value = "";
  }

  function showAppShell() {
    els.userScreen.classList.add("hidden");
    els.appShell.classList.remove("hidden");
  }

  function renderUserList() {
    if (!state.store.users.length) {
      els.userList.innerHTML = `<p class="muted">No users yet. Create one to continue.</p>`;
      return;
    }

    els.userList.innerHTML = state.store.users
      .map((user) => {
        return `<button class="user-chip" data-username="${escapeHtml(user.username)}">${escapeHtml(
          user.username
        )}</button>`;
      })
      .join("");
  }

  function onCreateUser(event) {
    event.preventDefault();
    const username = els.createUsername.value.trim();
    if (!username) {
      showToast("Username is required");
      return;
    }
    if (username.length < 3) {
      showToast("Username must be at least 3 characters");
      return;
    }

    const duplicate = state.store.users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (duplicate) {
      showToast("Username already exists");
      return;
    }

    state.store.users.push({ username, created_at: new Date().toISOString() });
    state.store.currentUser = username;
    ensureUserData(username);
    saveStore();
    boot();
  }

  function onSelectUser(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-username]");
    if (!button) {
      return;
    }

    const username = button.getAttribute("data-username");
    if (!username) {
      return;
    }

    state.store.currentUser = username;
    ensureUserData(username);
    saveStore();
    boot();
  }

  function logout() {
    state.store.currentUser = null;
    saveStore();
    showUserScreen();
  }

  function processMonthlyLifecycle() {
    const userData = getCurrentUserData();
    const lifecycle = userData.settings.lifecycle;
    const currentMonth = todayISO().slice(0, 7);

    if (!lifecycle.last_month_processed) {
      lifecycle.last_month_processed = currentMonth;
      saveStore();
      return;
    }

    if (lifecycle.last_month_processed !== currentMonth) {
      const previousMonth = lifecycle.last_month_processed;
      userData.archives[previousMonth] = Array.isArray(userData.transactions) ? [...userData.transactions] : [];
      userData.transactions = [];
      lifecycle.last_month_processed = currentMonth;
      saveStore();
      showToast(`Archived transactions for ${previousMonth}`);
    }
  }

  function runAutoDebtClearCheck() {
    const today = new Date();
    const userData = getCurrentUserData();
    const lifecycle = userData.settings.lifecycle;
    const currentMonth = todayISO().slice(0, 7);

    if (today.getDate() !== 19) {
      return;
    }

    if (lifecycle.last_debt_cleared === currentMonth) {
      return;
    }

    clearOutstandingDebt({ silent: true, markAuto: true });
    lifecycle.last_debt_cleared = currentMonth;
    saveStore();
  }

  function clearOutstandingDebt({ silent, markAuto }) {
    const userData = getCurrentUserData();
    const transactions = userData.transactions;

    const creditDebt = computeCreditCardDebt(transactions);
    const borrowedDebt = computeBorrowedDebt(transactions);

    const newEntries = [];

    if (creditDebt > 0) {
      const idA = createId();
      const idB = createId();
      newEntries.push(
        createTransaction({
          id: idA,
          tx_type: "expense",
          amount: creditDebt,
          date: todayISO(),
          description: markAuto ? "Auto credit debt clear" : "Credit debt clear",
          category: "Credit Card Bill",
          device: "BANK_TRANSFER",
          effects_balance: true,
          linked_tx_id: idB,
          meta: { cc_payment: true, auto_clear: Boolean(markAuto) },
        })
      );
      newEntries.push(
        createTransaction({
          id: idB,
          tx_type: "income",
          sub_type: "debt_offset",
          amount: creditDebt,
          date: todayISO(),
          description: "Debt reduction audit",
          category: "Credit Card Debt",
          device: "OTHER",
          effects_balance: false,
          linked_tx_id: idA,
          meta: { debt_audit: true, auto_clear: Boolean(markAuto) },
        })
      );
    }

    if (borrowedDebt > 0) {
      newEntries.push(
        createTransaction({
          tx_type: "expense",
          amount: borrowedDebt,
          date: todayISO(),
          description: markAuto ? "Auto borrowed debt clear" : "Borrowed debt clear",
          category: "Debt Cleared",
          device: "UPI",
          effects_balance: true,
          meta: { borrowed_clear: true, auto_clear: Boolean(markAuto) },
        })
      );
    }

    if (!newEntries.length) {
      if (!silent) {
        showToast("No outstanding debt to clear");
      }
      return false;
    }

    userData.transactions.push(...newEntries);
    saveStore();
    if (!silent) {
      showToast("Outstanding debt cleared");
    }
    return true;
  }

  function onNavClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-view]");
    if (!button) {
      return;
    }

    const viewId = button.getAttribute("data-view");
    if (!viewId) {
      return;
    }
    setView(viewId);
  }

  function setView(viewId) {
    state.currentView = viewId;

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("hidden", view.id !== viewId);
    });

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
    });

    const title = {
      "dashboard-view": "Dashboard",
      "transactions-view": "Transactions",
      "category-view": "Category Totals",
      "shared-view": "Shared Expenses",
      "networth-view": "Net Worth",
      "settings-view": "Settings",
    }[viewId];

    els.viewTitle.textContent = title || "FinanceTracker";

    if (viewId === "settings-view") {
      hydrateSettingsFields();
    }

    if (viewId === "shared-view") {
      renderSharedView();
    }
  }

  function renderAll() {
    const currentUser = state.store.currentUser;
    if (!currentUser) {
      showUserScreen();
      return;
    }

    els.activeUserLabel.textContent = `User: ${currentUser}`;
    els.todayLabel.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    hydrateSettingsFields();
    refreshDatalists();
    renderDashboard();
    renderTransactionsView();
    renderCategoryView();
    renderSharedView();
    renderNetWorthView();
    setView(state.currentView);
  }

  function refreshDatalists() {
    const settings = getCurrentSettings();

    els.expenseCategoriesList.innerHTML = settings.expense_categories
      .map((category) => `<option value="${escapeHtml(category)}"></option>`)
      .join("");

    els.expenseDevicesList.innerHTML = settings.expense_devices
      .map((device) => `<option value="${escapeHtml(device)}"></option>`)
      .join("");

    els.incomeSourcesList.innerHTML = settings.income_sources
      .map((source) => `<option value="${escapeHtml(source)}"></option>`)
      .join("");
  }

  function renderDashboard() {
    const settings = getCurrentSettings();
    const transactions = getCurrentUserData().transactions;

    const balances = computeBalances(transactions, settings);
    const creditDebt = computeCreditCardDebt(transactions);
    const borrowedDebt = computeBorrowedDebt(transactions);

    const cards = [
      ["Liquid Balance", formatMoney(balances.liquid)],
      ["Account", formatMoney(balances.account)],
      ["Cash", formatMoney(balances.cash)],
      ["Credit Card Debt", formatMoney(creditDebt)],
      ["Borrowed Debt", formatMoney(borrowedDebt)],
    ];

    els.dashboardMetrics.innerHTML = cards
      .map(
        ([label, value]) =>
          `<article class="metric-card"><p class="metric-label">${escapeHtml(label)}</p><p class="metric-value">${escapeHtml(
            value
          )}</p></article>`
      )
      .join("");

    const recent = [...transactions]
      .sort(compareTxDesc)
      .slice(0, 8);

    els.recentTransactions.innerHTML = renderTransactionTableMarkup(recent, false);
  }

  function hydrateFiltersForCurrentDate() {
    state.txFilters = defaultTxFilters();
    syncTxFiltersToInputs();
  }

  function hydrateCategoryMonthYear() {
    const now = new Date();
    els.catMonth.value = String(now.getMonth() + 1);
    els.catYear.value = String(now.getFullYear());
  }

  function defaultTxFilters() {
    const now = new Date();
    return {
      search: "",
      category: "",
      device: "",
      date: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }

  function syncTxFiltersToInputs() {
    els.txSearch.value = state.txFilters.search;
    els.txCategoryFilter.value = state.txFilters.category;
    els.txDeviceFilter.value = state.txFilters.device;
    els.txDateFilter.value = state.txFilters.date;
    els.txMonthFilter.value = state.txFilters.month ? String(state.txFilters.month) : "";
    els.txYearFilter.value = state.txFilters.year ? String(state.txFilters.year) : "";
  }

  function getFilteredTransactions() {
    const txs = [...getCurrentUserData().transactions].sort(state.txSort === "newest" ? compareTxDesc : compareTxAsc);

    return txs.filter((tx) => {
      const search = state.txFilters.search.trim().toLowerCase();
      const category = state.txFilters.category.trim().toLowerCase();
      const device = state.txFilters.device.trim().toLowerCase();
      const date = state.txFilters.date.trim();

      const txDescription = String(tx.description || "").toLowerCase();
      const txCategory = String(tx.category || "").toLowerCase();
      const txDevice = String(tx.device || "").toLowerCase();
      const txDate = String(tx.date || "");

      if (search) {
        const matchSearch = txDescription.includes(search) || txCategory.includes(search) || txDevice.includes(search);
        if (!matchSearch) {
          return false;
        }
      }

      if (category && !txCategory.startsWith(category)) {
        return false;
      }

      if (device && !txDevice.startsWith(device)) {
        return false;
      }

      if (date) {
        if (!(txDate === date || txDate.startsWith(date))) {
          return false;
        }
      } else {
        const [y, m] = (txDate || "").split("-").map((p) => Number(p));
        if (state.txFilters.month && m !== state.txFilters.month) {
          return false;
        }
        if (state.txFilters.year && y !== state.txFilters.year) {
          return false;
        }
      }

      return true;
    });
  }

  function renderTransactionsView() {
    const filtered = getFilteredTransactions();
    els.transactionsTable.innerHTML = renderTransactionTableMarkup(filtered, true);
  }

  function renderTransactionTableMarkup(transactions, withActions) {
    if (!transactions.length) {
      return `<p class="muted">No transactions found for current filters.</p>`;
    }

    const header = withActions
      ? "<th>Actions</th>"
      : "";

    const rows = transactions
      .map((tx) => {
        const sign = tx.tx_type === "income" ? "+" : tx.tx_type === "expense" ? "-" : "";
        const amountClass = tx.tx_type === "income" ? "amount-positive" : "amount-negative";
        const sharedText = tx.shared_flag ? "<span class=\"pill\">Shared</span>" : "";

        const actions = withActions
          ? `<td>
              <div class="quick-row">
                <button class="btn ghost" data-action="edit" data-id="${escapeHtml(tx.id)}">Edit</button>
                <button class="btn ghost" data-action="delete" data-id="${escapeHtml(tx.id)}">Delete</button>
              </div>
            </td>`
          : "";

        return `<tr>
          <td>${escapeHtml(tx.date || "")}</td>
          <td>${escapeHtml(tx.tx_type || "")}</td>
          <td>${escapeHtml(tx.category || "")}</td>
          <td>${escapeHtml(tx.description || "")}</td>
          <td>${escapeHtml(tx.device || "")}</td>
          <td class="${amountClass}">${escapeHtml(`${sign}${formatMoney(tx.amount)}`)}</td>
          <td>${sharedText}</td>
          ${actions}
        </tr>`;
      })
      .join("");

    return `<table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Category</th>
          <th>Description</th>
          <th>Device</th>
          <th>Amount</th>
          <th>Shared</th>
          ${header}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function onTransactionTableClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.getAttribute("data-action");
    const id = button.getAttribute("data-id");
    if (!action || !id) {
      return;
    }

    if (action === "edit") {
      openEditModal(id);
      return;
    }

    if (action === "delete") {
      deleteTransaction(id);
    }
  }

  function openEditModal(id) {
    const tx = getCurrentUserData().transactions.find((item) => item.id === id);
    if (!tx) {
      showToast("Transaction not found");
      return;
    }

    els.editId.value = tx.id;
    els.editAmount.value = String(tx.amount);
    els.editDate.value = tx.date || todayISO();
    els.editType.value = tx.tx_type || "";
    els.editSubType.value = tx.sub_type || "";
    els.editDescription.value = tx.description || "";
    els.editCategory.value = tx.category || "";
    els.editDevice.value = tx.device || "";
    els.editEffectsBalance.checked = Boolean(tx.effects_balance);
    els.editSharedFlag.checked = Boolean(tx.shared_flag);
    els.editSharedBox.classList.toggle("hidden", !tx.shared_flag);
    els.editSharedInput.value = stringifySharedSplits(tx.shared_splits || {});
    els.editSharedNotes.value = tx.shared_notes || "";

    openModal("edit-modal");
  }

  function onEditSubmit(event) {
    event.preventDefault();
    const id = els.editId.value;
    const userData = getCurrentUserData();
    const index = userData.transactions.findIndex((tx) => tx.id === id);

    if (index < 0) {
      showToast("Transaction not found");
      return;
    }

    const amount = round2(Number(els.editAmount.value));
    const date = els.editDate.value;

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Amount must be greater than 0");
      return;
    }

    if (!isValidDateString(date)) {
      showToast("Invalid date");
      return;
    }

    let sharedSplits = {};
    let sharedNotes = "";
    const sharedFlag = els.editSharedFlag.checked;
    if (sharedFlag) {
      try {
        sharedSplits = parseSharedInput(els.editSharedInput.value, amount);
      } catch (error) {
        showToast(error.message);
        return;
      }
      sharedNotes = els.editSharedNotes.value.trim();
    }

    const existing = userData.transactions[index];
    const updated = {
      ...existing,
      amount,
      date,
      description: els.editDescription.value.trim(),
      category: els.editCategory.value.trim(),
      device: els.editDevice.value.trim(),
      sub_type: els.editSubType.value.trim(),
      effects_balance: Boolean(els.editEffectsBalance.checked),
      shared_flag: sharedFlag,
      shared_splits: sharedFlag ? sharedSplits : {},
      shared_notes: sharedFlag ? sharedNotes : "",
    };

    const error = validateTransaction(updated);
    if (error) {
      showToast(error);
      return;
    }

    userData.transactions[index] = updated;
    saveStore();
    closeModal("edit-modal");
    showToast("Transaction updated");
    renderAll();
  }

  function deleteTransaction(id) {
    const userData = getCurrentUserData();
    const tx = userData.transactions.find((item) => item.id === id);
    if (!tx) {
      showToast("Transaction not found");
      return;
    }

    const shouldDelete = window.confirm(
      tx.linked_tx_id
        ? "This transaction is linked. Delete both linked entries?"
        : "Delete this transaction?"
    );

    if (!shouldDelete) {
      return;
    }

    if (tx.linked_tx_id) {
      userData.transactions = userData.transactions.filter((item) => item.id !== tx.id && item.id !== tx.linked_tx_id);
    } else {
      userData.transactions = userData.transactions.filter((item) => item.id !== tx.id);
    }

    saveStore();
    showToast("Transaction deleted");
    renderAll();
  }

  function onExpenseSubmit(event) {
    event.preventDefault();

    const amount = round2(Number(els.expenseAmount.value));
    const date = els.expenseDate.value;
    const description = els.expenseDescription.value.trim();
    const category = els.expenseCategory.value.trim();
    const device = els.expenseDevice.value.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Amount must be greater than 0");
      return;
    }

    if (!isValidDateString(date)) {
      showToast("Invalid date");
      return;
    }

    if (!description || !category || !device) {
      showToast("Description, category and device are required");
      return;
    }

    let sharedFlag = false;
    let sharedSplits = {};
    let sharedNotes = "";

    if (els.expenseSharedFlag.checked) {
      sharedFlag = true;
      try {
        sharedSplits = parseSharedInput(els.expenseSharedInput.value, amount);
      } catch (error) {
        showToast(error.message);
        return;
      }
      sharedNotes = els.expenseSharedNotes.value.trim();
    }

    const userData = getCurrentUserData();
    const entries = [];

    if (isCreditCardPaymentCategory(category)) {
      const idA = createId();
      const idB = createId();

      entries.push(
        createTransaction({
          id: idA,
          tx_type: "expense",
          amount,
          date,
          description,
          category,
          device,
          effects_balance: true,
          linked_tx_id: idB,
          shared_flag: sharedFlag,
          shared_splits: sharedSplits,
          shared_notes: sharedNotes,
          meta: { cc_payment: true },
        })
      );

      entries.push(
        createTransaction({
          id: idB,
          tx_type: "income",
          sub_type: "debt_offset",
          amount,
          date,
          description: "Debt reduction audit",
          category: "Credit Card Debt",
          device: "OTHER",
          effects_balance: false,
          linked_tx_id: idA,
          shared_flag: false,
          shared_splits: {},
          shared_notes: "",
          meta: { debt_audit: true },
        })
      );
    } else if (isCreditCardPurchase(device, description)) {
      const idA = createId();
      const idB = createId();

      entries.push(
        createTransaction({
          id: idA,
          tx_type: "expense",
          amount,
          date,
          description,
          category,
          device,
          effects_balance: false,
          linked_tx_id: idB,
          shared_flag: sharedFlag,
          shared_splits: sharedSplits,
          shared_notes: sharedNotes,
          meta: { cc_purchase: true },
        })
      );

      entries.push(
        createTransaction({
          id: idB,
          tx_type: "income",
          sub_type: "debt_increase",
          amount,
          date,
          description: "Synthetic credit debt increase",
          category: "Credit Card Debt",
          device: "OTHER",
          effects_balance: false,
          linked_tx_id: idA,
          shared_flag: false,
          shared_splits: {},
          shared_notes: "",
          meta: { debt_synthetic: true },
        })
      );
    } else {
      entries.push(
        createTransaction({
          tx_type: "expense",
          amount,
          date,
          description,
          category,
          device,
          effects_balance: true,
          shared_flag: sharedFlag,
          shared_splits: sharedSplits,
          shared_notes: sharedNotes,
        })
      );
    }

    for (const entry of entries) {
      const validationError = validateTransaction(entry);
      if (validationError) {
        showToast(validationError);
        return;
      }
    }

    userData.transactions.push(...entries);
    saveStore();
    closeModal("expense-modal");
    resetExpenseForm();
    showToast("Expense added");
    renderAll();
  }

  function onIncomeSubmit(event) {
    event.preventDefault();

    const amount = round2(Number(els.incomeAmount.value));
    const date = els.incomeDate.value;
    const description = els.incomeDescription.value.trim();
    const source = els.incomeSource.value.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Amount must be greater than 0");
      return;
    }

    if (!isValidDateString(date)) {
      showToast("Invalid date");
      return;
    }

    if (!description || !source) {
      showToast("Description and source are required");
      return;
    }

    let category = source;
    let device = els.incomeCashFlag.checked ? "CASH" : source;
    let subType = "";

    if (source.trim().toLowerCase() === "refund") {
      const refundCategory = els.incomeRefundCategory.value.trim();
      if (!refundCategory) {
        showToast("Refund category is required when source is Refund");
        return;
      }
      subType = "refund";
      category = refundCategory;
    }

    const sourceLower = source.toLowerCase();
    if (sourceLower === "savings withdraw" || sourceLower === "taken from savings") {
      subType = "savings_withdraw";
      category = "Taken from Savings";
      device = "SAVINGS_WITHDRAW";
    }

    let sharedFlag = false;
    let sharedSplits = {};
    let sharedNotes = "";

    if (els.incomeSharedFlag.checked) {
      sharedFlag = true;
      try {
        sharedSplits = parseSharedInput(els.incomeSharedInput.value, amount);
      } catch (error) {
        showToast(error.message);
        return;
      }
      sharedNotes = els.incomeSharedNotes.value.trim();
    }

    const tx = createTransaction({
      tx_type: "income",
      sub_type: subType,
      amount,
      date,
      description,
      category,
      device,
      effects_balance: true,
      shared_flag: sharedFlag,
      shared_splits: sharedSplits,
      shared_notes: sharedNotes,
    });

    const validationError = validateTransaction(tx);
    if (validationError) {
      showToast(validationError);
      return;
    }

    getCurrentUserData().transactions.push(tx);
    saveStore();
    closeModal("income-modal");
    resetIncomeForm();
    showToast("Income added");
    renderAll();
  }

  function createTransaction(partial) {
    return {
      id: partial.id || createId(),
      timestamp: partial.timestamp || new Date().toISOString(),
      tx_type: partial.tx_type || "expense",
      sub_type: partial.sub_type || "",
      amount: round2(Number(partial.amount) || 0),
      date: partial.date || todayISO(),
      description: partial.description || "",
      category: partial.category || "",
      device: partial.device || "",
      effects_balance: partial.effects_balance !== undefined ? Boolean(partial.effects_balance) : true,
      linked_tx_id: partial.linked_tx_id || "",
      shared_flag: Boolean(partial.shared_flag),
      shared_splits: partial.shared_splits && typeof partial.shared_splits === "object" ? partial.shared_splits : {},
      shared_notes: partial.shared_notes || "",
      meta: partial.meta && typeof partial.meta === "object" ? partial.meta : {},
    };
  }

  function validateTransaction(tx) {
    if (!ALLOWED_TX_TYPES.has(tx.tx_type)) {
      return "Invalid transaction type";
    }
    if (!Number.isFinite(tx.amount) || tx.amount <= 0) {
      return "Amount must be greater than 0";
    }
    if (!isValidDateString(tx.date)) {
      return "Invalid date";
    }
    if (tx.shared_flag) {
      const participants = Object.keys(tx.shared_splits || {});
      if (!participants.length) {
        return "Shared entries require participants";
      }
    }
    return "";
  }

  function parseSharedInput(input, amount) {
    const clean = String(input || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!clean.length) {
      throw new Error("Add at least one participant for shared entry");
    }

    const out = {};
    let explicitTotal = 0;

    for (const item of clean) {
      const [nameRaw, amountRaw] = item.split(":");
      const name = String(nameRaw || "").trim();
      if (!name) {
        throw new Error("Participant name cannot be empty");
      }
      if (Object.prototype.hasOwnProperty.call(out, name)) {
        throw new Error(`Duplicate participant: ${name}`);
      }

      if (amountRaw === undefined || amountRaw.trim() === "") {
        out[name] = null;
      } else {
        const explicit = round2(Number(amountRaw));
        if (!Number.isFinite(explicit) || explicit <= 0) {
          throw new Error(`Invalid split amount for ${name}`);
        }
        explicitTotal += explicit;
        out[name] = explicit;
      }
    }

    if (explicitTotal - amount > 0.001) {
      throw new Error("Explicit shared split exceeds total amount");
    }

    return out;
  }

  function stringifySharedSplits(splits) {
    if (!splits || typeof splits !== "object") {
      return "";
    }
    return Object.entries(splits)
      .map(([name, value]) => (value === null || value === undefined ? name : `${name}:${value}`))
      .join(", ");
  }

  function allocateSharedSplits(tx) {
    const splits = tx.shared_splits;
    if (!splits || typeof splits !== "object") {
      return null;
    }

    const participants = Object.keys(splits);
    if (!participants.length) {
      return null;
    }

    const totalCents = Math.round(round2(tx.amount) * 100);

    let explicitCents = 0;
    const unset = [];

    for (const name of participants) {
      const value = splits[name];
      if (value === null || value === undefined || value === "") {
        unset.push(name);
      } else {
        const cents = Math.round(round2(Number(value)) * 100);
        explicitCents += cents;
      }
    }

    if (explicitCents > totalCents) {
      return null;
    }

    const out = {};

    for (const name of participants) {
      const value = splits[name];
      if (value !== null && value !== undefined && value !== "") {
        out[name] = round2(Number(value));
      }
    }

    const remainingCents = totalCents - explicitCents;
    if (!unset.length && remainingCents !== 0) {
      return null;
    }

    if (unset.length) {
      const each = Math.floor(remainingCents / unset.length);
      let remainder = remainingCents - each * unset.length;

      for (const name of unset) {
        const cents = each + (remainder > 0 ? 1 : 0);
        if (remainder > 0) {
          remainder -= 1;
        }
        out[name] = round2(cents / 100);
      }
    }

    return out;
  }

  function renderCategoryView() {
    const userData = getCurrentUserData();
    const settings = userData.settings;
    const txs = userData.transactions;

    const month = Number(els.catMonth.value) || new Date().getMonth() + 1;
    const year = Number(els.catYear.value) || new Date().getFullYear();
    const filterText = els.catFilter.value.trim().toLowerCase();

    const inMonth = txs.filter((tx) => {
      const [y, m] = String(tx.date || "").split("-").map((value) => Number(value));
      return y === year && m === month;
    });

    const totals = new Map();

    if (state.categoryMode === "expense") {
      const refunds = new Map();
      for (const tx of inMonth) {
        if (tx.tx_type === "expense") {
          const key = tx.category || "Uncategorized";
          totals.set(key, round2((totals.get(key) || 0) + tx.amount));
        }
        if (tx.tx_type === "income" && tx.sub_type === "refund") {
          const key = tx.category || "Uncategorized";
          refunds.set(key, round2((refunds.get(key) || 0) + tx.amount));
        }
      }

      for (const [key, value] of refunds.entries()) {
        totals.set(key, round2((totals.get(key) || 0) - value));
      }
    } else {
      for (const tx of inMonth) {
        if (tx.tx_type === "income") {
          const key = tx.category || "Uncategorized";
          totals.set(key, round2((totals.get(key) || 0) + tx.amount));
        }
      }
    }

    const categories = Array.from(
      new Set([
        ...settings.expense_categories,
        ...Object.keys(settings.category_budgets || {}),
        ...Array.from(totals.keys()),
      ])
    )
      .filter((category) => (!filterText ? true : category.toLowerCase().includes(filterText)))
      .sort((a, b) => a.localeCompare(b));

    const rows = categories.map((category) => {
      const total = round2(totals.get(category) || 0);
      const budget = round2(Number(settings.category_budgets[category] || 0));
      const variance = state.categoryMode === "expense" ? round2(budget - total) : round2(total - budget);
      const varianceClass = variance >= 0 ? "amount-positive" : "amount-negative";
      const encoded = encodeURIComponent(category);

      return `<tr>
        <td>${escapeHtml(category)}</td>
        <td>${escapeHtml(formatMoney(total))}</td>
        <td>
          <input data-budget-cat="${encoded}" type="number" step="0.01" value="${escapeHtml(String(budget))}" />
        </td>
        <td class="${varianceClass}">${escapeHtml(formatMoney(variance))}</td>
      </tr>`;
    });

    const totalValue = round2(categories.reduce((sum, category) => sum + (totals.get(category) || 0), 0));
    els.catTotal.textContent = `${state.categoryMode === "expense" ? "Net spent" : "Total income"}: ${formatMoney(
      totalValue
    )}`;

    els.categoryTable.innerHTML = rows.length
      ? `<table>
          <thead>
            <tr>
              <th>Category</th>
              <th>${state.categoryMode === "expense" ? "Net Spent" : "Income"}</th>
              <th>Budget</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>`
      : `<p class="muted">No categories match this filter.</p>`;
  }

  function refreshCategoryModeButtons() {
    els.catModeExpense.classList.toggle("primary", state.categoryMode === "expense");
    els.catModeExpense.classList.toggle("ghost", state.categoryMode !== "expense");
    els.catModeIncome.classList.toggle("primary", state.categoryMode === "income");
    els.catModeIncome.classList.toggle("ghost", state.categoryMode !== "income");
  }

  function renderSharedView() {
    const participantFilter = els.sharedPersonFilter.value.trim().toLowerCase();
    const categoryFilter = els.sharedCategoryFilter.value.trim().toLowerCase();

    state.sharedDetailMap = new Map();
    state.sharedNetMap = new Map();

    const txs = getCurrentUserData().transactions.filter((tx) => tx.shared_flag && tx.shared_splits);

    for (const tx of txs) {
      if (categoryFilter && !String(tx.category || "").toLowerCase().includes(categoryFilter)) {
        continue;
      }

      const allocation = allocateSharedSplits(tx);
      if (!allocation) {
        continue;
      }

      let sign = tx.tx_type === "expense" ? 1 : tx.tx_type === "income" ? -1 : 0;
      if (normalizeDeviceType(tx.device) === "DEBT_BORROWED") {
        sign *= -1;
      }

      const breakdown = Object.entries(allocation)
        .map(([name, amount]) => `${name}:${amount}`)
        .join(", ");

      for (const [person, share] of Object.entries(allocation)) {
        if (participantFilter && !person.toLowerCase().includes(participantFilter)) {
          continue;
        }

        const signedAmount = round2(sign * share);
        const currentNet = state.sharedNetMap.get(person) || 0;
        state.sharedNetMap.set(person, round2(currentNet + signedAmount));

        const details = state.sharedDetailMap.get(person) || [];
        details.push({
          date: tx.date,
          description: tx.description,
          signedAmount,
          totalAmount: tx.amount,
          category: tx.category,
          breakdown,
          notes: tx.shared_notes || "",
        });
        state.sharedDetailMap.set(person, details);
      }
    }

    els.sharedCaption.textContent = `Filters: participant="${participantFilter || "all"}", category="${
      categoryFilter || "all"
    }"`;

    if (state.sharedSelectedPerson) {
      renderSharedPersonDetail(state.sharedSelectedPerson);
      return;
    }

    const summaryRows = [...state.sharedNetMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([person, amount]) => {
        const cls = amount >= 0 ? "amount-positive" : "amount-negative";
        const label = amount >= 0 ? "You should receive" : "You should pay";
        return `<tr>
          <td>${escapeHtml(person)}</td>
          <td class="${cls}">${escapeHtml(formatMoney(amount))}</td>
          <td>${escapeHtml(label)}</td>
          <td><button class="btn ghost" data-person="${escapeHtml(person)}">View</button></td>
        </tr>`;
      });

    els.sharedSummaryView.classList.remove("hidden");
    els.sharedPersonView.classList.add("hidden");

    els.sharedSummaryTable.innerHTML = summaryRows.length
      ? `<table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Net</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>${summaryRows.join("")}</tbody>
        </table>`
      : `<p class="muted">No shared transactions match current filters.</p>`;
  }

  function renderSharedPersonDetail(person) {
    const details = state.sharedDetailMap.get(person) || [];
    const net = round2(state.sharedNetMap.get(person) || 0);

    els.sharedSummaryView.classList.add("hidden");
    els.sharedPersonView.classList.remove("hidden");
    els.sharedPersonTitle.textContent = person;
    els.sharedPersonNet.textContent = `Net: ${formatMoney(net)} (${net >= 0 ? "receive" : "pay"})`;

    const rows = details
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((item) => {
        const cls = item.signedAmount >= 0 ? "amount-positive" : "amount-negative";
        return `<tr>
          <td>${escapeHtml(item.date || "")}</td>
          <td>${escapeHtml(item.description || "")}</td>
          <td class="${cls}">${escapeHtml(formatMoney(item.signedAmount))}</td>
          <td>${escapeHtml(formatMoney(item.totalAmount || 0))}</td>
          <td>${escapeHtml(item.category || "")}</td>
          <td>${escapeHtml(item.breakdown || "")}</td>
          <td>${escapeHtml(item.notes || "")}</td>
        </tr>`;
      });

    els.sharedPersonTable.innerHTML = rows.length
      ? `<table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Signed Amount</th>
              <th>Total Tx Amount</th>
              <th>Category</th>
              <th>Breakdown</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>`
      : `<p class="muted">No detail entries for this participant.</p>`;
  }

  function renderNetWorthView() {
    const settings = getCurrentSettings();
    const txs = getCurrentUserData().transactions;

    const balances = computeBalances(txs, settings);
    const savings = computeSavings(txs, settings);
    const creditDebt = computeCreditCardDebt(txs);
    const borrowedDebt = computeBorrowedDebt(txs);
    const totalDebt = round2(creditDebt + borrowedDebt);

    const netWorth = round2(balances.liquid + savings.total - totalDebt);

    const cards = [
      ["Liquid Balance", formatMoney(balances.liquid)],
      ["Total Savings", formatMoney(savings.total)],
      ["Total Debt", formatMoney(totalDebt)],
      ["Net Worth", formatMoney(netWorth)],
    ];

    els.networthMetrics.innerHTML = cards
      .map(
        ([label, value]) =>
          `<article class="metric-card"><p class="metric-label">${escapeHtml(label)}</p><p class="metric-value">${escapeHtml(
            value
          )}</p></article>`
      )
      .join("");

    els.savingsBreakdown.innerHTML = `<table>
      <thead>
        <tr><th>Bucket</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Savings</td><td>${escapeHtml(formatMoney(savings.buckets.savings))}</td></tr>
        <tr><td>Savings FD</td><td>${escapeHtml(formatMoney(savings.buckets.fd))}</td></tr>
        <tr><td>Savings RD</td><td>${escapeHtml(formatMoney(savings.buckets.rd))}</td></tr>
        <tr><td>Savings Gold</td><td>${escapeHtml(formatMoney(savings.buckets.gold))}</td></tr>
      </tbody>
    </table>`;

    els.debtBreakdown.innerHTML = `<table>
      <thead>
        <tr><th>Debt Type</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Credit Card Debt</td><td>${escapeHtml(formatMoney(creditDebt))}</td></tr>
        <tr><td>Borrowed Debt</td><td>${escapeHtml(formatMoney(borrowedDebt))}</td></tr>
      </tbody>
    </table>`;
  }

  function hydrateSettingsFields() {
    const settings = getCurrentSettings();

    els.initialAccount.value = String(round2(settings.initial_balances.account || 0));
    els.initialCash.value = String(round2(settings.initial_balances.cash || 0));
    els.currencyInput.value = settings.currency || "INR";

    els.devicesText.value = (settings.expense_devices || []).join("\n");
    els.sourcesText.value = (settings.income_sources || []).join("\n");
    els.categoriesText.value = (settings.expense_categories || []).join("\n");
    setCsvImportStatus("");
  }

  function saveBalances() {
    const settings = getCurrentSettings();

    settings.initial_balances.account = round2(Number(els.initialAccount.value) || 0);
    settings.initial_balances.cash = round2(Number(els.initialCash.value) || 0);

    const currency = els.currencyInput.value.trim().toUpperCase();
    settings.currency = currency || "INR";

    saveStore();
    showToast("Balances saved");
    renderAll();
  }

  function hydrateSavingsModal() {
    const savings = getCurrentSettings().initial_savings;
    els.savingMain.value = String(round2(savings.savings || 0));
    els.savingFd.value = String(round2(savings.fd || 0));
    els.savingRd.value = String(round2(savings.rd || 0));
    els.savingGold.value = String(round2(savings.gold || 0));
  }

  function saveSavings(event) {
    event.preventDefault();
    const savings = getCurrentSettings().initial_savings;
    savings.savings = round2(Number(els.savingMain.value) || 0);
    savings.fd = round2(Number(els.savingFd.value) || 0);
    savings.rd = round2(Number(els.savingRd.value) || 0);
    savings.gold = round2(Number(els.savingGold.value) || 0);

    saveStore();
    closeModal("savings-modal");
    showToast("Initial savings saved");
    renderNetWorthView();
  }

  function saveInstruments() {
    const settings = getCurrentSettings();

    const devices = parseMultilineList(els.devicesText.value);
    const sources = parseMultilineList(els.sourcesText.value);

    if (!devices.length) {
      showToast("Expense devices cannot be empty");
      return;
    }
    if (!sources.length) {
      showToast("Income sources cannot be empty");
      return;
    }

    settings.expense_devices = devices;
    settings.income_sources = sources;

    saveStore();
    showToast("Devices and sources saved");
    refreshDatalists();
  }

  async function importCsvFile() {
    const file = els.csvImportInput.files && els.csvImportInput.files[0];
    if (!file) {
      showToast("Pick a CSV file first");
      setCsvImportStatus("No file selected.");
      return;
    }

    const mode = els.csvImportMode.value === "replace" ? "replace" : "append";
    if (mode === "replace") {
      const confirmed = window.confirm(
        "Replace mode will delete current transactions for this user and import from CSV. Continue?"
      );
      if (!confirmed) {
        return;
      }
    }

    let csvText = "";
    try {
      csvText = await readFileAsText(file);
    } catch (_error) {
      showToast("Unable to read CSV file");
      setCsvImportStatus("Failed to read the selected file.");
      return;
    }

    let result;
    try {
      result = importTransactionsFromCsvText(csvText, mode);
    } catch (error) {
      showToast("CSV import failed");
      setCsvImportStatus(String(error.message || "Invalid CSV format."));
      return;
    }

    const statusLine = `Imported ${result.imported} row(s), skipped ${result.skipped}, rejected ${result.rejected}.`;
    const detailLine = result.errors && result.errors.length ? ` Examples: ${result.errors.join(" | ")}` : "";
    setCsvImportStatus(`${statusLine}${detailLine}`);

    if (result.imported > 0) {
      showToast(`Imported ${result.imported} transaction(s)`);
      renderAll();
    } else {
      showToast("No transactions imported");
    }

    els.csvImportInput.value = "";
  }

  function importSettings() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const text = await readFileAsText(file);
        const settingsData = JSON.parse(text);
        
        // Validate settings structure
        if (!settingsData.settings || typeof settingsData.settings !== 'object') {
          showToast("Invalid settings file format");
          return;
        }

        // Confirm import
        const confirmed = window.confirm(
          "This will replace all your current settings (categories, devices, sources, balances, etc.) but keep your transactions. Continue?"
        );
        if (!confirmed) return;

        // Import settings
        const userData = getCurrentUserData();
        userData.settings = { ...userData.settings, ...settingsData.settings };
        
        // Ensure required fields exist
        userData.settings.version ||= 1;
        userData.settings.currency ||= "INR";
        userData.settings.initial_balances ||= { account: 0, cash: 0 };
        userData.settings.initial_savings ||= { savings: 0, fd: 0, rd: 0, gold: 0 };
        userData.settings.category_budgets ||= {};

        saveStore();
        showToast("Settings imported successfully");
        renderAll();
      } catch (error) {
        showToast("Failed to import settings: " + error.message);
      }
    };
    input.click();
  }

  function exportSettings() {
    try {
      const userData = getCurrentUserData();
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        user: state.store.currentUser,
        settings: userData.settings
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-tracker-settings-${state.store.currentUser}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast("Settings exported successfully");
    } catch (error) {
      showToast("Failed to export settings: " + error.message);
    }
  }

  function exportTransactions() {
    try {
      const userData = getCurrentUserData();
      const transactions = userData.transactions || [];
      
      // Ensure currency is set to INR for export
      const currency = "INR";
      
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        user: state.store.currentUser,
        currency: currency,
        transactions: transactions.map(tx => ({
          ...tx,
          amount: tx.amount, // Keep original amount
          currency: currency // Add currency field
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-tracker-transactions-${state.store.currentUser}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast(`Exported ${transactions.length} transactions in ${currency}`);
    } catch (error) {
      showToast("Failed to export transactions: " + error.message);
    }
  }

  function setCsvImportStatus(message) {
    els.csvImportStatus.textContent = message || "";
  }

  function importTransactionsFromCsvText(csvText, mode) {
    const delimiter = detectCsvDelimiter(csvText);
    const rows = parseCsv(csvText, delimiter);
    if (rows.length < 2) {
      throw new Error("CSV must include a header row and at least one data row.");
    }

    const headerMap = buildCsvHeaderMap(rows[0]);
    const hasTypeColumn = hasAnyHeader(headerMap, [
      "tx_type",
      "type",
      "transaction_type",
      "txn_type",
      "entry_type",
      "kind",
    ]);
    const hasAmountColumn = hasAnyHeader(headerMap, ["amount", "value", "transaction_amount", "amt"]);
    const hasDebitCredit = hasAnyHeader(headerMap, ["debit", "withdrawal", "debit_amount"]) ||
      hasAnyHeader(headerMap, ["credit", "deposit", "credit_amount"]);

    if (!hasTypeColumn && !hasDebitCredit) {
      throw new Error("Missing tx type info. Add tx_type/type or debit/credit columns.");
    }
    if (!hasAmountColumn && !hasDebitCredit) {
      throw new Error("Missing amount. Add amount/value or debit/credit columns.");
    }
    if (!hasAnyHeader(headerMap, ["date", "tx_date"])) {
      if (!hasAnyHeader(headerMap, ["transaction_date", "txn_date", "posted_date", "value_date"])) {
        throw new Error("Missing required column: date.");
      }
    }

    const userData = getCurrentUserData();
    const usedIds = new Set();

    if (mode === "append") {
      for (const tx of userData.transactions) {
        usedIds.add(tx.id);
      }
    }

    const importedTransactions = [];
    let skipped = 0;
    let rejected = 0;
    const errors = [];

    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      if (isCsvRowBlank(row)) {
        skipped += 1;
        continue;
      }

      let tx;
      try {
        tx = parseCsvTransactionRow(row, headerMap);
      } catch (error) {
        rejected += 1;
        if (errors.length < 5) {
          errors.push(`Row ${index + 1}: ${String(error.message || "Parse failed")}`);
        }
        continue;
      }

      if (usedIds.has(tx.id)) {
        tx.id = createId();
      }
      usedIds.add(tx.id);

      const validationError = validateTransaction(tx);
      if (validationError) {
        rejected += 1;
        if (errors.length < 5) {
          errors.push(`Row ${index + 1}: ${validationError}`);
        }
        continue;
      }

      importedTransactions.push(tx);
    }

    if (mode === "replace" && importedTransactions.length === 0) {
      throw new Error("No valid transactions found. Existing data was not replaced.");
    }

    if (mode === "replace") {
      userData.transactions = importedTransactions;
    } else {
      userData.transactions.push(...importedTransactions);
    }

    saveStore();
    return {
      imported: importedTransactions.length,
      skipped,
      rejected,
      errors,
    };
  }

  function parseCsvTransactionRow(row, headerMap) {
    const txFields = deriveCsvTypeAndAmount(row, headerMap);
    if (!txFields.txType) {
      throw new Error("Unable to determine tx_type");
    }

    const txType = txFields.txType;
    let amount = txFields.amount;
    const date = normalizeCsvDate(
      getCsvValue(row, headerMap, ["date", "tx_date", "transaction_date", "txn_date", "posted_date", "value_date"])
    );
    if (!isValidDateString(date)) {
      throw new Error("Invalid date format");
    }

    const sharedRaw = getCsvValue(row, headerMap, ["shared_splits", "shared_split", "participants"]);

    let sharedSplits = {};
    if (sharedRaw) {
      sharedSplits = parseImportedSharedSplits(sharedRaw, amount);
    }

    if ((!Number.isFinite(amount) || amount <= 0) && Object.keys(sharedSplits).length) {
      const inferredAmount = inferAmountFromSharedSplits(sharedSplits);
      if (Number.isFinite(inferredAmount) && inferredAmount > 0) {
        amount = inferredAmount;
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const sharedFlag = parseBooleanValue(
      getCsvValue(row, headerMap, ["shared_flag", "is_shared"]),
      Boolean(sharedRaw)
    );

    const tx = createTransaction({
      id: getCsvValue(row, headerMap, ["id", "transaction_id", "txn_id"]) || createId(),
      timestamp: normalizeCsvTimestamp(getCsvValue(row, headerMap, ["timestamp", "created_at"])),
      tx_type: txType,
      sub_type: getCsvValue(row, headerMap, ["sub_type", "subtype"]),
      amount,
      date,
      description: getCsvValue(row, headerMap, ["description", "note", "notes", "memo", "narration", "details"]),
      category: getCsvValue(row, headerMap, ["category", "label", "tag"]),
      device: getCsvValue(row, headerMap, ["device", "source", "payment_method", "mode", "account"]),
      effects_balance: parseBooleanValue(
        getCsvValue(row, headerMap, ["effects_balance", "affects_balance"]),
        true
      ),
      linked_tx_id: getCsvValue(row, headerMap, ["linked_tx_id", "linked_id", "linked_transaction_id"]),
      shared_flag: sharedFlag,
      shared_splits: sharedFlag ? sharedSplits : {},
      shared_notes: getCsvValue(row, headerMap, ["shared_notes", "shared_note"]),
    });

    return tx;
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsText(file);
    });
  }

  function parseCsv(text, delimiter = ",") {
    const source = stripUtf8Bom(String(text || ""));
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];

      if (inQuotes) {
        if (char === "\"") {
          if (source[i + 1] === "\"") {
            cell += "\"";
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
        continue;
      }

      if (char === "\"") {
        inQuotes = true;
        continue;
      }

      if (char === delimiter) {
        row.push(cell);
        cell = "";
        continue;
      }

      if (char === "\n" || char === "\r") {
        if (char === "\r" && source[i + 1] === "\n") {
          i += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    row.push(cell);
    rows.push(row);

    return rows.filter((currentRow, index) => {
      if (index === 0) {
        return true;
      }
      return !isCsvRowBlank(currentRow);
    });
  }

  function detectCsvDelimiter(text) {
    const source = stripUtf8Bom(String(text || ""));
    const firstLine = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) || "";

    if (!firstLine) {
      return ",";
    }

    const candidates = [",", ";", "\t", "|"];
    let best = ",";
    let bestCount = -1;

    for (const candidate of candidates) {
      const count = countDelimiterOutsideQuotes(firstLine, candidate);
      if (count > bestCount) {
        best = candidate;
        bestCount = count;
      }
    }

    return bestCount > 0 ? best : ",";
  }

  function countDelimiterOutsideQuotes(line, delimiter) {
    let inQuotes = false;
    let count = 0;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && char === delimiter) {
        count += 1;
      }
    }

    return count;
  }

  function stripUtf8Bom(value) {
    if (!value) {
      return "";
    }
    return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
  }

  function buildCsvHeaderMap(headerRow) {
    const map = new Map();
    for (let i = 0; i < headerRow.length; i += 1) {
      const key = normalizeCsvHeader(headerRow[i]);
      if (!key) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, i);
      }
    }
    return map;
  }

  function normalizeCsvHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function hasAnyHeader(headerMap, names) {
    for (const name of names) {
      if (headerMap.has(normalizeCsvHeader(name))) {
        return true;
      }
    }
    return false;
  }

  function getCsvValue(row, headerMap, names) {
    for (const name of names) {
      const index = headerMap.get(normalizeCsvHeader(name));
      if (index === undefined) {
        continue;
      }
      return String(row[index] ?? "").trim();
    }
    return "";
  }

  function parseCsvNumber(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return Number.NaN;
    }

    const isParenNegative = raw.startsWith("(") && raw.endsWith(")");
    let cleaned = raw
      .replaceAll(",", "")
      .replaceAll("$", "")
      .replaceAll("€", "")
      .replaceAll("£", "")
      .replaceAll("(", "")
      .replaceAll(")", "")
      .trim();

    if (!cleaned) {
      return Number.NaN;
    }

    if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(cleaned)) {
      cleaned = cleaned.replaceAll(".", "").replace(",", ".");
    } else if (/^-?\d+,\d+$/.test(cleaned)) {
      cleaned = cleaned.replace(",", ".");
    }

    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) {
      return Number.NaN;
    }
    return isParenNegative ? -parsed : parsed;
  }

  function parseBooleanValue(value, fallback) {
    const clean = String(value || "").trim().toLowerCase();
    if (!clean) {
      return fallback;
    }
    if (clean === "1" || clean === "true" || clean === "yes" || clean === "y") {
      return true;
    }
    if (clean === "0" || clean === "false" || clean === "no" || clean === "n") {
      return false;
    }
    return fallback;
  }

  function normalizeCsvDate(value) {
    const clean = String(value || "").trim();
    if (!clean) {
      return "";
    }

    if (isValidDateString(clean)) {
      return clean;
    }

    if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
      const normalized = clean.replaceAll("/", "-");
      if (isValidDateString(normalized)) {
        return normalized;
      }
    }

    if (/^\d{8}$/.test(clean)) {
      const asYmd = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
      if (isValidDateString(asYmd)) {
        return asYmd;
      }
    }

    const dmyOrMdy = clean.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (dmyOrMdy) {
      const first = Number(dmyOrMdy[1]);
      const second = Number(dmyOrMdy[2]);
      let year = Number(dmyOrMdy[3]);
      if (year < 100) {
        year += 2000;
      }

      const candidates = [];
      candidates.push(formatDateYmd(year, first, second)); // MM/DD/YYYY
      candidates.push(formatDateYmd(year, second, first)); // DD/MM/YYYY

      const uniqueCandidates = [...new Set(candidates)];
      for (const candidate of uniqueCandidates) {
        if (isValidDateString(candidate)) {
          return candidate;
        }
      }
    }

    const parsed = new Date(clean);
    if (Number.isNaN(parsed.getTime())) {
      return clean;
    }
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
      parsed.getDate()
    ).padStart(2, "0")}`;
  }

  function normalizeCsvTimestamp(value) {
    const clean = String(value || "").trim();
    if (!clean) {
      return new Date().toISOString();
    }
    const parsed = new Date(clean);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }
    return parsed.toISOString();
  }

  function formatDateYmd(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function normalizeImportedTxType(value) {
    const clean = String(value || "")
      .trim()
      .toLowerCase();

    if (!clean) {
      return "";
    }
    if (
      clean === "expense" ||
      clean === "debit" ||
      clean === "withdrawal" ||
      clean === "withdraw" ||
      clean === "dr" ||
      clean === "outflow" ||
      clean === "spent" ||
      clean === "purchase" ||
      clean === "payment"
    ) {
      return "expense";
    }
    if (
      clean === "income" ||
      clean === "credit" ||
      clean === "deposit" ||
      clean === "cr" ||
      clean === "inflow" ||
      clean === "salary" ||
      clean === "refund"
    ) {
      return "income";
    }
    if (clean === "transfer" || clean === "xfer") {
      return "transfer";
    }

    return clean;
  }

  function deriveCsvTypeAndAmount(row, headerMap) {
    const typeRaw = getCsvValue(row, headerMap, [
      "tx_type",
      "type",
      "transaction_type",
      "txn_type",
      "entry_type",
      "kind",
    ]);
    const amountRaw = getCsvValue(row, headerMap, ["amount", "value", "transaction_amount", "amt"]);
    const debitRaw = getCsvValue(row, headerMap, ["debit", "withdrawal", "debit_amount"]);
    const creditRaw = getCsvValue(row, headerMap, ["credit", "deposit", "credit_amount"]);

    const normalizedType = normalizeImportedTxType(typeRaw);
    const amount = parseCsvNumber(amountRaw);
    const debit = parseCsvNumber(debitRaw);
    const credit = parseCsvNumber(creditRaw);

    let txType = normalizedType;
    let resolvedAmount = amount;

    if (!txType) {
      if (Number.isFinite(debit) && debit > 0 && (!Number.isFinite(credit) || credit <= 0)) {
        txType = "expense";
        resolvedAmount = debit;
      } else if (Number.isFinite(credit) && credit > 0 && (!Number.isFinite(debit) || debit <= 0)) {
        txType = "income";
        resolvedAmount = credit;
      } else if (Number.isFinite(amount) && amount !== 0) {
        txType = amount < 0 ? "expense" : "income";
      }
    }

    if (!Number.isFinite(resolvedAmount) || resolvedAmount === 0) {
      if (txType === "expense" && Number.isFinite(debit) && debit !== 0) {
        resolvedAmount = debit;
      } else if (txType === "income" && Number.isFinite(credit) && credit !== 0) {
        resolvedAmount = credit;
      }
    }

    if (!Number.isFinite(resolvedAmount)) {
      throw new Error("Amount missing or invalid");
    }

    return {
      txType,
      amount: round2(Math.abs(resolvedAmount)),
    };
  }

  function parseImportedSharedSplits(raw, amount) {
    const clean = String(raw || "").trim();
    if (!clean) {
      return {};
    }

    if (clean.startsWith("{") || clean.startsWith("[")) {
      const parsed = JSON.parse(clean);
      return normalizeSharedSplitsFromJson(parsed, amount);
    }

    const normalized = clean.replaceAll("|", ",").replaceAll(";", ",");
    if (Number.isFinite(amount) && amount > 0) {
      return parseSharedInput(normalized, amount);
    }
    return parseSharedInputNoTotal(normalized);
  }

  function parseSharedInputNoTotal(input) {
    const items = String(input || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!items.length) {
      throw new Error("Add at least one participant for shared entry");
    }

    const out = {};
    for (const item of items) {
      const [nameRaw, amountRaw] = item.split(":");
      const name = String(nameRaw || "").trim();
      if (!name) {
        throw new Error("Participant name cannot be empty");
      }
      if (Object.prototype.hasOwnProperty.call(out, name)) {
        throw new Error(`Duplicate participant: ${name}`);
      }

      if (amountRaw === undefined || amountRaw.trim() === "") {
        out[name] = null;
      } else {
        const explicit = round2(Number(amountRaw));
        if (!Number.isFinite(explicit) || explicit <= 0) {
          throw new Error(`Invalid split amount for ${name}`);
        }
        out[name] = explicit;
      }
    }

    return out;
  }

  function inferAmountFromSharedSplits(splits) {
    let total = 0;
    let hasAtLeastOne = false;

    for (const value of Object.values(splits || {})) {
      if (value === null || value === undefined || value === "") {
        return Number.NaN;
      }
      const amount = round2(Number(value));
      if (!Number.isFinite(amount) || amount <= 0) {
        return Number.NaN;
      }
      hasAtLeastOne = true;
      total += amount;
    }

    if (!hasAtLeastOne) {
      return Number.NaN;
    }

    return round2(total);
  }

  function normalizeSharedSplitsFromJson(value, amount) {
    const out = {};
    let explicitTotal = 0;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          const name = item.trim();
          if (!name) {
            continue;
          }
          out[name] = null;
          continue;
        }
        if (item && typeof item === "object") {
          const name = String(item.name || "").trim();
          if (!name) {
            continue;
          }
          if (item.amount === null || item.amount === undefined || item.amount === "") {
            out[name] = null;
          } else {
            const splitAmount = round2(Number(item.amount));
            if (!Number.isFinite(splitAmount) || splitAmount <= 0) {
              throw new Error("Invalid shared split amount in JSON");
            }
            out[name] = splitAmount;
            explicitTotal += splitAmount;
          }
        }
      }
    } else if (value && typeof value === "object") {
      for (const [rawName, rawAmount] of Object.entries(value)) {
        const name = String(rawName || "").trim();
        if (!name) {
          continue;
        }
        if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
          out[name] = null;
          continue;
        }
        const splitAmount = round2(Number(rawAmount));
        if (!Number.isFinite(splitAmount) || splitAmount <= 0) {
          throw new Error("Invalid shared split amount in JSON");
        }
        out[name] = splitAmount;
        explicitTotal += splitAmount;
      }
    } else {
      throw new Error("Unsupported JSON format for shared_splits");
    }

    if (!Object.keys(out).length) {
      throw new Error("Shared JSON splits did not contain participants");
    }

    if (Number.isFinite(amount) && amount > 0 && explicitTotal - amount > 0.001) {
      throw new Error("Shared split total exceeds transaction amount");
    }

    return out;
  }

  function isCsvRowBlank(row) {
    for (const item of row) {
      if (String(item || "").trim()) {
        return false;
      }
    }
    return true;
  }

  function saveCategoriesFromTextarea() {
    const settings = getCurrentSettings();
    const newCategories = parseMultilineList(els.categoriesText.value);

    if (!newCategories.length) {
      showToast("At least one category is required");
      return;
    }

    const oldCategories = new Set(settings.expense_categories);
    const newSet = new Set(newCategories);
    const fallback = newSet.has("Others") ? "Others" : newCategories[0];

    const removed = [];
    for (const oldCategory of oldCategories) {
      if (!newSet.has(oldCategory)) {
        removed.push(oldCategory);
      }
    }

    settings.expense_categories = newCategories;

    for (const removedCategory of removed) {
      delete settings.category_budgets[removedCategory];
      for (const tx of getCurrentUserData().transactions) {
        if (tx.category === removedCategory) {
          tx.category = fallback;
        }
      }
    }

    saveStore();
    showToast("Categories saved");
    renderAll();
  }

  function addCategory() {
    const name = els.addCategoryInput.value.trim();
    if (!name) {
      showToast("Enter a category name");
      return;
    }

    const settings = getCurrentSettings();
    if (settings.expense_categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
      showToast("Category already exists");
      return;
    }

    settings.expense_categories.push(name);
    els.addCategoryInput.value = "";
    saveStore();
    showToast("Category added");
    renderAll();
  }

  function renameCategory() {
    const oldName = els.renameOldInput.value.trim();
    const newName = els.renameNewInput.value.trim();

    if (!oldName || !newName) {
      showToast("Rename from/to values are required");
      return;
    }

    const settings = getCurrentSettings();
    const index = settings.expense_categories.findIndex((item) => item.toLowerCase() === oldName.toLowerCase());
    if (index < 0) {
      showToast("Category to rename not found");
      return;
    }

    const existingTarget = settings.expense_categories.find((item) => item.toLowerCase() === newName.toLowerCase());

    const oldExact = settings.expense_categories[index];
    if (existingTarget) {
      settings.expense_categories = settings.expense_categories.filter((item) => item !== oldExact);
    } else {
      settings.expense_categories[index] = newName;
    }

    const oldBudget = Number(settings.category_budgets[oldExact] || 0);
    const newBudget = Number(settings.category_budgets[newName] || 0);
    settings.category_budgets[newName] = round2(oldBudget + newBudget);
    delete settings.category_budgets[oldExact];

    for (const tx of getCurrentUserData().transactions) {
      if (tx.category === oldExact) {
        tx.category = newName;
      }
    }

    els.renameOldInput.value = "";
    els.renameNewInput.value = "";

    saveStore();
    showToast("Category renamed");
    renderAll();
  }

  function removeCategory() {
    const name = els.removeCategoryInput.value.trim();
    if (!name) {
      showToast("Enter category to remove");
      return;
    }

    const settings = getCurrentSettings();
    if (settings.expense_categories.length <= 1) {
      showToast("At least one category must remain");
      return;
    }

    const index = settings.expense_categories.findIndex((item) => item.toLowerCase() === name.toLowerCase());
    if (index < 0) {
      showToast("Category not found");
      return;
    }

    const exact = settings.expense_categories[index];
    settings.expense_categories.splice(index, 1);
    delete settings.category_budgets[exact];

    const fallback = settings.expense_categories.includes("Others") ? "Others" : settings.expense_categories[0];
    for (const tx of getCurrentUserData().transactions) {
      if (tx.category === exact) {
        tx.category = fallback;
      }
    }

    els.removeCategoryInput.value = "";

    saveStore();
    showToast("Category removed");
    renderAll();
  }

  function resetExpenseForm() {
    els.expenseForm.reset();
    els.expenseDate.value = todayISO();
    els.expenseSharedBox.classList.add("hidden");
  }

  function resetIncomeForm() {
    els.incomeForm.reset();
    els.incomeDate.value = todayISO();
    els.incomeSharedBox.classList.add("hidden");
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      return;
    }
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function formatMoney(amount) {
    const currency = getCurrentSettingsSafeCurrency();
    const roundedAmount = round2(amount);
    
    // For INR, manually prepend the rupee symbol to ensure it displays correctly
    if (currency === "INR") {
      return `₹${roundedAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    
    // For other currencies, use Intl.NumberFormat
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(roundedAmount);
    } catch (_error) {
      return `${currency} ${roundedAmount.toFixed(2)}`;
    }
  }

  function getCurrentSettingsSafeCurrency() {
    try {
      return getCurrentSettings().currency || "INR";
    } catch (_error) {
      return "INR";
    }
  }

  function computeBalances(transactions, settings) {
    let account = round2(Number(settings.initial_balances.account || 0));
    let cash = round2(Number(settings.initial_balances.cash || 0));

    for (const tx of transactions) {
      if (!tx.effects_balance) {
        continue;
      }

      let sign = 0;
      if (tx.tx_type === "income") {
        sign = 1;
      } else if (tx.tx_type === "expense") {
        sign = -1;
      }

      if (!sign) {
        continue;
      }

      const normalized = normalizeDeviceType(tx.device);
      if (normalized === "CASH") {
        cash = round2(cash + sign * tx.amount);
      } else {
        account = round2(account + sign * tx.amount);
      }
    }

    return {
      account,
      cash,
      liquid: round2(account + cash),
    };
  }

  function computeSavings(transactions, settings) {
    const buckets = {
      savings: round2(Number(settings.initial_savings.savings || 0)),
      fd: round2(Number(settings.initial_savings.fd || 0)),
      rd: round2(Number(settings.initial_savings.rd || 0)),
      gold: round2(Number(settings.initial_savings.gold || 0)),
    };

    for (const tx of transactions) {
      const category = String(tx.category || "").toLowerCase();

      if (tx.tx_type === "expense") {
        if (category === "savings") {
          buckets.savings = round2(buckets.savings + tx.amount);
        }
        if (category === "savings fd") {
          buckets.fd = round2(buckets.fd + tx.amount);
        }
        if (category === "savings rd") {
          buckets.rd = round2(buckets.rd + tx.amount);
        }
        if (category === "savings gold") {
          buckets.gold = round2(buckets.gold + tx.amount);
        }
      }

      if (
        tx.tx_type === "income" &&
        (tx.sub_type === "savings_withdraw" ||
          normalizeDeviceType(tx.device) === "SAVINGS_WITHDRAW" ||
          category === "taken from savings")
      ) {
        buckets.savings = round2(buckets.savings - tx.amount);
      }
    }

    return {
      buckets,
      total: round2(buckets.savings + buckets.fd + buckets.rd + buckets.gold),
    };
  }

  function computeCreditCardDebt(transactions) {
    const cycleOutstanding = new Map();
    const paymentAmounts = [];

    const sorted = [...transactions].sort(compareTxAsc);

    for (const tx of sorted) {
      if (tx.tx_type !== "expense") {
        continue;
      }

      if (isCreditCardPurchaseTx(tx)) {
        const cycle = getBillingCycleKey(tx.date);
        const current = cycleOutstanding.get(cycle) || 0;
        cycleOutstanding.set(cycle, round2(current + tx.amount));
      }

      if (isCreditCardPaymentTx(tx)) {
        paymentAmounts.push(round2(tx.amount));
      }
    }

    const cycles = [...cycleOutstanding.keys()].sort();

    for (const payment of paymentAmounts) {
      let remaining = payment;
      for (const cycle of cycles) {
        const outstanding = cycleOutstanding.get(cycle) || 0;
        if (outstanding <= 0) {
          continue;
        }
        const applied = Math.min(outstanding, remaining);
        cycleOutstanding.set(cycle, round2(outstanding - applied));
        remaining = round2(remaining - applied);
        if (remaining <= 0) {
          break;
        }
      }
    }

    let total = 0;
    for (const value of cycleOutstanding.values()) {
      total += Math.max(0, value);
    }
    return round2(total);
  }

  function computeBorrowedDebt(transactions) {
    let borrowed = 0;
    let cleared = 0;

    for (const tx of transactions) {
      if (tx.tx_type !== "expense") {
        continue;
      }

      const device = normalizeDeviceType(tx.device);
      const category = String(tx.category || "").toLowerCase();

      if (device === "DEBT_BORROWED") {
        borrowed = round2(borrowed + tx.amount);
      }

      if (category === "debt cleared") {
        cleared = round2(cleared + tx.amount);
      }
    }

    return round2(Math.max(0, borrowed - cleared));
  }

  function isCreditCardPurchase(device, description) {
    const normalizedDevice = normalizeDeviceType(device);
    if (normalizedDevice === "CREDIT_CARD" || normalizedDevice === "CREDIT_CARD_UPI") {
      return true;
    }
    return String(description || "").toLowerCase().includes("credit card");
  }

  function isCreditCardPurchaseTx(tx) {
    if (isCreditCardPaymentCategory(tx.category)) {
      return false;
    }
    if (tx.meta && tx.meta.cc_purchase) {
      return true;
    }
    const normalizedDevice = normalizeDeviceType(tx.device);
    return normalizedDevice === "CREDIT_CARD" || normalizedDevice === "CREDIT_CARD_UPI";
  }

  function isCreditCardPaymentCategory(category) {
    const clean = String(category || "").trim().toLowerCase();
    return clean.includes("credit card bill") || clean.includes("credit card upi bill");
  }

  function isCreditCardPaymentTx(tx) {
    if (tx.meta && tx.meta.cc_payment) {
      return true;
    }
    return isCreditCardPaymentCategory(tx.category);
  }

  function getBillingCycleKey(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return String(dateString || "").slice(0, 7);
    }

    let year = date.getFullYear();
    let month = date.getMonth();

    if (date.getDate() < 19) {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }

    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  function normalizeDeviceType(value) {
    const clean = String(value || "").trim().toUpperCase();

    if (!clean) {
      return "OTHER";
    }

    if (clean.includes("DEBT_BORROWED") || clean.includes("BORROW")) {
      return "DEBT_BORROWED";
    }
    if (clean.includes("SAVINGS_WITHDRAW") || clean.includes("TAKEN FROM SAVINGS")) {
      return "SAVINGS_WITHDRAW";
    }
    if (clean.includes("CREDIT_CARD_UPI") || (clean.includes("CREDIT") && clean.includes("UPI"))) {
      return "CREDIT_CARD_UPI";
    }
    if (clean.includes("CREDIT")) {
      return "CREDIT_CARD";
    }
    if (clean.includes("CASH")) {
      return "CASH";
    }
    if (clean.includes("UPI")) {
      return "UPI";
    }
    if (clean.includes("DEBIT")) {
      return "DEBIT";
    }
    if (clean.includes("BANK")) {
      return "BANK_TRANSFER";
    }

    return "OTHER";
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  function parseMultilineList(value) {
    const lines = String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const seen = new Set();
    const unique = [];
    for (const line of lines) {
      const key = line.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(line);
    }
    return unique;
  }

  function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const [yearRaw, monthRaw, dayRaw] = value.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return false;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return (
      utcDate.getUTCFullYear() === year &&
      utcDate.getUTCMonth() === month - 1 &&
      utcDate.getUTCDate() === day
    );
  }

  function todayISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function compareTxDesc(a, b) {
    const ka = `${a.date || ""} ${a.timestamp || ""}`;
    const kb = `${b.date || ""} ${b.timestamp || ""}`;
    if (ka > kb) {
      return -1;
    }
    if (ka < kb) {
      return 1;
    }
    return 0;
  }

  function compareTxAsc(a, b) {
    return -compareTxDesc(a, b);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function round2(number) {
    return Math.round((Number(number) + Number.EPSILON) * 100) / 100;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
})();
