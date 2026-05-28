// FinanceTracker Core Logic & State Management

// --- Data Models (Mock Data) ---
let state = {
    user: 'shashwat',
    accounts: [
        { name: 'HDFC', balance: 7411.57, is_main: true }
    ],
    cash_balance: 105.00,
    savings: {
        general: 10231.15,
        fd: 100000.00,
        rd: 60999.00,
        gold: 38174.58
    },
    expense_categories: ['Food', 'Home', 'House EMI', 'Personal', 'Rent', 'Savings', 'Savings RD', 'Subscription/Recharge'],
    income_sources: ['Paycheck', 'Rent', 'Home', 'Personal split paid', 'Refund'],
    payment_devices: ['UPI', 'CASH', 'CREDIT_CARD_0098', 'CREDIT_CARD_6734', 'CREDIT_CARD_UPI'],
    participants: ['pathak', 'maitri', 'sarayu'],
    category_budgets: {
        'Food': 5000.00,
        'Home': 500.00,
        'House EMI': 22696.00,
        'Personal': 5000.00,
        'Rent': 11000.00,
        'Subscription/Recharge': 4000.00
    },
    transactions: [
        {
            id: '1',
            timestamp: new Date().toISOString(),
            tx_type: 'expense',
            sub_type: 'regular',
            amount: 10.00,
            date: '2026-05-13',
            description: 'food',
            category: 'Food',
            device: 'UPI',
            account: 'HDFC',
            effects_balance: true
        },
        {
            id: '2',
            timestamp: new Date().toISOString(),
            tx_type: 'expense',
            sub_type: 'regular',
            amount: 500.00,
            date: '2026-05-13',
            description: 'going out',
            category: 'Personal',
            device: 'UPI',
            account: 'HDFC',
            effects_balance: true
        },
        {
            id: '3',
            timestamp: new Date().toISOString(),
            tx_type: 'income',
            sub_type: 'regular',
            amount: 5000.00,
            date: '2026-05-13',
            description: 'paycheck',
            category: 'Paycheck',
            device: 'UPI',
            account: 'HDFC',
            effects_balance: true
        },
        {
            id: '4',
            timestamp: new Date().toISOString(),
            tx_type: 'expense',
            sub_type: 'regular',
            amount: 12000.00,
            date: '2026-05-11',
            description: 'rent shared',
            category: 'Personal',
            device: 'UPI',
            account: 'HDFC',
            effects_balance: true,
            shared_flag: true,
            shared_splits: [{ name: 'maitri', amount: 12000.00 }]
        }
    ]
};

// --- Core Calculations ---

function calculateLiquidBalance() {
    const accountTotal = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    return accountTotal + state.cash_balance;
}

function calculateOutstandingDebt() {
    // In this mock, we'll assume debt is tracked via specific transaction sub_types
    // As per app_features_2.md, CC expenses have effects_balance=False
    // and they create a linked 'credit_card_debt' income row.
    return state.transactions
        .filter(tx => tx.sub_type === 'credit_card_debt')
        .reduce((sum, tx) => sum + tx.amount, 0);
}

function calculateNetWorth() {
    const assets = calculateLiquidBalance() + state.savings.general + state.savings.fd + state.savings.rd + state.savings.gold;
    const liabilities = calculateOutstandingDebt();
    return assets - liabilities;
}

// --- UI Rendering Functions ---

function updateDashboardStats() {
    const liquidBalanceEl = document.getElementById('liquid-balance');
    const liquidDetailsEl = document.getElementById('liquid-details');
    const mainBankDetailsEl = document.getElementById('main-bank-details');
    const outstandingDebtEl = document.getElementById('outstanding-debt');
    const debtDetailsEl = document.getElementById('debt-details');

    if (!liquidBalanceEl) return; // Not on dashboard

    const liquidVal = calculateLiquidBalance();
    const accountTotal = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const mainBank = state.accounts.find(acc => acc.is_main);

    liquidBalanceEl.textContent = `₹${liquidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    liquidDetailsEl.textContent = `Accounts ₹${accountTotal.toLocaleString('en-IN')} | Cash ₹${state.cash_balance.toLocaleString('en-IN')}`;
    if (mainBank) {
        mainBankDetailsEl.textContent = `${mainBank.name}: ₹${mainBank.balance.toLocaleString('en-IN')}`;
    }

    const debtVal = calculateOutstandingDebt();
    outstandingDebtEl.textContent = `₹${debtVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    debtDetailsEl.textContent = `Card ₹${debtVal.toLocaleString('en-IN')} | Borrowed ₹0.00`;
}

function renderRecentActivity() {
    const listEl = document.getElementById('recent-activity-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    sortedTx.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        const dateObj = new Date(tx.date);
        const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
        
        item.innerHTML = `
            <div class="activity-date">${dateStr}</div>
            <div class="activity-info">
                <div class="activity-title">${tx.category}</div>
                <div class="activity-desc">${tx.description}</div>
            </div>
            <div class="activity-meta">
                <div class="payment-method">${tx.device}</div>
                <div class="activity-amount ${tx.tx_type === 'income' ? 'amount-positive' : 'amount-negative'}">
                    ₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div class="activity-actions">
                    <span class="action-icon">✎</span>
                    <span class="action-icon" onclick="deleteTransaction('${tx.id}')">-</span>
                </div>
            </div>
        `;
        listEl.appendChild(item);
    });
}

