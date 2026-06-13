import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
  Loader2 } from
'lucide-react';
import { contractService, Contract } from '../../api/services';

export function BuyerDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contractService.getContracts()
      .then(data => setContracts(data))
      .catch(err => {
        console.error('Failed to fetch buyer contracts', err);
        setError('Could not load your contracts. Please try again later.');
        setContracts([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
  {
    label: 'Active Contracts',
    value: contracts.filter(c => c.status === 'active').length.toString(),
    icon: FileText,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    label: 'Pending Offers',
    value: contracts.filter(c => c.status === 'pending').length.toString(),
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    label: 'Completed',
    value: contracts.filter(c => c.status === 'completed').length.toString(),
    icon: CheckCircle,
    color: 'bg-green-100 text-green-600'
  },
  {
    label: 'Total Spent',
    value: `$${contracts.reduce((acc, curr) => {
      const p = curr.totalPrice.match(/[\d,.]+/);
      return acc + (p ? parseFloat(p[0].replace(/,/g, '')) : 0);
    }, 0).toLocaleString()}`,
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-600'
  }];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-500">
            Manage your agricultural contracts and logistics.
          </p>
        </div>
        <Link
          to="/buyer/create-contract"
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm">
          
          <Plus size={20} />
          Create New Contract
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) =>
        <div
          key={i}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
            <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
            
              <stat.icon size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        )}
      </div>

      {/* Recent Contracts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Contracts</h2>
          <Link
            to="/buyer/contracts"
            className="text-primary font-medium text-sm flex items-center gap-1 hover:underline">
            
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        {contracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No contracts found. Start by creating a new contract!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Quantity</th>
                  <th className="p-4 font-medium">Total Price</th>
                  <th className="p-4 font-medium">Timeline</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) =>
                <tr
                  key={contract.id}
                  className="hover:bg-gray-50 transition-colors">
                  
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                        src={contract.productImage}
                        alt={contract.product}
                        className="w-10 h-10 rounded-lg object-cover" />
                      
                        <div>
                          <p className="font-medium text-gray-900">
                            {contract.product}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {contract.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{contract.quantity}</td>
                    <td className="p-4 font-medium text-gray-900">
                      {contract.totalPrice}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {contract.timeline}
                    </td>
                    <td className="p-4">
                      <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${contract.status === 'active' ? 'bg-green-100 text-green-700' : contract.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      
                        {contract.status}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}