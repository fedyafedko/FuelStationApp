// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import FuelRequestWaitingScreen from '../screens/FuelRequestWaitingScreen';

import ProtectedRoute from './ProtectedRoute';
import ProfileScreen from '../screens/profile/ProfileScreen';

export default function AppRouter() {
  const { isAuthenticated, _hasRehydrated } = useAuthStore();

  if (!_hasRehydrated) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/sign-in"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignInScreen />
          }
        />
        <Route
          path="/sign-up"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignUpScreen />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />

        {/* Fuel request waiting page */}
        <Route
          path="/fuel-request-waiting/:requestId"
          element={
            <ProtectedRoute>
              <FuelRequestWaitingScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}