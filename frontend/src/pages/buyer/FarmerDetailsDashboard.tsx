import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Mail,
  MapPin,
  ShieldCheck,
  Wheat,
  Fish,
  Bird,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  UserCheck,
  Milk,
} from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

interface AcceptedFarmerProfile {
  id: string;
  name: string;
  category: string;
  email: string;
  location: string;
  acceptedContractId: string;
  acceptedProduct: string;
  acceptedTimeline: string;
  acceptedPrice: string;
  verified: boolean;
}

const CATEGORY_ICONS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  agriculture: { label: 'Agriculture', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Wheat size={14} /> },
  dairy:       { label: 'Dairy',       color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: <Milk size={14} /> },
  aquaculture: { label: 'Aquaculture', color: 'bg-cyan-100 text-cyan-800 border-cyan-200',       icon: <Fish size={14} /> },
  poultry:     { label: 'Poultry',     color: 'bg-amber-100 text-amber-800 border-amber-200',     icon: <Bird size={14} /> },
};

export function FarmerDetailsDashboard() {
  const { user } = useAuth();
  const [acceptedFarmers, setAcceptedFarmers] = useState<AcceptedFarmerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const buyerId = user?.id || localStorage.getItem('mock_user_id') || '';
  const buyerName = user?.name || localStorage.getItem('mock_user_name') || 'Buyer';

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeMsgs: (() => void) | null = null;

    const loadAcceptedFarmers = (allContracts: Contract[]) => {
      const buyerContractsKey = `buyer_contracts_${buyerId}`;
      const localBuyerContracts: Contract[] = JSON.parse(
        localStorage.getItem(buyerContractsKey) || '[]'
      );
      const combinedContracts = [...(allContracts || []), ...localBuyerContracts];

      // Filter contracts created by THIS buyer that have been accepted by a farmer ONLY
      const buyerAcceptedContracts = combinedContracts
        .map(sanitizeContract)
        .filter((c) => {
          const isAccepted = c.status === 'active' || c.status === 'completed';
          if (!isAccepted) return false;

          const isMyBuyerContract =
            (c.buyerId && (c.buyerId === buyerId || c.buyerId === user?.email)) ||
            (c.buyerName && c.buyerName.toLowerCase() === buyerName.toLowerCase()) ||
            (!c.buyerId && !c.buyerName);

          return isMyBuyerContract && (c.farmerName || c.farmerId);
        });

      const farmerMap = new Map<string, AcceptedFarmerProfile>();

      buyerAcceptedContracts.forEach((c) => {
        const fName = c.farmerName || 'Accepted Farmer';
        const fId = c.farmerId || `f_${fName.toLowerCase().replace(/\s+/g, '')}`;

        if (!farmerMap.has(fId)) {
          farmerMap.set(fId, {
            id: fId,
            name: fName,
            category: c.category || 'agriculture',
            email: fId.includes('@') ? fId : `${fName.toLowerCase().replace(/\s+/g, '')}@farmagri.org`,
            location: c.deliveryLocation || 'Andhra Pradesh, India',
            acceptedContractId: c.id,
            acceptedProduct: c.product,
            acceptedTimeline: c.timeline,
            acceptedPrice: c.totalPrice || c.price,
            verified: true,
          });
        }
      });

      setAcceptedFarmers(Array.from(farmerMap.values()));
      setIsLoading(false);
    };

    // 1. Initial contract fetch
    contractService
      .getContracts()
      .then((data) => loadAcceptedFarmers(data))
      .catch((err) => {
        console.error('Failed to load contracts:', err);
        setAcceptedFarmers([]);
        setIsLoading(false);
      });

    // 2. Real-time subscription for live contract updates
    unsubscribeOrders = contractService.subscribeUserOrders((updatedOrders) => {
      loadAcceptedFarmers(updatedOrders);
    });

    // 3. Real-time chat messages subscription
    unsubscribeMsgs = contractService.subscribeMessages(buyerId, (msgs) => {
      setChatHistory(msgs);
    });

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeMsgs) unsubscribeMsgs();
    };
  }, [buyerId, buyerName, user]);

  const handleSendMessage = async (farmer: AcceptedFarmerProfile) => {
    const text = messages[farmer.id]?.trim();
    if (!text) return;

    setSendingId(farmer.id);

    try {
      await contractService.sendMessage({
        senderId: buyerId,
        senderName: buyerName,
        receiverId: farmer.id,
        receiverName: farmer.name,
        contractId: farmer.acceptedContractId,
        text,
      });

      // Clear input box
      setMessages((prev) => ({ ...prev, [farmer.id]: '' }));
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingId(null);
    }
  };

  const filteredFarmers = acceptedFarmers.filter((f) => {
    return (
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.acceptedProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="mb-8 bg-gradient-to-r from-emerald-950 via-green-900 to-teal-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-emerald-400/30">
              <UserCheck size={14} /> Accepted Farmers Only • Message Center
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Accepted Farmer Details & Messaging
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Displaying farmers who have accepted your contracts. Send messages directly to farmers to coordinate crop delivery.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-300">
              {acceptedFarmers.length}
            </span>
            <p className="text-xs text-emerald-100 font-medium">Accepted Farmers</p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {acceptedFarmers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accepted farmer name, crop or farm location..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
          </div>
        </div>
      )}

      {/* Farmers Grid */}
      {filteredFarmers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFarmers.map((farmer) => {
            const categoryObj = CATEGORY_ICONS[farmer.category] || CATEGORY_ICONS.agriculture;
            const farmerMsgs = chatHistory.filter(
              (m) =>
                (m.senderId === buyerId && (m.receiverId === farmer.id || m.receiverName === farmer.name)) ||
                (m.receiverId === buyerId && (m.senderId === farmer.id || m.senderName === farmer.name))
            );

            return (
              <motion.div
                key={farmer.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar & Category Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-xl border border-emerald-200 shadow-xs">
                        {farmer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-1.5">
                          {farmer.name}
                          {farmer.verified && (
                            <ShieldCheck size={18} className="text-emerald-600 inline-block" title="Verified Farmer" />
                          )}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${categoryObj.color}`}>
                          {categoryObj.icon}
                          {categoryObj.label}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={13} /> Order Accepted
                    </span>
                  </div>

                  {/* Accepted Contract Summary */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 mb-4 text-xs">
                    <p className="font-bold text-emerald-900 mb-1">
                      Fulfilling Contract: {farmer.acceptedProduct} ({farmer.acceptedPrice})
                    </p>
                    <p className="text-emerald-700">Timeline: {farmer.acceptedTimeline}</p>
                  </div>

                  {/* Contact & Login Info Box */}
                  <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100 text-xs mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <Mail size={14} className="text-emerald-600 shrink-0" /> Login Email:
                      </span>
                      <span className="font-semibold text-gray-800 font-mono text-[11px] truncate max-w-[180px]">
                        {farmer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-emerald-600 shrink-0" /> Farm Location:
                      </span>
                      <span className="font-semibold text-gray-800">{farmer.location}</span>
                    </div>
                  </div>

                  {/* Recent Message History (Live Sync) */}
                  {farmerMsgs.length > 0 && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200/60 max-h-36 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Chat History
                      </p>
                      {farmerMsgs.slice(-3).map((m: any, i: number) => {
                        const isMe = m.senderId === buyerId;
                        return (
                          <div
                            key={m.id || i}
                            className={`p-2 rounded-lg text-xs ${
                              isMe
                                ? 'bg-emerald-600 text-white ml-auto max-w-[85%]'
                                : 'bg-white text-gray-800 border border-gray-200 mr-auto max-w-[85%]'
                            }`}
                          >
                            <p className="font-semibold text-[10px] opacity-80 mb-0.5">
                              {m.senderName || (isMe ? buyerName : farmer.name)}
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
                    <MessageSquare size={14} className="text-emerald-600" /> Send Message to Farmer:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messages[farmer.id] || ''}
                      onChange={(e) =>
                        setMessages((prev) => ({ ...prev, [farmer.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage(farmer);
                      }}
                      placeholder={`Type message to ${farmer.name}...`}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => handleSendMessage(farmer)}
                      disabled={sendingId === farmer.id || !messages[farmer.id]?.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs shrink-0"
                    >
                      {sendingId === farmer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={13} /> Send
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Messages are instantly delivered to {farmer.name}'s account via Cloud Firestore.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200 text-gray-500">
          <AlertCircle size={44} className="mx-auto text-amber-500 mb-3" />
          <p className="font-extrabold text-gray-800 text-lg">No accepted farmers found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            None of your issued contracts have been accepted by a farmer yet. Once a farmer accepts your contract, their details and message box will appear here automatically!
          </p>
        </div>
      )}
    </div>
  );
}
