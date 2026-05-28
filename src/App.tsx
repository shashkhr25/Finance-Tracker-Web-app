import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CategoryTotals from './pages/CategoryTotals';
import SharedExpenses from './pages/SharedExpenses';
import NetWorth from './pages/NetWorth';
import Settings from './pages/Settings';


const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={
        <AuthGuard>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<CategoryTotals />} />
              <Route path="/shared" element={<SharedExpenses />} />
              <Route path="/networth" element={<NetWorth />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </AuthGuard>
      } />
    </Routes>
    
  );
}

export default App;
