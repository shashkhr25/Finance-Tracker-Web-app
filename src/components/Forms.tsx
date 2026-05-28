import React, { useState } from 'react';
import type { Transaction } from '../types/finance';

interface TransactionFormProps {
    type: 'income' | 'expense';
    categories: string[];
    accounts: { name: string }[];
    devices: string[];
    initialData?: Partial<Transaction>;
    onSubmit: (data: Omit<Transaction, 'id' | 'timestamp'>) => void;
    onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, categories, accounts, devices, initialData, onSubmit, onCancel }) => {
    const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(initialData?.category || categories[0] || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [account, setAccount] = useState(initialData?.account || accounts[0]?.name || '');
    const [device, setDevice] = useState(initialData?.device || devices[0] || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subType = device.startsWith('CREDIT_CARD') ? 'credit_card_expense' : 'regular';
        const effectsBalance = !device.startsWith('CREDIT_CARD');

        onSubmit({
            tx_type: type,
            sub_type: subType,
            amount: parseFloat(amount),
            date,
            category,
            description: desc,
            account,
            device,
            effects_balance: type === 'income' ? true : effectsBalance
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>{type === 'expense' ? 'Category' : 'Source'}</label>
                    <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Description</label>
                <input type="text" className="form-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={type === 'expense' ? "What was this for?" : "Where did this come from?"} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Account</label>
                    <select className="form-select" value={account} onChange={(e) => setAccount(e.target.value)}>
                        {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Device</label>
                    <select className="form-select" value={device} onChange={(e) => setDevice(e.target.value)}>
                        {devices.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-success">Save {type === 'expense' ? 'Expense' : 'Income'}</button>
            </div>
        </form>
    );
};

interface BasketFormProps {
    accounts: { name: string }[];
    devices: string[];
    onSubmit: (items: { desc: string; amount: number }[], common: Partial<Transaction>) => void;
    onCancel: () => void;
}

export const BasketForm: React.FC<BasketFormProps> = ({ accounts, devices, onSubmit, onCancel }) => {
    const [total, setTotal] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [account, setAccount] = useState(accounts[0].name);
    const [device, setDevice] = useState(devices[0]);
    const [items, setItems] = useState([{ desc: '', amount: '' }]);

    const addItem = () => setItems([...items, { desc: '', amount: '' }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: 'desc' | 'amount', value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const common = {
            tx_type: 'expense' as const,
            sub_type: device.startsWith('CREDIT_CARD') ? 'credit_card_expense' as const : 'regular' as const,
            date,
            account,
            device,
            effects_balance: !device.startsWith('CREDIT_CARD')
        };
        onSubmit(items.map(it => ({ desc: it.desc, amount: parseFloat(it.amount) })), common);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Total Paid (₹)</label>
                <input type="number" className="form-input" value={total} onChange={(e) => setTotal(e.target.value)} step="0.01" required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Account</label>
                    <select className="form-select" value={account} onChange={(e) => setAccount(e.target.value)}>
                        {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Main Device</label>
                <select className="form-select" value={device} onChange={(e) => setDevice(e.target.value)}>
                    {devices.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="basket-items-list">
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Basket Items</h4>
                {items.map((item, index) => (
                    <div key={index} className="basket-item-row">
                        <input type="text" className="form-input" value={item.desc} onChange={(e) => updateItem(index, 'desc', e.target.value)} placeholder="Item name" required />
                        <input type="number" className="form-input" value={item.amount} onChange={(e) => updateItem(index, 'amount', e.target.value)} placeholder="Amount" step="0.01" required />
                        {index > 0 && <span className="modal-close" onClick={() => removeItem(index)} style={{ fontSize: '1rem' }}>&times;</span>}
                        {index === 0 && <span></span>}
                    </div>
                ))}
            </div>
            <button type="button" className="btn-add-item" onClick={addItem}>+ Add Another Item</button>
            <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-success">Process Basket</button>
            </div>
        </form>
    );
};

export const CashForm: React.FC<{ onSubmit: (amount: number) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
    const [amount, setAmount] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(parseFloat(amount)); }}>
            <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                This will record a cash withdrawal from your main bank account.
            </p>
            <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-success">Withdraw Cash</button>
            </div>
        </form>
    );
};
