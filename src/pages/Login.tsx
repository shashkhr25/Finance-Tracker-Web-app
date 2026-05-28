import { initGoogleAuth } from '../services/googleSheetsService';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const { login, availableUsers, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        const client = initGoogleAuth(async (token) => {
            if (token) {
                await googleLogin(token);
                navigate('/');
            }
        });
        client.requestAccessToken();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            login(username.trim());
            navigate('/');
        }
    };

    const handleSelectUser = (user: string) => {
        login(user);
        navigate('/');
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Login to Finance Tracker</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Login / Create
                </button>
            </form>
            <div style={{ marginTop: '15px' }}>
                <button 
                    onClick={handleGoogleLogin}
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: 'white', 
                        color: '#374151', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                    Sign in with Google
                </button>
            </div>

            {availableUsers.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Recent Users</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {availableUsers.map(u => (
                            <button
                                key={u}
                                onClick={() => handleSelectUser(u)}
                                style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
