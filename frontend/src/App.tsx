import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import { BuyerDashboard } from './pages/buyer/Dashboard';
import { CreateContract } from './pages/buyer/CreateContract';
import { FarmerMarketplace } from './pages/farmer/Marketplace';
import { FarmerContractDetail } from './pages/farmer/ContractDetail';
import { FarmerDashboard } from './pages/farmer/Dashboard';
import { SellProduct } from './pages/farmer/SellProduct';
import { Chat } from './pages/Chat';
import { PaymentStatus } from './pages/PaymentStatus';
import { AdminDashboard } from './pages/admin/Dashboard';
// Protected Route Wrapper
function ProtectedRoute({
  children,
  allowedRole



}: {children: React.ReactNode;allowedRole?: 'buyer' | 'farmer' | 'admin';}) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'buyer' ? '/buyer/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/farmer/dashboard'}
        replace />);


  }
  return <>{children}</>;
}
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - No Layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />


      {/* Protected Routes - Wrapped in Layout */}
      <Route
        path="/buyer/*"
        element={
          <ProtectedRoute allowedRole="buyer">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<BuyerDashboard />} />
                <Route path="create-contract" element={<CreateContract />} />
                <Route path="contracts" element={<BuyerDashboard />} />
                <Route path="payments" element={<PaymentStatus />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/*"
        element={
          <ProtectedRoute allowedRole="farmer">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="marketplace" element={<FarmerMarketplace />} />
                <Route path="contract/:id" element={<FarmerContractDetail />} />
                <Route path="sell" element={<SellProduct />} />
                <Route path="payments" element={<PaymentStatus />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="admin">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <Chat />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>);

}