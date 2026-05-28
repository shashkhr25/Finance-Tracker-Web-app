import React, { type ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <>
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </>
    );
};

export default Layout;
