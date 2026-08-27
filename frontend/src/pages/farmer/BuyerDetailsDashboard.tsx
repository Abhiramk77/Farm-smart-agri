import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Award,
  AlertCircle,
} from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

interface AcceptedBuyerProfile {
  id: string;
  name: string;
  businessType: string;
  email: string;
  phone: string;
  location: string;
  acceptedContractId: string;
  acceptedProduct: string;
  acceptedTimeline: string;
  acceptedPrice: string;
  acceptedDate: string;
  verified: boolean;
}

export function BuyerDetailsDashboard() {
  const { user } = useAuth();
  const [acceptedBuyers, setAcceptedBuyers] = useState<AcceptedBuyerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const farmerId = user?.id || localStorage.getItem('mock_user_id') || '';
  const farmerName = user?.name || localStorage.getItem('mock_user_name') || 'Farmer';

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeMsgs: (() => void) | null = null;

    const loadAcceptedBuyers = (allContracts: Contract[]) => {
      const acceptedIdsKey = `accepted_contracts_${farmerId}`;
      const myAcceptedIds: string[] = JSON.parse(
        localStorage.getItem(acceptedIdsKey) || '[]'
      );
      const cachedKey = `cached_contracts_${farmerId}`;
      const cachedContracts: Contract[] = JSON.parse(
        localStorage.getItem(cachedKey) || '[]'
      );

      const combinedContracts = [...(allContracts || []), ...cachedContracts];

      // Filter contracts accepted by THIS farmer ONLY
      const farmerAcceptedContracts = combinedContracts
        .map(sanitizeContract)
        .filter((c) => {
          const isAccepted = c.status === 'active' || c.status === 'completed';
          if (!isAccepted) return false;

          const matchesFarmerId = c.farmerId && (c.farmerId === farmerId || c.farmerId === user?.email);
          const matchesFarmerName = c.farmerName && c.farmerName.toLowerCase() === farmerName.toLowerCase();
          const isLocallyAccepted = myAcceptedIds.includes(c.id);

          if (c.farmerId || c.farmerName) {
            return matchesFarmerId || matchesFarmerName || isLocallyAccepted;
          }
          return isLocallyAccepted;
        });

      // Extract unique buyers from these accepted orders
      const buyerMap = new Map<string, AcceptedBuyerProfile>();

      farmerAcceptedContracts.forEach((c) => {
        const bName = c.buyerName || 'Verified Enterprise Buyer';
        const bId = c.buyerId || `b_${bName.toLowerCase().replace(/\s+/g, '')}`;

        if (!buyerMap.has(bId)) {
          buyerMap.set(bId, {
            id: bId,
            name: bName,
            businessType: 'Verified Commodity Buyer',
            email: c.buyerId?.includes('@') ? c.buyerId : `${bName.toLowerCase().replace(/\s+/g, '')}@farmagri.org`,
            phone: '+91 91234 56789',
            location: c.deliveryLocation || 'Andhra Pradesh, India',
            acceptedContractId: c.id,
            acceptedProduct: c.product,
            acceptedTimeline: c.timeline,
            acceptedPrice: c.totalPrice || c.price,
            acceptedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently',
            verified: true,
          });
        }
      });

      setAcceptedBuyers(Array.from(buyerMap.values()));
      setIsLoading(false);
    };

    // 1. Initial contract fetch
    contractService
      .getContracts()
      .then((data) => loadAcceptedBuyers(data))
      .catch((err) => {
        console.error('Failed to load contracts:', err);
        setAcceptedBuyers([]);
        setIsLoading(false);
      });

    // 2. Real-time subscription for instant contract updates
    unsubscribeOrders = contractService.subscribeUserOrders((updatedOrders) => {
      loadAcceptedBuyers(updatedOrders);
    });

    // 3. Real-time chat messages subscription
    unsubscribeMsgs = contractService.subscribeMessages(farmerId, (msgs) => {
      setChatHistory(msgs);
    });

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeMsgs) unsubscribeMsgs();
    };
  }, [farmerId, farmerName, user]);

  const handleSendMessage = async (buyer: AcceptedBuyerProfile) => {
    const text = messages[buyer.id]?.trim();
    if (!text) return;

    setSendingId(buyer.id);

    try {
      await contractService.sendMessage({
        senderId: farmerId,
        senderName: farmerName,
        receiverId: buyer.id,
        receiverName: buyer.name,
        contractId: buyer.acceptedContractId,
        text,
      });

      // Clear input box
      setMessages((prev) => ({ ...prev, [buyer.id]: '' }));
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingId(null);
    }
  };

  const filteredBuyers = acceptedBuyers.filter((b) => {
    return (
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.acceptedProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-xs font-semibold text-blue-200 mb-3 border border-blue-400/30">
              <Award size={14} /> Accepted Buyers Only • Direct Message Center
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Accepted Buyer Details & Messaging
            </h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-2xl">
              Displaying buyer profiles for orders you have accepted. Send direct messages to buyers that will be received on their account.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-300">
              {acceptedBuyers.length}
            </span>
            <p className="text-xs text-blue-100 font-medium">Accepted Buyers</p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {acceptedBuyers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accepted buyer name, product or city..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
        </div>
      )}

      {/* Buyers List */}
      {filteredBuyers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBuyers.map((buyer) => {
            const buyerMsgs = chatHistory.filter(
              (m) =>
                (m.senderId === farmerId && (m.receiverId === buyer.id || m.receiverName === buyer.name)) ||
                (m.receiverId === farmerId && (m.senderId === buyer.id || m.senderName === buyer.name))
            );

            return (
              <motion.div
                key={buyer.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar & Verified Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-200 shadow-xs">
                        <Building2 size={26} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-1.5">
                          {buyer.name}
                          {buyer.verified && (
                            <ShieldCheck size={18} className="text-blue-600 inline-block" title="Verified Buyer" />
                          )}
                        </h3>
                        <p className="text-xs text-blue-700 font-semibold mt-0.5">{buyer.businessType}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={13} /> Order Accepted
                    </span>
                  </div>

                  {/* Accepted Contract Summary */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 mb-4 text-xs">
                    <p className="font-bold text-emerald-900 mb-1">
                      Accepted Contract: {buyer.acceptedProduct} ({buyer.acceptedPrice})
                    </p>
                    <p className="text-emerald-700">Timeline: {buyer.acceptedTimeline}</p>
                  </div>

                  {/* Contact & Login Info Box */}
                  <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100 text-xs mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <Mail size={14} className="text-blue-600 shrink-0" /> Login Email:
                      </span>
                      <span className="font-semibold text-gray-800 font-mono text-[11px] truncate max-w-[180px]">
                        {buyer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-blue-600 shrink-0" /> Delivery Hub:
                      </span>
                      <span className="font-semibold text-gray-800">{buyer.location}</span>
                    </div>
                  </div>

                  {/* Recent Message History (Live Sync) */}
                  {buyerMsgs.length > 0 && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200/60 max-h-36 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Chat History
                      </p>
                      {buyerMsgs.slice(-3).map((m: any, i: number) => {
                        const isMe = m.senderId === farmerId;
                        return (
                          <div
                            key={m.id || i}
                            className={`p-2 rounded-lg text-xs ${
                              isMe
                                ? 'bg-blue-600 text-white ml-auto max-w-[85%]'
                                : 'bg-white text-gray-800 border border-gray-200 mr-auto max-w-[85%]'
                            }`}
                          >
                            <p className="font-semibold text-[10px] opacity-80 mb-0.5">
                              {m.senderName || (isMe ? farmerName : buyer.name)}
                            </p>
                            <p>{m.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Inline Message Input Box (NO CALL BUTTON) */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <MessageSquare size={14} className="text-blue-600" /> Send Message to Buyer:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messages[buyer.id] || ''}
                      onChange={(e) =>
                        setMessages((prev) => ({ ...prev, [buyer.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage(buyer);
                      }}
                      placeholder={`Type message to ${buyer.name}...`}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => handleSendMessage(buyer)}
                      disabled={sendingId === buyer.id || !messages[buyer.id]?.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs shrink-0"
                    >
                      {sendingId === buyer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={13} /> Send
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Messages are instantly delivered to {buyer.name}'s account via Cloud Firestore.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200 text-gray-500">
          <AlertCircle size={44} className="mx-auto text-amber-500 mb-3" />
          <p className="font-extrabold text-gray-800 text-lg">No accepted buyers found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            You currently have no accepted buyer orders. Once you accept a contract from the Marketplace, the buyer's info and message box will appear here automatically!
          </p>
        </div>
      )}
    </div>
  );
}
