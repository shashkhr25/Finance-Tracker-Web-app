import { AuthProvider } from './context/AuthContext';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { FinanceProvider } from './context/FinanceContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  </StrictMode>,
)
