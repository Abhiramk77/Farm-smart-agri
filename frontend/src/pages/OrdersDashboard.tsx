import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, FileText, Loader2, Trash2 } from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../api/services';
import { useAuth } from '../context/AuthContext';

export function OrdersDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    contractService
      .getContracts()
      .then((data) => {
        const sanitized = (data || []).map(sanitizeContract);
        // If the user is a farmer, they might want to see only contracts relevant to them
        // We'll show all contracts they are involved with or in their category depending on the service.
        setContracts(sanitized);
      })
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await contractService.deleteContract(id);
      
      const userId = user?.id || localStorage.getItem('mock_user_id') || 'unknown';
      const localKey = `buyer_contracts_${userId}`;
      
      setContracts(prev => {
        const filtered = prev.filter(c => c.id !== id);
        localStorage.setItem(localKey, JSON.stringify(filtered)); // Also force save here
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

  // Calculate order statistics
  const accepted = contracts.filter(c => c.status === 'active' || c.status === 'completed').length;
  const rejected = contracts.filter(c => c.status === 'rejected').length;
  const pending = contracts.filter(c => c.status === 'pending').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Track and analyze the status of all your agricultural orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{accepted}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Accepted Orders</p>
          </div>
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <CheckCircle size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{pending}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Orders</p>
          </div>
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{rejected}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Rejected Orders</p>
          </div>
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <XCircle size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">All Orders Overview</h2>
        </div>
        <div className="overflow-x-auto">
          {contracts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Total Price</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {contracts.map((contract) => {
                  const isAccepted = contract.status === 'active' || contract.status === 'completed';
                  const isRejected = contract.status === 'rejected';
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                        <img src={contract.productImage} alt={contract.product} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        <div>
                          <p className="font-bold text-[15px]">{contract.product}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{contract.category}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium">{contract.quantity}</td>
                      <td className="py-4 px-6 font-bold text-gray-900">{contract.totalPrice?.replace(/\$/g, '₹')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                          isAccepted
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : isRejected
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {isAccepted ? 'Accepted' : contract.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Delete Order"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-gray-500">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">No orders found.</p>
              <p className="text-sm">You do not have any orders to display at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
