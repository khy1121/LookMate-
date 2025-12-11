import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Closet } from './pages/Closet';
import { Upload } from './pages/Upload';
import { Avatar } from './pages/Avatar';
import { Fitting } from './pages/Fitting';
import { Explore } from './pages/Explore';
import { Discover } from './pages/Discover';
import { LookDetail } from './pages/LookDetail';
import { NotFound } from './pages/NotFound';
import { useStore } from './store/useStore';

export const App = () => {
  const loadInitialUserAndData = useStore((state) => state.loadInitialUserAndData);

  // Initialize user session on app load
  useEffect(() => {
    loadInitialUserAndData();
  }, [loadInitialUserAndData]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/look/:publicId" element={<LookDetail />} />

      {/* Private Routes - Protected */}
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
        <Route path="explore" element={<Explore />} />
        <Route path="discover" element={<Discover />} />
      </Route>
      
      {/* 404 Not Found - Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};