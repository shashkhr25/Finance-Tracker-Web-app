import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const CategoryTotals: React.FC = () => {
    const { state } = useFinance();
    const [view, setView] = useState<'expenses' | 'spending'>('expenses');
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('05');
    const [yearFilter, setYearFilter] = useState('2026');

    const totals: Record<string, number> = {};
    const relevantCategories = view === 'expenses' ? state.expense_categories : [...state.expense_categories, ...state.income_sources];
    relevantCategories.forEach(cat => totals[cat] = 0);

    state.transactions
        .filter(tx => {
            const matchesType = view === 'expenses' ? tx.tx_type === 'expense' : true;
            const [y, m] = tx.date.split('-');
            const matchesMonth = monthFilter === 'All' || m === monthFilter;
            const matchesYear = yearFilter === '' || y === yearFilter;
            return matchesType && matchesMonth && matchesYear;
        })
        .forEach(tx => {
            if (totals[tx.category] !== undefined) {
                totals[tx.category] += tx.amount;
            } else {
                totals['Other'] = (totals['Other'] || 0) + tx.amount;
            }
        });

    const filteredCategories = Object.keys(totals).filter(cat => 
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const overallTotal = filteredCategories.reduce((sum, cat) => sum + totals[cat], 0);

    const clearFilters = () => {
        setSearchTerm('');
        setMonthFilter('All');
        setYearFilter('2026');
    };

    return (
        <>
            <div className="activity-header">
                <div className="tabs">
                    <a href="#" className={`tab ${view === 'expenses' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('expenses'); }}>Expenses</a>
                    <a href="#" className={`tab ${view === 'spending' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('spending'); }}>Total Spending</a>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{overallTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="filter-container">
                <div className="filter-row">
                    <div className="filter-item" style={{ flex: 3 }}>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Search categories..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <select className="form-select">
                            <option>All</option>
                        </select>
                    </div>
                </div>
                <div className="filter-row">
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
                    <div style={{ flex: 2 }}></div>
                    <button className="btn-clear" onClick={clearFilters}>Clear</button>
                </div>
            </div>

            <div className="category-list">
                {filteredCategories.map(cat => {
                    const amount = totals[cat];
                    const budget = state.category_budgets[cat];
                    const diff = budget ? budget - amount : null;

                    return (
                        <div key={cat} className="category-item">
                            <div className="category-name">{cat}</div>
                            <div className="category-amount">{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="category-budget">{budget ? budget.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Budget'}</div>
                            <div className="category-diff" style={{ color: diff !== null ? (diff >= 0 ? 'var(--color-positive)' : 'var(--color-negative)') : 'var(--text-secondary)' }}>
                                {diff !== null ? Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default CategoryTotals;
