import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Download, CheckCircle2, Clock, XCircle, X, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const mockPayments = [
  {
    id: 'PAY-1001',
    date: '2026-05-01',
    amount: '$1,200',
    status: 'completed',
    contract: 'Wheat Delivery',
  },
  {
    id: 'PAY-1002',
    date: '2026-05-03',
    amount: '$3,400',
    status: 'pending',
    contract: 'Corn Supply',
  },
  {
    id: 'PAY-1003',
    date: '2026-05-04',
    amount: '$850',
    status: 'failed',
    contract: 'Soybean Initial',
  }
];

export function PaymentStatus() {
  const { user } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      case 'failed': return <XCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>;
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pending</span>;
      case 'failed': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Failed</span>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="text-primary" size={28} />
          Payment Status
        </h1>
        <p className="text-gray-500 mt-1">Track your recent transactions and their statuses.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Contract</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((payment, idx) => (
                <motion.tr 
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{payment.id}</td>
                  <td className="px-6 py-4 text-gray-500">{payment.date}</td>
                  <td className="px-6 py-4 text-gray-600">{payment.contract}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{payment.amount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      {getStatusBadge(payment.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.status === 'completed' && (
                      <button 
                        onClick={() => setSelectedReceipt(payment)}
                        className="p-2 text-gray-500 hover:text-primary transition-colors" 
                        title="Download Receipt">
                        <Download size={20} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {mockPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No transactions found.
            </div>
          )}
        </div>
      </div>

      {selectedReceipt && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #receipt-modal-content, #receipt-modal-content * {
              visibility: visible;
            }
            #receipt-modal-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 2rem;
              background: white;
            }
          }
        `}</style>
      )}

      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden">
                <h3 className="font-bold text-lg">E-Receipt</h3>
                <button 
                  onClick={() => setSelectedReceipt(null)} 
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div id="receipt-modal-content" className="p-6 md:p-8 relative overflow-y-auto bg-white">
                <div className="text-center border-b border-dashed border-gray-200 pb-6 mb-6">
                  <Receipt className="mx-auto text-primary mb-4" size={40} />
                  <h3 className="text-xl font-bold uppercase tracking-wider text-gray-800">E-Receipt</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedReceipt.date}</p>
                </div>
                 
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-medium text-gray-900">#{selectedReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seller / Farmer</span>
                    <span className="font-medium text-gray-900">{user?.name || 'Unknown User'}</span>
                  </div>
                  {user?.mobile && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone Number</span>
                      <span className="font-medium text-gray-900">{user.mobile}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contract</span>
                    <span className="font-medium">{selectedReceipt.contract}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium capitalize text-green-600">{selectedReceipt.status}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{selectedReceipt.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">State Tax (5%)</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const amount = parseFloat(selectedReceipt.amount.replace(/[^0-9.-]+/g, '')) || 0;
                        return `$${(amount * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Country Tax (2%)</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const amount = parseFloat(selectedReceipt.amount.replace(/[^0-9.-]+/g, '')) || 0;
                        return `$${(amount * 0.02).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <span className="text-gray-800 font-bold">Total Paid</span>
                    <span className="font-bold text-primary text-lg">
                      {(() => {
                        const amount = parseFloat(selectedReceipt.amount.replace(/[^0-9.-]+/g, '')) || 0;
                        return `$${(amount * 1.07).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                      })()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8 text-center text-xs text-gray-400">
                  <p>Smart Agri Contract Platform</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <Download size={18} /> Print / Save PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