// --- Transaction Actions ---

function addTransaction(txData) {
    const newTx = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...txData
    };

    state.transactions.push(newTx);

    // Update balances if effects_balance is true
    if (newTx.effects_balance) {
        if (newTx.device === 'CASH') {
            if (newTx.tx_type === 'expense') state.cash_balance -= newTx.amount;
            else state.cash_balance += newTx.amount;
        } else {
            const acc = state.accounts.find(a => a.name === newTx.account);
            if (acc) {
                if (newTx.tx_type === 'expense') acc.balance -= newTx.amount;
                else acc.balance += newTx.amount;
            }
        }
    }

    // Special Logic: Credit Card Expense
    if (newTx.sub_type === 'credit_card_expense') {
        // Create paired debt transaction
        const debtTx = {
            id: (Date.now() + 1).toString(),
            timestamp: new Date().toISOString(),
            tx_type: 'income',
            sub_type: 'credit_card_debt',
            amount: newTx.amount,
            date: newTx.date,
            description: `Debt for: ${newTx.description}`,
            category: 'Debt',
            device: newTx.device,
            account: newTx.account,
            effects_balance: false,
            linked_tx_id: newTx.id
        };
        state.transactions.push(debtTx);
    }

    refreshUI();
}

function deleteTransaction(id) {
    const txIndex = state.transactions.findIndex(tx => tx.id === id);
    if (txIndex === -1) return;

    const tx = state.transactions[txIndex];
    
    // Reverse balance effects
    if (tx.effects_balance) {
        if (tx.device === 'CASH') {
            if (tx.tx_type === 'expense') state.cash_balance += tx.amount;
            else state.cash_balance -= tx.amount;
        } else {
            const acc = state.accounts.find(a => a.name === tx.account);
            if (acc) {
                if (tx.tx_type === 'expense') acc.balance += tx.amount;
                else acc.balance -= tx.amount;
            }
        }
    }

    // If it was a CC expense, delete linked debt too
    if (tx.sub_type === 'credit_card_expense') {
        const linkedIdx = state.transactions.findIndex(t => t.linked_tx_id === tx.id);
        if (linkedIdx !== -1) state.transactions.splice(linkedIdx, 1);
    }

    state.transactions.splice(txIndex, 1);
    refreshUI();
}

