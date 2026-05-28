import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const SharedExpenses: React.FC = () => {
    const { state, calculations } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

    const balances = calculations.sharedBalances;
    const netPosition = Object.values(balances).reduce((sum, val) => sum + val, 0);

    // Filter participants based on search term
    const filteredParticipants = state.participants.filter(p => 
        p.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group relevant transactions for the selected person
    const getPersonTransactions = (person: string) => {
        return state.transactions.filter(tx => {
            if (tx.shared_flag && tx.shared_splits?.some(s => s.name.toLowerCase() === person.toLowerCase())) {
                return true;
            }
            return false;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    return (
        <>
            <div className="dashboard-grid">
                <div className="stat-card" style={{ textAlign: 'left' }}>
                    <div className="stat-label">Net Shared Position</div>
                    <div className={`stat-value ${netPosition >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '3.5rem' }}>
                        {netPosition >= 0 ? '+' : ''}₹{netPosition.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="stat-sub-details" style={{ fontSize: '0.9rem' }}>Overall balance across all participants</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'left' }}>
                    <div className="stat-label">Filter by Person</div>
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type a person's name..." 
                        style={{ margin: '1rem 0' }} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <a href="#" className="see-all" style={{ display: "block", textAlign: "center" }} onClick={(e) => { e.preventDefault(); setSearchTerm(''); setSelectedPerson(null); }}>Clear Search</a>
                </div>
            </div>

            <h2 className="section-title">{selectedPerson ? `Details for ${selectedPerson}` : 'Participant Summaries'}</h2>
            
            <div className="participant-list">
                {!selectedPerson ? (
                    filteredParticipants.map(person => {
                        const amount = balances[person] || 0;
                        return (
                            <div key={person} className={`participant-item ${amount > 10000 ? 'highlight' : ''}`}>
                                <div className="participant-info">
                                    <div className="participant-name">{person}</div>
                                    <div className="participant-status">{amount >= 0 ? 'You should receive' : 'You owe'}</div>
                                </div>
                                <div>
                                    <div className="participant-amount">{amount >= 0 ? '+' : ''}₹{Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    <a href="#" className="participant-details" onClick={(e) => { e.preventDefault(); setSelectedPerson(person); }}>Details &gt;</a>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <>
                        <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setSelectedPerson(null)}>&lt; Back to Summary</button>
                        <div className="activity-list">
                            {getPersonTransactions(selectedPerson).map((tx, idx) => {
                                const split = tx.shared_splits?.find(s => s.name.toLowerCase() === selectedPerson.toLowerCase());
                                // Default split if not specified
                                const share = split?.amount || (tx.amount / (tx.shared_splits?.length || 1));
                                const isOwedToUser = tx.tx_type === 'expense' && tx.device !== 'DEBT_BORROWED';
                                
                                return (
                                    <div key={idx} className="activity-item">
                                        <div className="activity-date">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                        <div className="activity-info">
                                            <div className="activity-title">{tx.category}</div>
                                            <div className="activity-desc">{tx.description}</div>
                                        </div>
                                        <div className="activity-meta">
                                            <div className={`activity-amount ${!isOwedToUser ? 'amount-negative' : 'amount-positive'}`}>
                                                {!isOwedToUser ? '-' : '+'}₹{share.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {getPersonTransactions(selectedPerson).length === 0 && <p>No transactions found for this participant.</p>}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default SharedExpenses;
