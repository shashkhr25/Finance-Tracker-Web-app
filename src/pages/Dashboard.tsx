import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from '../components/Modal';
import { TransactionForm, BasketForm, CashForm } from '../components/Forms';
import type { Transaction } from '../types/finance';

const Dashboard: React.FC = () => {
    const { state, calculations, addTransaction, updateTransaction, deleteTransaction } = useFinance();
    const [modalConfig, setModalConfig] = useState<{ type: string; title: string } | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const handleQuickAction = (type: string, title: string) => {
        setModalConfig({ type, title });
    };

    const handleCloseModal = () => {
        setModalConfig(null);
    };

    const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="dashboard-main-container">
            <div className="dashboard-grid secondary-stats stats-section">
                <div className="stat-card">
                    <div className="stat-label">Liquid Balance</div>
                    <div className="stat-value positive">₹{calculations.liquidBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-details">
                        Accounts ₹{calculations.bankBalance.toLocaleString('en-IN')} | Cash ₹{calculations.cashBalance.toLocaleString('en-IN')}
                    </div>
                    <div className="stat-sub-details">
                        {Object.entries(calculations.accountBalances).map(([name, bal], i) => (
                            <span key={name}>{i > 0 ? ' | ' : ''}{name}: ₹{bal.toLocaleString('en-IN')}</span>
                        ))}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Outstanding Debt</div>
                    <div className="stat-value negative">₹{(calculations.creditCardDebt + calculations.borrowedDebt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-details">Card ₹{calculations.creditCardDebt.toLocaleString('en-IN')} | Borrowed ₹{calculations.borrowedDebt.toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div className="quick-links-section">
                <h2 className="section-title">Quick Links</h2>
                <div className="quick-actions">
                    <a href="#" className="qa-btn qa-expense" onClick={(e) => { e.preventDefault(); handleQuickAction('expense', 'Add Expense'); }}>+ Expense</a>
                    <a href="#" className="qa-btn qa-income" onClick={(e) => { e.preventDefault(); handleQuickAction('income', 'Add Income'); }}>+ Income</a>
                    <a href="#" className="qa-btn qa-import" onClick={(e) => { e.preventDefault(); handleQuickAction('import', 'Import'); }}>Import</a>
                    <a href="#" className="qa-btn qa-basket" onClick={(e) => { e.preventDefault(); handleQuickAction('basket', 'Basket'); }}>Basket</a>
                    <a href="#" className="qa-btn qa-cash" onClick={(e) => { e.preventDefault(); handleQuickAction('cash', 'Cash'); }}>Cash</a>
                </div>
            </div>

            <div className="activity-section">
                <div className="activity-header">
                    <h2 className="section-title">Recent Activity</h2>
                    <a href="/transactions" className="see-all">See All</a>
                </div>

                <div className="activity-list">
                    {sortedTx.map(tx => {
                        const dateObj = new Date(tx.date);
                        const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
                        return (
                            <div key={tx.id} className="activity-item">
                                <div className="activity-date">{dateStr}</div>
                                <div className="activity-info">
                                    <div className="activity-title">{tx.category}</div>
                                    <div className="activity-desc">{tx.description}</div>
                                </div>
                                <div className="activity-meta">
                                    <div className="payment-method">{tx.device}</div>
                                    <div className={`activity-amount ${tx.tx_type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="activity-actions">
                                        <span className="action-icon" onClick={() => setEditingTx(tx)}>✎</span>
                                        <span className="action-icon" onClick={() => deleteTransaction(tx.id)}>-</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {editingTx && (
                <Modal isOpen={true} onClose={() => setEditingTx(null)} title={`Edit ${editingTx.tx_type === 'income' ? 'Income' : 'Expense'}`}>
                    <TransactionForm 
                        type={editingTx.tx_type as 'income' | 'expense'} 
                        categories={editingTx.tx_type === 'expense' ? state.expense_categories : state.income_sources} 
                        accounts={state.accounts} 
                        devices={state.payment_devices}
                        initialData={editingTx}
                        onSubmit={(data) => { updateTransaction(editingTx.id, data); setEditingTx(null); }}
                        onCancel={() => setEditingTx(null)}
                    />
                </Modal>
            )}

            <Modal isOpen={!!modalConfig} onClose={handleCloseModal} title={modalConfig?.title || ''}>
                {modalConfig?.type === 'expense' && (
                    <TransactionForm 
                        type="expense" 
                        categories={state.expense_categories} 
                        accounts={state.accounts} 
                        devices={state.payment_devices}
                        onSubmit={(data) => { addTransaction(data); handleCloseModal(); }}
                        onCancel={handleCloseModal}
                    />
                )}
                {modalConfig?.type === 'income' && (
                    <TransactionForm 
                        type="income" 
                        categories={state.income_sources} 
                        accounts={state.accounts} 
                        devices={state.payment_devices}
                        onSubmit={(data) => { addTransaction(data); handleCloseModal(); }}
                        onCancel={handleCloseModal}
                    />
                )}
                {modalConfig?.type === 'import' && (
                    <div className="import-modal-content">
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Upload your bank statement (CSV, XLSX) to automatically categorize and import transactions.</p>
                        <div className="form-group">
                            <input type="file" className="form-input" accept=".csv, .xlsx" />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                            <button type="button" className="btn-success" onClick={() => { alert('Import feature coming soon!'); handleCloseModal(); }}>Upload & Analyze</button>
                        </div>
                    </div>
                )}
                {modalConfig?.type === 'basket' && (
                    <BasketForm 
                        accounts={state.accounts} 
                        devices={state.payment_devices}
                        onSubmit={(items, common) => { 
                            items.forEach(item => addTransaction({ 
                                ...common, 
                                tx_type: 'expense',
                                sub_type: common.sub_type || 'regular',
                                amount: item.amount, 
                                description: item.desc, 
                                category: 'Basket',
                                date: common.date || new Date().toISOString().split('T')[0],
                                account: common.account || (state.accounts[0]?.name || 'HDFC'),
                                device: common.device || (state.payment_devices[0] || 'UPI'),
                                effects_balance: common.effects_balance !== undefined ? common.effects_balance : true
                            }));
                            handleCloseModal(); 
                        }}
                        onCancel={handleCloseModal}
                    />
                )}
                {modalConfig?.type === 'cash' && (
                    <CashForm 
                        onSubmit={(amount) => {
                            const mainAcc = state.accounts.find(a => a.is_main) || state.accounts[0];
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
                            handleCloseModal();
                        }}
                        onCancel={handleCloseModal}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Dashboard;
