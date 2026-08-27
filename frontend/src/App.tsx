import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import { BuyerDashboard } from './pages/buyer/Dashboard';
import { CreateContract } from './pages/buyer/CreateContract';
import { FarmerDetailsDashboard } from './pages/buyer/FarmerDetailsDashboard';
import { FarmerMarketplace } from './pages/farmer/Marketplace';
import { FarmerContractDetail } from './pages/farmer/ContractDetail';
import { FarmerDashboard } from './pages/farmer/Dashboard';
import { BuyerDetailsDashboard } from './pages/farmer/BuyerDetailsDashboard';
import { SellProduct } from './pages/farmer/SellProduct';
import { OrdersDashboard } from './pages/OrdersDashboard';
import { PaymentsDashboard } from './pages/PaymentsDashboard';

// Protected Route Wrapper
function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: 'buyer' | 'farmer';
}) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'buyer' ? '/buyer/dashboard' : '/farmer/dashboard'}
        replace
      />
    );
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
                <Route path="farmers" element={<FarmerDetailsDashboard />} />
                <Route path="create-contract" element={<CreateContract />} />
                <Route path="contracts" element={<BuyerDashboard />} />
                <Route path="orders" element={<OrdersDashboard />} />
                <Route path="payments" element={<PaymentsDashboard />} />
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
                <Route path="buyers" element={<BuyerDetailsDashboard />} />
                <Route path="marketplace" element={<FarmerMarketplace />} />
                <Route path="contract/:id" element={<FarmerContractDetail />} />
                <Route path="sell" element={<SellProduct />} />
                <Route path="orders" element={<OrdersDashboard />} />
                <Route path="payments" element={<PaymentsDashboard />} />
              </Routes>
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
    </AuthProvider>
  );
}