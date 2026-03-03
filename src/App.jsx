// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            style: {
              background: '#0d1525',
              color: '#e2e8f0',
              border: '1px solid #1e3a5f',
              borderRadius: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#00ff88', secondary: '#000' },
              style: { borderColor: 'rgba(0,255,136,0.3)' },
            },
            error: {
              iconTheme: { primary: '#ff3366', secondary: '#fff' },
              style: { borderColor: 'rgba(255,51,102,0.3)' },
            },
            loading: {
              iconTheme: { primary: '#00f5ff', secondary: '#000' },
            },
            duration: 4000,
          }}
        />
      </GameProvider>
    </AuthProvider>
  );
}
