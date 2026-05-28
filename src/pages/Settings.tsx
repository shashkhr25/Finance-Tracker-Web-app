import { useAuth } from '../context/AuthContext';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from '../components/Modal';
import * as googleSheets from '../services/googleSheetsService';

const Settings: React.FC = () => {
    const { state, updateSettings, pushToCloud, pullFromCloud } = useFinance();
        const { logout, googleLogin, isAuthenticated: isAuth } = useAuth();

    const handleLogout = async () => {
        if (isAuth && state.cloud_sheet_url) {
            setSyncStatus('Syncing to cloud before logout...');
            await pushToCloud();
        }
        logout();
    };
    const [cash, setCash] = useState('');
    const [accounts, setAccounts] = useState('');
    const [devices, setDevices] = useState('');
    const [income, setIncome] = useState('');
    const [participants, setParticipants] = useState('');
    const [cloudUrl, setCloudUrl] = useState('');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [savingsData, setSavingsData] = useState({ general: '', fd: '', rd: '', gold: '' });
    const [syncStatus, setSyncStatus] = useState<string>('');
    

    useEffect(() => {
        setCash(state.cash_balance.toFixed(2));
        setAccounts(state.accounts.map(a => `${a.name}: ${a.balance.toFixed(2)}`).join('\n'));
        setDevices(state.payment_devices.join('\n'));
        setIncome(state.income_sources.join('\n'));
        setParticipants(state.participants.join('\n'));
        setCloudUrl(state.cloud_sheet_url || '');
        setSavingsData({
            general: state.savings.general.toString(),
            fd: state.savings.fd.toString(),
            rd: state.savings.rd.toString(),
            gold: state.savings.gold.toString()
        });
    }, [state]);

    const handleSave = () => {
        const newAccounts = accounts.split('\n').filter(s => s.trim()).map(line => {
            const [name, bal] = line.split(':').map(p => p.trim());
            return { name, balance: parseFloat(bal) || 0, is_main: name === 'HDFC' };
        });

        updateSettings({
            cash_balance: parseFloat(cash),
            accounts: newAccounts,
            payment_devices: devices.split('\n').filter(s => s.trim()),
            income_sources: income.split('\n').filter(s => s.trim()),
            participants: participants.split('\n').filter(s => s.trim()),
            cloud_sheet_url: cloudUrl
        });

        alert('Settings saved locally!');
    };

    const handleGoogleLogin = () => {
        const client = googleSheets.initGoogleAuth(async (token) => {
            if (token) {
                await googleLogin(token);
                setSyncStatus('Authenticated with Google');
            }
        });
        client.requestAccessToken();
    };

    const handlePush = async () => {
        if (!isAuth) {
            alert('Please login with Google first');
            return;
        }
        setSyncStatus('Pushing data to cloud...');
        const success = await pushToCloud(cloudUrl);
        setSyncStatus(success ? 'Successfully pushed to cloud!' : 'Failed to push to cloud.');
    };

    const handlePull = async () => {
        if (!isAuth) {
            alert('Please login with Google first');
            return;
        }
        setSyncStatus('Pulling data from cloud...');
        const success = await pullFromCloud(cloudUrl);
        setSyncStatus(success ? 'Successfully pulled from cloud!' : 'Failed to pull. Check if Transactions/Settings worksheets exist in the sheet.');
    };

    const handleAddCategory = () => {
        if (!newCategory) return;
        if (categoryType === 'expense') {
            updateSettings({ expense_categories: [...state.expense_categories, newCategory] });
        } else {
            updateSettings({ income_sources: [...state.income_sources, newCategory] });
        }
        setNewCategory('');
    };

    const handleRemoveCategory = (cat: string, type: 'expense' | 'income') => {
        if (type === 'expense') {
            updateSettings({ expense_categories: state.expense_categories.filter(c => c !== cat) });
        } else {
            updateSettings({ income_sources: state.income_sources.filter(c => c !== cat) });
        }
    };

    const handleSaveSavings = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings({
            savings: {
                general: parseFloat(savingsData.general) || 0,
                fd: parseFloat(savingsData.fd) || 0,
                rd: parseFloat(savingsData.rd) || 0,
                gold: parseFloat(savingsData.gold) || 0
            }
        });
        setIsSavingsModalOpen(false);
    };

    return (
        <>
            <div className="settings-section">
                <h2 className="settings-title">Financial Configuration</h2>
                <div className="form-group">
                    <label>Cash Balance</label>
                    <input type="text" className="form-input" value={cash} onChange={(e) => setCash(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Accounts (Name: Balance)</label>
                    <textarea className="form-textarea" value={accounts} onChange={(e) => setAccounts(e.target.value)}></textarea>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-title">Transaction Options</h2>
                <div className="form-group">
                    <label>Payment Devices</label>
                    <textarea className="form-textarea" value={devices} onChange={(e) => setDevices(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                    <label>Income Sources</label>
                    <textarea className="form-textarea" value={income} onChange={(e) => setIncome(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                    <label>Shared Participants</label>
                    <textarea className="form-textarea" value={participants} onChange={(e) => setParticipants(e.target.value)}></textarea>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-title">Google Sheets Synchronization</h2>
                <div className="form-group">
                    <label>Google Sheet URL</label>
                    <div className="input-with-action">
                        <input type="text" className="form-input" value={cloudUrl} onChange={(e) => setCloudUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
                        {!isAuth ? (
                            <button className="btn-secondary" onClick={handleGoogleLogin}>Login with Google</button>
                        ) : (
                            <span style={{ color: '#27ae60', fontWeight: 'bold', marginLeft: '1rem' }}>Authenticated</span>
                        )}
                    </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-success" style={{ flex: 1 }} onClick={handlePush} disabled={!isAuth || !cloudUrl}>Push to Cloud</button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={handlePull} disabled={!isAuth || !cloudUrl}>Pull from Cloud</button>
                </div>
                {syncStatus && <p style={{ fontSize: '0.9rem', color: syncStatus.includes('Failed') ? '#e74c3c' : '#27ae60' }}>{syncStatus}</p>}
            </div>

            <div className="quick-actions" style={{ marginTop: '3rem' }}>
                <a href="#" className="qa-btn qa-basket" style={{ backgroundColor: '#f0f4ff', color: 'var(--color-blue)' }} onClick={(e) => { e.preventDefault(); setIsCategoryModalOpen(true); }}>Manage Categories</a>
                <a href="#" className="qa-btn qa-income" style={{ backgroundColor: '#e5f9e0', color: '#27ae60' }} onClick={(e) => { e.preventDefault(); setIsSavingsModalOpen(true); }}>Edit Initial Savings</a>
                <a href="#" className="qa-btn qa-expense" style={{ backgroundColor: '#fff9ed', color: '#b07e2e' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}>Switch User</a>
                <button className="qa-btn qa-income" style={{ backgroundColor: '#5bbd8c', color: 'white', border: 'none', cursor: 'pointer' }} onClick={handleSave}>Save Settings</button>
            </div>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Manage Categories">
                <div className="form-group">
                    <label>Add New Category</label>
                    <div className="input-with-action">
                        <input type="text" className="form-input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name..." />
                        <select className="form-select" style={{ width: 'auto' }} value={categoryType} onChange={(e) => setCategoryType(e.target.value as 'expense' | 'income')}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <button className="btn-success" onClick={handleAddCategory}>Add</button>
                    </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <h4>Expense Categories</h4>
                    <div className="activity-list" style={{ marginBottom: '1rem' }}>
                        {state.expense_categories.map(cat => (
                            <div key={cat} className="activity-item" style={{ padding: '0.8rem 1.2rem' }}>
                                <div className="activity-info">{cat}</div>
                                <span className="modal-close" onClick={() => handleRemoveCategory(cat, 'expense')}>&times;</span>
                            </div>
                        ))}
                    </div>
                    <h4>Income Sources</h4>
                    <div className="activity-list">
                        {state.income_sources.map(cat => (
                            <div key={cat} className="activity-item" style={{ padding: '0.8rem 1.2rem' }}>
                                <div className="activity-info">{cat}</div>
                                <span className="modal-close" onClick={() => handleRemoveCategory(cat, 'income')}>&times;</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSavingsModalOpen} onClose={() => setIsSavingsModalOpen(false)} title="Edit Initial Savings">
                <form onSubmit={handleSaveSavings}>
                    <div className="form-group">
                        <label>General Savings</label>
                        <input type="number" className="form-input" value={savingsData.general} onChange={(e) => setSavingsData({ ...savingsData, general: e.target.value })} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Fixed Deposits</label>
                        <input type="number" className="form-input" value={savingsData.fd} onChange={(e) => setSavingsData({ ...savingsData, fd: e.target.value })} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Recurring Deposits</label>
                        <input type="number" className="form-input" value={savingsData.rd} onChange={(e) => setSavingsData({ ...savingsData, rd: e.target.value })} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Gold Assets</label>
                        <input type="number" className="form-input" value={savingsData.gold} onChange={(e) => setSavingsData({ ...savingsData, gold: e.target.value })} step="0.01" />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setIsSavingsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-success">Save</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Settings;
