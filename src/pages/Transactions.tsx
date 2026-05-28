import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from '../components/Modal';
import { TransactionForm } from '../components/Forms';
import type { Transaction } from '../types/finance';

const Transactions: React.FC = () => {
    const { state, updateTransaction, deleteTransaction } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [accountFilter, setAccountFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('2026');
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('All');
        setAccountFilter('All');
        setDateFilter('');
        setMonthFilter('All');
        setYearFilter('2026');
    };

    const filteredTx = state.transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             tx.device.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
        const matchesAccount = accountFilter === 'All' || tx.account === accountFilter || (accountFilter === 'CASH' && tx.device === 'CASH');
        const matchesDate = dateFilter === '' || tx.date === dateFilter;
        
        const [y, m] = tx.date.split('-');
        const matchesMonth = monthFilter === 'All' || m === monthFilter;
        const matchesYear = yearFilter === '' || y === yearFilter;

        return matchesSearch && matchesCategory && matchesAccount && matchesDate && matchesMonth && matchesYear;
    }).sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    const totalFiltered = filteredTx.reduce((sum, tx) => sum + (tx.tx_type === 'expense' ? tx.amount : -tx.amount), 0);

    return (
        <>
            <div className="activity-header">
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtered total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{Math.abs(totalFiltered).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="filter-container">
                <div className="filter-row">
                    <div className="filter-item" style={{ flex: 3 }}>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Search description, category, or device..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}>
                            <option value="newest">Sort: Newest First</option>
                            <option value="oldest">Sort: Oldest First</option>
                        </select>
                    </div>
                </div>
                <div className="filter-row">
                    <div className="filter-item">
                        <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="All">All Categories</option>
                            {[...state.expense_categories, ...state.income_sources].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <select className="form-select" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                            <option value="All">All Accounts</option>
                            {state.accounts.map(a => (
                                <option key={a.name} value={a.name}>{a.name}</option>
                            ))}
                            <option value="CASH">Cash</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="YYYY-MM-DD" 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <select className="form-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                            {["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                <option key={m} value={i === 0 ? "All" : i.toString().padStart(2, '0')}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <input 
                            type="text" 
                            className="form-input" 
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                        />
                    </div>
                    <button className="btn-clear" onClick={clearFilters}>Clear</button>
                </div>
            </div>

            <div className="activity-list">
                {filteredTx.map(tx => {
                    const dateObj = new Date(tx.date);
                    const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
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
                                    {tx.tx_type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
        </>
    );
};

export default Transactions;
