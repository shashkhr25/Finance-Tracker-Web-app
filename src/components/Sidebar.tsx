import { useAuth } from '../context/AuthContext';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

const Sidebar: React.FC = () => {
    const { state, pushToCloud } = useFinance();
        const { logout, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        if (isAuthenticated && state.cloud_sheet_url) {
            console.log("Syncing to cloud before logout...");
            await pushToCloud();
        }
        logout();
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">MoneyTracker</div>
            
            <div className="user-profile">
                {state.user}
            </div>

            <ul className="nav-menu">
                <li className="nav-item">
                    <NavLink to="/" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">📊</span>
                        <span className="nav-text">Dashboard</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/transactions" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">📜</span>
                        <span className="nav-text">Transactions</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/categories" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">📁</span>
                        <span className="nav-text">Categories</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/shared" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">👥</span>
                        <span className="nav-text">Shared</span>
                    </NavLink>
                </li>
                <li className="nav-item desktop-only">
                    <NavLink to="/networth" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">💰</span>
                        <span className="nav-text">Networth</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/settings" className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active" : "nav-link"}>
                        <span className="nav-icon">⚙️</span>
                        <span className="nav-text">Settings</span>
                    </NavLink>
                </li>
            </ul>

            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-switch" onClick={handleLogout} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    Logout / Switch User
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
