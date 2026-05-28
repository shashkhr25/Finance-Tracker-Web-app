import React from 'react';
import { useFinance } from '../context/FinanceContext';

const NetWorth: React.FC = () => {
    const { calculations } = useFinance();

    const assets = [
        { label: 'Liquid Balance (Bank)', value: calculations.liquidBalance },
        { label: 'Cash in Hand', value: calculations.cashBalance },
        { label: 'Total Savings', value: calculations.totalSavings },
    ];

    const totalAssets = calculations.liquidBalance + calculations.cashBalance + calculations.totalSavings;
    const totalDebt = calculations.creditCardDebt + calculations.borrowedDebt;

    return (
        <>
            <div className="hero-card">
                <div className="hero-label">Estimated Net Worth</div>
                <div className="hero-value">₹{calculations.netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="hero-subtext">Combined value of all liquid assets, savings, and debts</div>
            </div>

            <div className="nw-section-header">
                <div className="nw-title">Assets & Savings</div>
                <div className="nw-total" style={{ color: '#27ae60' }}>₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="settings-section" style={{ padding: '1rem 2.5rem' }}>
                {assets.map(asset => (
                    <div key={asset.label} className="nw-item">
                        <span className="nw-item-label">{asset.label}</span>
                        <span className="nw-item-value">{asset.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>

            <div className="nw-section-header">
                <div className="nw-title">Liabilities & Debt</div>
                <div className="nw-total" style={{ color: '#e74c3c' }}>₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="dashboard-grid">
                <div className="stat-card" style={{ textAlign: 'left' }}>
                    <div className="stat-label">Credit Card Debt</div>
                    <div className="stat-value negative" style={{ fontSize: '3rem', marginBottom: 0 }}>₹{calculations.creditCardDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'left' }}>
                    <div className="stat-label">Borrowed Debt</div>
                    <div className="stat-value negative" style={{ fontSize: '3rem', marginBottom: 0 }}>₹{calculations.borrowedDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
        </>
    );
};

export default NetWorth;
