import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  IndianRupee,
  Plus,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

export function BuyerDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = user?.id || localStorage.getItem('mock_user_id') || 'unknown';
    const userEmail = user?.email || localStorage.getItem('mock_user_email') || '';
    const localKey = `buyer_contracts_${userId}`;
    const storedLocal = localStorage.getItem(localKey);

    if (storedLocal !== null) {
      // User has an initialized contract list for their account
      const parsed: Contract[] = JSON.parse(storedLocal).map(sanitizeContract);
      setContracts(parsed);
      setIsLoading(false);
    } else {
      // First time viewing dashboard for this buyer account
      if (userEmail === 'buyer@farming.com' || userId === 'u3') {
        contractService
          .getContracts()
          .then((data) => {
            const sanitized = (data || []).map(sanitizeContract);
            localStorage.setItem(localKey, JSON.stringify(sanitized));
            setContracts(sanitized);
          })
          .catch(() => {
            localStorage.setItem(localKey, JSON.stringify([]));
            setContracts([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        // NEW BUYER -> Initialize with ZERO contracts (Nill & Zero Spent)
        localStorage.setItem(localKey, JSON.stringify([]));
        setContracts([]);
        setIsLoading(false);
      }
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting contract', id);
      await contractService.deleteContract(id);
      
      const userId = user?.id || localStorage.getItem('mock_user_id') || 'unknown';
      const localKey = `buyer_contracts_${userId}`;
      
      setContracts(prev => {
        const filtered = prev.filter(c => c.id !== id);
        // Force direct local storage update to ensure state persistence
        localStorage.setItem(localKey, JSON.stringify(filtered));
        return filtered;
      });
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeContracts = contracts.filter((c) => c.status === 'active');
  const pendingOffers = contracts.filter((c) => c.status === 'pending');
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  const totalSpent = contracts.reduce((acc, curr) => {
    if (!curr.totalPrice || curr.totalPrice === 'TBD') return acc;
    const match = curr.totalPrice.replace(/\$/g, '').match(/[\d,.]+/);
    return acc + (match ? parseFloat(match[0].replace(/,/g, '')) : 0);
  }, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-500">
            Manage your agricultural contracts and logistics.
          </p>
        </div>

        <Link
          to="/buyer/create-contract"
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Create New Contract
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {activeContracts.length}
            </p>
            <p className="text-sm font-medium text-gray-500">
              Active Contracts
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {pendingOffers.length}
            </p>
            <p className="text-sm font-medium text-gray-500">Pending Offers</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {completedContracts.length}
            </p>
            <p className="text-sm font-medium text-gray-500">Completed</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ₹{totalSpent.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Contracts</h2>
          <Link
            to="/buyer/contracts"
            className="text-primary font-medium text-sm hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {contracts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Total Price</th>
                  <th className="py-4 px-6">Timeline</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                      <img
                        src={contract.productImage}
                        alt={contract.product}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold">{contract.product}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {contract.category}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">{contract.quantity}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {contract.totalPrice?.replace(/\$/g, '₹')}
                    </td>
                    <td className="py-4 px-6">{contract.timeline}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          contract.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : contract.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Delete Contract"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No contracts yet
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                You haven't created any agricultural contracts. Post a new requirement to connect with local farmers.
              </p>
              <Link
                to="/buyer/create-contract"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <Plus size={18} /> Create Your First Contract
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}