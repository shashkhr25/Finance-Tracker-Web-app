import { setAccessToken, getUserInfo } from '../services/googleSheetsService';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    user: string | null;
    login: (username: string) => void;
    logout: () => void;
    availableUsers: string[];
    isAuthenticated: boolean;
    googleLogin: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'money_tracker_current_user';
const ALL_USERS_KEY = 'money_tracker_all_users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<string | null>(() => {
        return localStorage.getItem(USER_STORAGE_KEY);
    });

    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<string[]>(() => {
        const saved = localStorage.getItem(ALL_USERS_KEY);
        return saved ? JSON.parse(saved) : ['shashwat'];
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, user);
            if (!availableUsers.includes(user)) {
                const newUsers = [...availableUsers, user];
                setAvailableUsers(newUsers);
                localStorage.setItem(ALL_USERS_KEY, JSON.stringify(newUsers));
            }
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, [user, availableUsers]);

    const googleLogin = async (token: string) => {
        setAccessToken(token);
            setIsGoogleAuth(true);
        const userInfo = await getUserInfo(token);
        if (userInfo && (userInfo.name || userInfo.email)) {
            const username = userInfo.name || userInfo.email.split('@')[0];
            setUser(username);
        }
    };

    const login = (username: string) => {
        setUser(username);
    };

    const logout = () => {
        setUser(null);
        setIsGoogleAuth(false);
        setAccessToken('');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, availableUsers, googleLogin, isAuthenticated: isGoogleAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
