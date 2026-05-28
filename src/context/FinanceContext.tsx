import { useAuth } from './AuthContext';
import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { FinanceState, Transaction } from '../types/finance';
import * as googleSheets from '../services/googleSheetsService';

interface FinanceContextType {
    state: FinanceState;
    addTransaction: (txData: Omit<Transaction, 'id' | 'timestamp'>) => void;
    updateTransaction: (id: string, txData: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => void;
    deleteTransaction: (id: string) => void;
    updateSettings: (newSettings: Partial<FinanceState>) => void;
    pushToCloud: (url?: string) => Promise<boolean>;
    pullFromCloud: (url?: string) => Promise<boolean>;
    calculations: {
        liquidBalance: number;
        bankBalance: number;
        cashBalance: number;
        totalSavings: number;
        creditCardDebt: number;
        borrowedDebt: number;
        netWorth: number;
        sharedBalances: Record<string, number>;
        accountBalances: Record<string, number>;
    };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'money_tracker_state';

const defaultState: FinanceState = {
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
    transactions: [],
    cloud_sheet_url: ''
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const storageKey = user ? `money_tracker_state_${user}` : 'money_tracker_state_guest';

    const [state, setState] = useState<FinanceState>(defaultState);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState({
                    ...defaultState,
                    ...parsed,
                    user: user || 'guest',
                    savings: { ...defaultState.savings, ...(parsed.savings || {}) },
                });
            } catch {
                setState({ ...defaultState, user: user || 'guest' });
            }
        } else {
            setState({ ...defaultState, user: user || 'guest' });
        }
    }, [storageKey, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [state, storageKey, user]);

    const addTransaction = (txData: Omit<Transaction, 'id' | 'timestamp'>) => {
        const newId = Date.now().toString();
        const newTx: Transaction = {
            ...txData,
            id: newId,
            timestamp: new Date().toISOString(),
        };

        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, newTx]
        }));
    };

    const updateTransaction = (id: string, updatedFields: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => {
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t)
        }));
    };

    const deleteTransaction = (id: string) => {
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== id)
        }));
    };

    const updateSettings = (newSettings: Partial<FinanceState>) => {
        setState(prev => ({ ...prev, ...newSettings }));
    };

    const pushToCloud = async (url?: string) => {
        const targetUrl = url || state.cloud_sheet_url;
        if (!targetUrl) return false;
        return await googleSheets.pushToSheet(targetUrl, state);
    };

    const pullFromCloud = async (url?: string) => {
        const targetUrl = url || state.cloud_sheet_url;
        if (!targetUrl) {
            console.warn("No cloud URL provided and none saved in state");
            return false;
        }
        
        console.log("Pulling from cloud URL:", targetUrl);
        const cloudState = await googleSheets.pullFromSheet(targetUrl);
        
        if (cloudState && Object.keys(cloudState).length > 0) {
            setState(prev => {
                const merged = { ...prev, ...cloudState };
                // Ensure we keep the URL that worked
                merged.cloud_sheet_url = targetUrl;
                return merged;
            });
            console.log("Cloud state pulled and merged successfully");
            return true;
        }
        console.error("Failed to pull cloud state or state was empty");
        return false;
    };

    const calculations = useMemo(() => {
        // 1. Core Initial Balances
        const accountBalances: Record<string, number> = {};
        (state.accounts || []).forEach(acc => {
            accountBalances[acc.name] = acc.balance || 0;
        });

        let cashBalance = (state.cash_balance || 0);
        let totalSavings = (state.savings?.general || 0) + (state.savings?.fd || 0) + (state.savings?.rd || 0) + (state.savings?.gold || 0);
        
        const cycleTotals: Record<string, { expenses: number; payments: number }> = {};
        let borrowedDebt = 0;
        const sharedBalances: Record<string, number> = {};

        const getCycleKey = (dateStr: string) => {
            const d = new Date(dateStr);
            let year = d.getFullYear();
            let month = d.getMonth();
            if (d.getDate() < 19) {
                month -= 1;
                if (month < 0) { month = 11; year -= 1; }
            }
            return `${year}-${String(month + 1).padStart(2, '0')}`;
        };

        // 2. Process Transactions chronologically
        const sortedTx = [...state.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedTx.forEach(tx => {
            const amount = Math.abs(tx.amount || 0);
            const deviceType = tx.device?.toUpperCase() || '';
            const isCC = deviceType.includes('CREDIT_CARD') || tx.sub_type === 'credit_card_expense' || tx.sub_type === 'credit_card_payment';
            
            // A. Account Impact
            const effectsBalance = tx.effects_balance === true || String(tx.effects_balance).toLowerCase() === 'true';
            if (effectsBalance) {
                if (deviceType === 'CASH') {
                    const sign = tx.tx_type === 'income' ? 1 : -1;
                    cashBalance += (sign * amount);
                } else if (deviceType !== 'DEBT_BORROWED') {
                    const accountName = tx.account || (state.accounts[0]?.name);
                    if (accountName) {
                        if (accountBalances[accountName] === undefined) accountBalances[accountName] = 0;
                        
                        if (isCC) {
                            const isCcPayment = tx.sub_type === 'credit_card_payment' || 
                                               tx.category?.toLowerCase().includes('credit card bill') ||
                                               tx.description?.toLowerCase().startsWith('credit card payment');
                            
                            if (tx.tx_type === 'expense' && isCcPayment) {
                                accountBalances[accountName] -= amount;
                            }
                        } else {
                            const sign = tx.tx_type === 'income' ? 1 : -1;
                            accountBalances[accountName] += (sign * amount);
                        }
                    }
                }
            }

            // B. Savings tracking
            const catLower = tx.category?.toLowerCase() || '';
            const isSavingsCat = catLower.startsWith('savings');
            if (tx.tx_type === 'expense' && isSavingsCat) {
                totalSavings += amount;
            } else if (tx.tx_type === 'income' && (isSavingsCat || catLower === 'taken from savings' || deviceType === 'SAVINGS_WITHDRAW')) {
                totalSavings -= amount;
            }

            // C. CC Debt tracking
            if (isCC) {
                const cycle = getCycleKey(tx.date);
                if (!cycleTotals[cycle]) cycleTotals[cycle] = { expenses: 0, payments: 0 };
                const isDebtOffset = tx.sub_type === 'credit_card_payment' || 
                                     tx.sub_type === 'refund' ||
                                     tx.category?.toLowerCase().includes('credit card bill') ||
                                     tx.description?.toLowerCase().startsWith('credit card payment');
                if (isDebtOffset) {
                    cycleTotals[cycle].payments += amount;
                } else if (tx.tx_type === 'expense') {
                    cycleTotals[cycle].expenses += amount;
                }
            }

            // D. Borrowed & Shared
            if (deviceType === 'DEBT_BORROWED' && !tx.shared_flag) {
                if (tx.tx_type === 'income') borrowedDebt += amount;
                else borrowedDebt -= amount;
            }
            if (catLower === 'debt cleared' && !tx.shared_flag) {
                borrowedDebt -= amount;
            }

            if (tx.shared_flag && tx.shared_splits) {
                let specifiedTotal = 0;
                const unspecified: string[] = [];
                tx.shared_splits.forEach(s => {
                    if (s.amount) specifiedTotal += s.amount;
                    else unspecified.push(s.name);
                });
                const remaining = Math.max(0, amount - specifiedTotal);
                const autoShare = unspecified.length > 0 ? remaining / unspecified.length : 0;
                tx.shared_splits.forEach(s => {
                    const share = s.amount || autoShare;
                    const sign = (tx.tx_type === 'expense' && deviceType !== 'DEBT_BORROWED') ? 1 : -1;
                    sharedBalances[s.name] = (sharedBalances[s.name] || 0) + (sign * share);
                });
            }
        });

        // 3. Final Aggr
        const sortedCycles = Object.keys(cycleTotals).sort();
        let pooledPayments = sortedCycles.reduce((sum, c) => sum + cycleTotals[c].payments, 0);
        let creditCardDebt = 0;
        sortedCycles.forEach(c => {
            const exp = cycleTotals[c].expenses;
            const applied = Math.min(exp, pooledPayments);
            creditCardDebt += (exp - applied);
            pooledPayments -= applied;
        });

        const sharedPayable = Object.values(sharedBalances).reduce((sum, bal) => sum + (bal < 0 ? Math.abs(bal) : 0), 0);
        const finalBorrowedDebt = Math.max(0, borrowedDebt + sharedPayable);
        
        const bankBalance = Object.values(accountBalances).reduce((sum, b) => sum + b, 0);
        const liquidBalance = bankBalance + cashBalance;
        const netWorth = liquidBalance + totalSavings - creditCardDebt - finalBorrowedDebt;

        return {
            liquidBalance: Math.round(liquidBalance * 100) / 100,
            bankBalance: Math.round(bankBalance * 100) / 100,
            cashBalance: Math.round(cashBalance * 100) / 100,
            totalSavings: Math.round(totalSavings * 100) / 100,
            creditCardDebt: Math.round(creditCardDebt * 100) / 100,
            borrowedDebt: Math.round(finalBorrowedDebt * 100) / 100,
            netWorth: Math.round(netWorth * 100) / 100,
            sharedBalances,
            accountBalances
        };
    }, [state.transactions, state.accounts, state.cash_balance, state.savings]);


    useEffect(() => {
        if (isAuthenticated && state.cloud_sheet_url) {
            console.log("Auto-pulling from cloud for user:", user);
            pullFromCloud(state.cloud_sheet_url);
        }
    }, [isAuthenticated, user]);

    return (
        <FinanceContext.Provider value={{ state, addTransaction, updateTransaction, deleteTransaction, updateSettings, pushToCloud, pullFromCloud, calculations }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
    return context;
};
