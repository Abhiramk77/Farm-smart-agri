import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, FileText, Loader2, Trash2, Database, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contractService, Contract, sanitizeContract } from '../api/services';
import { useAuth } from '../context/AuthContext';

export function OrdersDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTestDoc, setIsCreatingTestDoc] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Load initial contracts from Firestore
    contractService
      .getContracts()
      .then((data) => {
        const sanitized = (data || []).map(sanitizeContract);
        setContracts(sanitized);
      })
      .catch((err) => {
        console.error('Failed to load Firestore contracts:', err);
      })
      .finally(() => setIsLoading(false));

    // Subscribe to live updates from Cloud Firestore 'orders' collection
    unsubscribe = contractService.subscribeUserOrders((updatedOrders) => {
      const sanitized = (updatedOrders || []).map(sanitizeContract);
      setContracts(sanitized);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await contractService.deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Failed to delete order from Firestore:', e);
    }
  };

  const handleAddTestOrder = async () => {
    setIsCreatingTestDoc(true);
    try {
      const userId = user?.id || localStorage.getItem('mock_user_id') || 'u_test';
      const userName = user?.name || localStorage.getItem('mock_user_name') || 'Smart Agri User';

      const sampleProducts = [
        { name: 'Organic Fresh Tomatoes', category: 'agriculture', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400', price: '₹40/kg', qty: '250 kg', total: '₹10,000' },
        { name: 'Pure Raw Milk', category: 'dairy', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400', price: '₹50/L', qty: '500 L', total: '₹25,000' },
        { name: 'Fresh Atlantic Salmon', category: 'aquaculture', img: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=400', price: '₹350/kg', qty: '100 kg', total: '₹35,000' },
      ];
      const randomItem = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];

      const newOrder: Partial<Contract> = {
        id: `ord_${Date.now()}`,
        buyerId: userId,
        buyerName: userName,
        buyerRating: 4.9,
        category: randomItem.category,
        product: randomItem.name,
        productImage: randomItem.img,
        quantity: randomItem.qty,
        quality: 'Grade A Premium',
        price: randomItem.price,
        totalPrice: randomItem.total,
        timeline: 'Immediate Delivery',
        deliveryLocation: 'Firestore Central Hub',
        distance: '10 km',
        transportIncluded: true,
        status: 'pending',
      };

      await contractService.createContract(newOrder);
    } catch (e) {
      console.error('Failed to create Firestore order:', e);
    } finally {
      setIsCreatingTestDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const userId = user?.id || localStorage.getItem('mock_user_id') || '';
  const userName = user?.name || localStorage.getItem('mock_user_name') || '';
  const userRole = user?.role || localStorage.getItem('mock_role') || 'farmer';
  const userEmail = user?.email || localStorage.getItem('mock_user_email') || '';

  // Scope contracts strictly to the logged-in account
  const acceptedContracts = contracts.filter((c) => {
    const isAccepted = c.status === 'active' || c.status === 'completed';
    if (!isAccepted) return false;

    if (userRole === 'buyer') {
      return (
        (c.buyerId && (c.buyerId === userId || c.buyerId === userEmail)) ||
        (c.buyerName && c.buyerName.toLowerCase() === userName.toLowerCase())
      );
    }

    // Farmer Role
    const acceptedIdsKey = `accepted_contracts_${userId}`;
    const myAcceptedIds: string[] = JSON.parse(
      localStorage.getItem(acceptedIdsKey) || '[]'
    );

    const matchesFarmerId = c.farmerId && (c.farmerId === userId || c.farmerId === userEmail);
    const matchesFarmerName = c.farmerName && c.farmerName.toLowerCase() === userName.toLowerCase();
    const isLocallyAccepted = myAcceptedIds.includes(c.id);

    if (c.farmerId || c.farmerName) {
      return matchesFarmerId || matchesFarmerName || isLocallyAccepted;
    }
    return isLocallyAccepted;
  });

  const activeCount = acceptedContracts.filter((c) => c.status === 'active').length;
  const completedCount = acceptedContracts.filter((c) => c.status === 'completed').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Top Banner */}
      <div className="mb-6 bg-gradient-to-r from-emerald-950 via-green-900 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
          <Database size={180} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Orders Dashboard</h1>
            <p className="text-emerald-100/80 text-sm mt-1">
              Displaying contracts accepted by farmer{' '}
              <span className="font-semibold text-white">
                {user?.name || localStorage.getItem('mock_user_name') || 'Farmer'}
              </span>.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{acceptedContracts.length}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Accepted Orders</p>
          </div>
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <CheckCircle size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{activeCount}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
          </div>
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{completedCount}</p>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed Deliveries</p>
          </div>
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <CheckCircle size={32} />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Accepted Orders Overview</h2>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            {acceptedContracts.length} Accepted Orders
          </span>
        </div>
        <div className="overflow-x-auto">
          {acceptedContracts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Product / Details</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Total Price</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {acceptedContracts.map((contract) => {
                  const isCompleted = contract.status === 'completed';
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                        <img src={contract.productImage} alt={contract.product} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        <div>
                          <p className="font-bold text-[15px]">{contract.product}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">
                            ID: <span className="font-mono text-gray-700">{contract.id}</span> • {contract.category}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium">{contract.quantity}</td>
                      <td className="py-4 px-6 font-bold text-gray-900">{contract.totalPrice?.replace(/\$/g, '₹')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {isCompleted ? 'Completed' : 'Accepted'}
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
              <p className="text-lg font-medium text-gray-900 mb-1">No accepted orders found.</p>
              <p className="text-sm text-gray-500">Accepted contract offers will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