function renderFullTransactions() {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    
    // Simple filter logic for now (can be expanded)
    const filteredTx = state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    let totalVal = 0;
    filteredTx.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        const dateObj = new Date(tx.date);
        const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
        
        item.innerHTML = `
            <div class="activity-date">${dateStr}</div>
            <div class="activity-info">
                <div class="activity-title">${tx.category}</div>
                <div class="activity-desc">${tx.description}</div>
            </div>
            <div class="activity-meta">
                <div class="payment-method">${tx.device}</div>
                <div class="activity-amount ${tx.tx_type === 'income' ? 'amount-positive' : 'amount-negative'}">
                    ${tx.tx_type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div class="activity-actions">
                    <span class="action-icon">✎</span>
                    <span class="action-icon" onclick="deleteTransaction('${tx.id}')">-</span>
                </div>
            </div>
        `;
        listEl.appendChild(item);
        
        if (tx.tx_type === 'expense') totalVal += tx.amount;
        else totalVal -= tx.amount;
    });

    // Update filtered total
    const totalEl = document.querySelector('.activity-header div:last-child');
    if (totalEl && totalEl.textContent.includes('₹')) {
        totalEl.textContent = `₹${Math.abs(totalVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
}

function renderCategoryTotals() {
    const listEl = document.getElementById('category-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    const totals = {};
    state.expense_categories.forEach(cat => totals[cat] = 0);

    state.transactions
        .filter(tx => tx.tx_type === 'expense')
        .forEach(tx => {
            if (totals[tx.category] !== undefined) {
                totals[tx.category] += tx.amount;
            } else {
                totals['Other'] = (totals['Other'] || 0) + tx.amount;
            }
        });

    let overallTotal = 0;
    Object.keys(totals).forEach(cat => {
        const amount = totals[cat];
        overallTotal += amount;
        const budget = state.category_budgets[cat];
        
        const item = document.createElement('div');
        item.className = 'category-item';
        
        let diffHTML = '';
        if (budget) {
            const diff = budget - amount;
            const diffColor = diff >= 0 ? 'var(--color-positive)' : 'var(--color-negative)';
            diffHTML = `<div class="category-diff" style="color: ${diffColor};">${Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>`;
        } else {
            diffHTML = `<div class="category-diff" style="color: var(--text-secondary);">-</div>`;
        }

        item.innerHTML = `
            <div class="category-name">${cat}</div>
            <div class="category-amount">${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="category-budget">${budget ? budget.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Budget'}</div>
            ${diffHTML}
        `;
        listEl.appendChild(item);
    });

    const overallEl = document.querySelector('.activity-header div:last-child');
    if (overallEl && overallEl.textContent.includes('₹')) {
        overallEl.textContent = `₹${overallTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
}

function renderNetWorth() {
    const netWorthEl = document.getElementById('net-worth-value');
    const totalAssetsEl = document.getElementById('total-assets');
    const totalLiabilitiesEl = document.getElementById('total-liabilities');
    const assetsListEl = document.getElementById('assets-list');
    const ccDebtValEl = document.getElementById('cc-debt-val');
    const borrowedDebtValEl = document.getElementById('borrowed-debt-val');

    if (!netWorthEl) return;

    const liquidVal = calculateLiquidBalance();
    const assets = {
        'Liquid Balance': liquidVal,
        'General Savings': state.savings.general,
        'Fixed Deposits': state.savings.fd,
        'Recurring Deposits': state.savings.rd,
        'Gold Assets': state.savings.gold
    };

    let totalAssets = 0;
    assetsListEl.innerHTML = '';
    Object.keys(assets).forEach(key => {
        const val = assets[key];
        totalAssets += val;
        const item = document.createElement('div');
        item.className = 'nw-item';
        item.innerHTML = `
            <span class="nw-item-label">${key}</span>
            <span class="nw-item-value">${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        `;
        assetsListEl.appendChild(item);
    });

    const liabilities = calculateOutstandingDebt();
    const totalLiabilities = liabilities; // Add borrowed debt here if tracked separately

    netWorthEl.textContent = (totalAssets - totalLiabilities).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    totalAssetsEl.textContent = totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    totalLiabilitiesEl.textContent = totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    ccDebtValEl.textContent = liabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    borrowedDebtValEl.textContent = '0.00';
}

function renderSharedExpenses() {
    const listEl = document.getElementById('participant-list');
    const netPositionEl = document.getElementById('net-shared-position');
    if (!listEl) return;

    const balances = {};
    state.participants.forEach(p => balances[p] = 0);

    state.transactions.forEach(tx => {
        if (tx.shared_flag && tx.shared_splits) {
            tx.shared_splits.forEach(split => {
                if (balances[split.name] !== undefined) {
                    balances[split.name] += split.amount;
                }
            });
        }
        if (tx.category === 'Personal split paid' && tx.tx_type === 'income') {
            const person = state.participants.find(p => tx.description.toLowerCase().includes(p.toLowerCase()));
            if (person) balances[person] -= tx.amount;
        }
    });

    listEl.innerHTML = '';
    let netPosition = 0;
    Object.keys(balances).forEach(person => {
        const amount = balances[person];
        netPosition += amount;
        
        const item = document.createElement('div');
        item.className = `participant-item ${amount > 10000 ? 'highlight' : ''}`;
        
        item.innerHTML = `
            <div class="participant-info">
                <div class="participant-name">${person}</div>
                <div class="participant-status">${amount >= 0 ? 'You should receive' : 'You owe'}</div>
            </div>
            <div>
                <div class="participant-amount">${amount >= 0 ? '+' : ''}₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <a href="#" class="participant-details">Details ></a>
            </div>
        `;
        listEl.appendChild(item);
    });

    if (netPositionEl) {
        netPositionEl.textContent = `${netPosition >= 0 ? '+' : ''}₹${netPosition.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        netPositionEl.className = `stat-value ${netPosition >= 0 ? 'positive' : 'negative'}`;
    }
}

function renderSettings() {
    const cashInput = document.getElementById('config-cash');
    const accountsText = document.getElementById('config-accounts');
    const devicesText = document.getElementById('config-devices');
    const incomeText = document.getElementById('config-income');
    const participantsText = document.getElementById('config-participants');
    const saveBtn = document.getElementById('save-settings');

    if (!cashInput) return;

    cashInput.value = state.cash_balance.toFixed(2);
    accountsText.value = state.accounts.map(a => `${a.name}: ${a.balance.toFixed(2)}`).join('\n');
    devicesText.value = state.payment_devices.join('\n');
    incomeText.value = state.income_sources.join('\n');
    participantsText.value = state.participants.join('\n');

    saveBtn.onclick = () => {
        state.cash_balance = parseFloat(cashInput.value);
        state.payment_devices = devicesText.value.split('\n').filter(s => s.trim());
        state.income_sources = incomeText.value.split('\n').filter(s => s.trim());
        state.participants = participantsText.value.split('\n').filter(s => s.trim());
        
        // Parse accounts (simple parsing for this mock)
        state.accounts = accountsText.value.split('\n').filter(s => s.trim()).map(line => {
            const [name, bal] = line.split(':').map(p => p.trim());
            return { name, balance: parseFloat(bal) || 0, is_main: name === 'HDFC' };
        });

        alert('Settings saved locally!');
        refreshUI();
    };
}

function refreshUI() {
    updateDashboardStats();
    renderRecentActivity();
    renderFullTransactions();
    renderCategoryTotals();
    renderNetWorth();
    renderSharedExpenses();
    renderSettings();
}

// --- Modal Logic ---

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

if (modalClose) {
    modalClose.onclick = () => modalOverlay.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target == modalOverlay) {
        modalOverlay.style.display = 'none';
    }
};

function showModal(title, contentHTML) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHTML;
    modalOverlay.style.display = 'flex';
}

// --- Form Templates ---

function getExpenseFormHTML() {
    return `
        <form id="transaction-form">
            <div class="form-group">
                <label>Amount (₹)</label>
                <input type="number" id="tx-amount" class="form-input" step="0.01" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="tx-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="tx-category" class="form-select">
                        ${state.expense_categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="tx-desc" class="form-input" placeholder="What was this for?">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account</label>
                    <select id="tx-account" class="form-select">
                        ${state.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Device</label>
                    <select id="tx-device" class="form-select">
                        ${state.payment_devices.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="modalOverlay.style.display='none'">Cancel</button>
                <button type="submit" class="btn-success">Save Expense</button>
            </div>
        </form>
    `;
}

function getIncomeFormHTML() {
    return `
        <form id="transaction-form">
            <div class="form-group">
                <label>Amount (₹)</label>
                <input type="number" id="tx-amount" class="form-input" step="0.01" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="tx-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Source</label>
                    <select id="tx-category" class="form-select">
                        ${state.income_sources.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="tx-desc" class="form-input" placeholder="Where did this come from?">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Account</label>
                    <select id="tx-account" class="form-select">
                        ${state.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Device</label>
                    <select id="tx-device" class="form-select">
                        ${state.payment_devices.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="modalOverlay.style.display='none'">Cancel</button>
                <button type="submit" class="btn-success">Save Income</button>
            </div>
        </form>
    `;
}

function getBasketFormHTML() {
    return `
        <form id="basket-form">
            <div class="form-group">
                <label>Total Paid (₹)</label>
                <input type="number" id="basket-total" class="form-input" step="0.01" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="basket-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Account</label>
                    <select id="basket-account" class="form-select">
                        ${state.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Main Device</label>
                <select id="basket-device" class="form-select">
                    ${state.payment_devices.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
            
            <div class="basket-items-list" id="basket-items-container">
                <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">Basket Items</h4>
                <div class="basket-item-row">
                    <input type="text" class="form-input item-desc" placeholder="Item name" required>
                    <input type="number" class="form-input item-amount" placeholder="Amount" step="0.01" required>
                    <span></span>
                </div>
            </div>
            <button type="button" class="btn-add-item" onclick="addBasketItemRow()">+ Add Another Item</button>

            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="modalOverlay.style.display='none'">Cancel</button>
                <button type="submit" class="btn-success">Process Basket</button>
            </div>
        </form>
    `;
}

function addBasketItemRow() {
    const container = document.getElementById('basket-items-container');
    const row = document.createElement('div');
    row.className = 'basket-item-row';
    row.innerHTML = `
        <input type="text" class="form-input item-desc" placeholder="Item name" required>
        <input type="number" class="form-input item-amount" placeholder="Amount" step="0.01" required>
        <span class="modal-close" onclick="this.parentElement.remove()" style="font-size: 1rem;">&times;</span>
    `;
    container.appendChild(row);
}

function getCashFormHTML() {
    return `
        <form id="cash-form">
            <div class="form-group">
                <label>Amount (₹)</label>
                <input type="number" id="cash-amount" class="form-input" step="0.01" required>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
                This will record a cash withdrawal from your main bank account.
            </p>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="modalOverlay.style.display='none'">Cancel</button>
                <button type="submit" class="btn-success">Withdraw Cash</button>
            </div>
        </form>
    `;
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    refreshUI();

    // Quick Action Buttons
    const btnExpense = document.getElementById('qa-expense');
    if (btnExpense) {
        btnExpense.onclick = (e) => {
            e.preventDefault();
            showModal('Add Expense', getExpenseFormHTML());
            
            document.getElementById('transaction-form').onsubmit = (ev) => {
                ev.preventDefault();
                const device = document.getElementById('tx-device').value;
                const subType = device.startsWith('CREDIT_CARD') ? 'credit_card_expense' : 'regular';
                const effectsBalance = !device.startsWith('CREDIT_CARD');

                addTransaction({
                    tx_type: 'expense',
                    sub_type: subType,
                    amount: parseFloat(document.getElementById('tx-amount').value),
                    date: document.getElementById('tx-date').value,
                    category: document.getElementById('tx-category').value,
                    description: document.getElementById('tx-desc').value,
                    account: document.getElementById('tx-account').value,
                    device: device,
                    effects_balance: effectsBalance
                });
                modalOverlay.style.display = 'none';
            };
        };
    }

    const btnIncome = document.getElementById('qa-income');
    if (btnIncome) {
        btnIncome.onclick = (e) => {
            e.preventDefault();
            showModal('Add Income', getIncomeFormHTML());
            document.getElementById('transaction-form').onsubmit = (ev) => {
                ev.preventDefault();
                addTransaction({
                    tx_type: 'income',
                    sub_type: 'regular',
                    amount: parseFloat(document.getElementById('tx-amount').value),
                    date: document.getElementById('tx-date').value,
                    category: document.getElementById('tx-category').value,
                    description: document.getElementById('tx-desc').value,
                    account: document.getElementById('tx-account').value,
                    device: document.getElementById('tx-device').value,
                    effects_balance: true
                });
                modalOverlay.style.display = 'none';
            };
        };
    }

    const btnBasket = document.getElementById('qa-basket');
    if (btnBasket) {
        btnBasket.onclick = (e) => {
            e.preventDefault();
            showModal('Basket Expense', getBasketFormHTML());
            document.getElementById('basket-form').onsubmit = (ev) => {
                ev.preventDefault();
                const total = parseFloat(document.getElementById('basket-total').value);
                const date = document.getElementById('basket-date').value;
                const account = document.getElementById('basket-account').value;
                const device = document.getElementById('basket-device').value;
                
                const items = document.querySelectorAll('.basket-item-row');
                items.forEach(row => {
                    const desc = row.querySelector('.item-desc').value;
                    const amount = parseFloat(row.querySelector('.item-amount').value);
                    addTransaction({
                        tx_type: 'expense',
                        sub_type: device.startsWith('CREDIT_CARD') ? 'credit_card_expense' : 'regular',
                        amount: amount,
                        date: date,
                        category: 'Basket',
                        description: desc,
                        account: account,
                        device: device,
                        effects_balance: !device.startsWith('CREDIT_CARD')
                    });
                });
                modalOverlay.style.display = 'none';
            };
        };
    }

    const btnCash = document.getElementById('qa-cash');
    if (btnCash) {
        btnCash.onclick = (e) => {
            e.preventDefault();
            showModal('Cash Withdrawal', getCashFormHTML());
            document.getElementById('cash-form').onsubmit = (ev) => {
                ev.preventDefault();
                const amount = parseFloat(document.getElementById('cash-amount').value);
                const mainAcc = state.accounts.find(a => a.is_main);
                
                // 1. Expense from Bank
                addTransaction({
                    tx_type: 'expense',
                    sub_type: 'cash_withdrawal',
                    amount: amount,
                    date: new Date().toISOString().split('T')[0],
                    category: 'Transfer',
                    description: 'Cash Withdrawal',
                    account: mainAcc ? mainAcc.name : 'HDFC',
                    device: 'UPI',
                    effects_balance: true
                });

                // 2. Income to Cash
                state.cash_balance += amount;
                refreshUI();
                
                modalOverlay.style.display = 'none';
            };
        };
    }
});
