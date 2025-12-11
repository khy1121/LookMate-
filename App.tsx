import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Closet } from './pages/Closet';
import { Upload } from './pages/Upload';
import { Avatar } from './pages/Avatar';
import { Fitting } from './pages/Fitting';
import { useStore } from './store/useStore';

// 인증 보호용 Wrapper (간단 버전)
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Private Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="closet" element={<Closet />} />
        <Route path="upload" element={<Upload />} />
        <Route path="avatar" element={<Avatar />} />
        <Route path="fitting" element={<Fitting />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};