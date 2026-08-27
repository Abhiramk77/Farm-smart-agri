import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Receipt,
  X,
  FileText,
  Loader2,
  Package,
  AlertCircle,
} from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../api/services';
import { useAuth } from '../context/AuthContext';

interface CodPayment {
  id: string;
  orderId: string;
  product: string;
  category: string;
  productImage: string;
  quantity: string;
  amount: string;
  rawAmount: number;
  deliveryDate: string;
  paymentDate: string;
  status: 'received_post_delivery' | 'pending_delivery';
  buyerName: string;
  paymentMode: 'Cash on Delivery (COD)';
}

export function PaymentsDashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<CodPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'received' | 'pending'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<CodPayment | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const processContractsToCod = (contractsList: Contract[]) => {
      return contractsList.map((c, index) => {
        const numPrice = parseFloat(c.totalPrice?.replace(/[^0-9.-]+/g, '') || '0') || 2500;
        const isDelivered = c.progress === 'delivered' || c.status === 'completed';

        return {
          id: `COD-PAY-${1000 + index + 1}`,
          orderId: c.id,
          product: c.product || 'Agricultural Produce',
          category: c.category || 'Agriculture',
          productImage: c.productImage || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
          quantity: c.quantity || '100 kg',
          amount: c.totalPrice ? c.totalPrice.replace(/\$/g, '₹') : `₹${numPrice.toLocaleString()}`,
          rawAmount: numPrice,
          deliveryDate: c.timeline || '2026-05-10',
          paymentDate: isDelivered ? (c.timeline || '2026-05-10') : 'Upon Delivery',
          status: isDelivered ? ('received_post_delivery' as const) : ('pending_delivery' as const),
          buyerName: c.buyerName || 'Verified Buyer',
          paymentMode: 'Cash on Delivery (COD)' as const,
        };
      });
    };

    const userId = user?.id || localStorage.getItem('mock_user_id') || '';
    const userName = user?.name || localStorage.getItem('mock_user_name') || '';
    const userRole = user?.role || localStorage.getItem('mock_role') || 'farmer';
    const userEmail = user?.email || localStorage.getItem('mock_user_email') || '';

    const loadPayments = (data: Contract[]) => {
      const acceptedOnly = (data || [])
        .map(sanitizeContract)
        .filter((c) => {
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

      setPayments(processContractsToCod(acceptedOnly));
      setIsLoading(false);
    };

    // 1. Load initial Firestore contracts
    contractService
      .getContracts()
      .then((data) => loadPayments(data))
      .catch((err) => {
        console.error('Failed to load Payments from Firestore:', err);
        setPayments([]);
      })
      .finally(() => setIsLoading(false));

    // 2. Real-time subscription for instant Android & Web sync
    unsubscribe = contractService.subscribeUserOrders((updatedOrders) => {
      loadPayments(updatedOrders);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Derived metrics
  const receivedPayments = payments.filter((p) => p.status === 'received_post_delivery');
  const pendingPayments = payments.filter((p) => p.status === 'pending_delivery');

  const totalReceivedAmount = receivedPayments.reduce((sum, p) => sum + p.rawAmount, 0);
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.rawAmount, 0);

  const filteredPayments = payments.filter((p) => {
    if (activeFilter === 'received') return p.status === 'received_post_delivery';
    if (activeFilter === 'pending') return p.status === 'pending_delivery';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const accountName = user?.name || localStorage.getItem('mock_user_name') || 'User';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-sm">
              <Banknote size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Cash on Delivery (COD) Payments
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Showing COD payments for account:{' '}
                <span className="font-semibold text-primary">{accountName}</span> ({user?.role || 'user'})
              </p>
            </div>
          </div>
        </div>

        {/* COD Policy Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold shadow-xs">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
          <span>100% Cash on Delivery — Payment collected in cash after physical delivery</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Cash Received */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Cash Received (Post-Delivery)
            </span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            ₹{totalReceivedAmount.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={14} /> Received in cash for {receivedPayments.length} delivered orders
          </p>
        </div>

        {/* Pending Cash Collection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending Cash Collection
            </span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            ₹{totalPendingAmount.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
            <Clock size={14} /> To be collected in cash upon delivery ({pendingPayments.length} orders)
          </p>
        </div>

        {/* Total COD Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Account Transactions
            </span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package size={22} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{payments.length}</p>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Orders belonging to your account
          </p>
        </div>

        {/* Payment Mode */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Payment Method
            </span>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Banknote size={22} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">Cash on Delivery</p>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Online / Card payments disabled
          </p>
        </div>
      </div>

      {/* Information Banner */}
      <div className="mb-8 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-950">Cash on Delivery Policy</h4>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed">
            The platform operates exclusively on a <strong>Cash on Delivery (COD)</strong> payment model. 
            Buyers pay physical cash directly to the farmer or transporter upon receiving and inspecting the crop delivery. No online payments are required or supported.
          </p>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header & Filter Tabs */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-primary" size={20} />
            Account COD Payment Ledger
          </h2>

          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              All Account Orders ({payments.length})
            </button>
            <button
              onClick={() => setActiveFilter('received')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeFilter === 'received'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Received Post-Delivery ({receivedPayments.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Pending Collection ({pendingPayments.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Produce / Order</th>
                  <th className="py-4 px-6">Buyer / Customer</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6">Delivery & Payment Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Cash Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredPayments.map((payment, idx) => {
                  const isReceived = payment.status === 'received_post_delivery';
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={payment.productImage}
                            alt={payment.product}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{payment.product}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {payment.quantity} • {payment.orderId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {payment.buyerName}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-gray-900 text-base">
                        {payment.amount}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                          <Banknote size={14} /> Cash on Delivery
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-600 font-medium">
                        <div>
                          <p className="font-bold text-gray-800">{payment.deliveryDate}</p>
                          <p className="text-gray-400 mt-0.5">{payment.paymentDate}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            <CheckCircle2 size={14} /> Cash Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock size={14} /> Pending Delivery COD
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedReceipt(payment)}
                          className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-emerald-200"
                          title="View COD Cash Receipt"
                        >
                          <Receipt size={16} /> Receipt
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-gray-500">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-base font-bold text-gray-800">No COD records for this account</p>
              <p className="text-xs text-gray-400 mt-1">
                There are no Cash on Delivery orders associated with account "{accountName}".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cash Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/80">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="text-emerald-600" size={20} />
                  Cash on Delivery Receipt
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-white space-y-4 text-sm">
                <div className="text-center border-b border-dashed border-gray-200 pb-5">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Receipt size={28} />
                  </div>
                  <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">
                    COD Physical Cash Receipt
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    {selectedReceipt.paymentMode}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Receipt ID: #{selectedReceipt.id}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-bold text-gray-900">{selectedReceipt.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produce:</span>
                    <span className="font-bold text-gray-900">{selectedReceipt.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-medium text-gray-800">{selectedReceipt.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Buyer:</span>
                    <span className="font-medium text-gray-800">{selectedReceipt.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account User:</span>
                    <span className="font-medium text-gray-800">{accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Status:</span>
                    <span className="font-bold text-emerald-700 capitalize">
                      {selectedReceipt.status === 'received_post_delivery' ? 'Delivered & Paid' : 'Pending Delivery'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Collection Method:</span>
                    <span className="font-bold text-gray-900">Physical Cash on Delivery (COD)</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Cash Received</span>
                    <span className="text-xl font-extrabold text-emerald-700">
                      {selectedReceipt.amount}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-center text-[11px] text-emerald-800 font-medium">
                  ✓ Verified Cash Payment collected upon physical crop delivery.
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Download size={16} /> Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
