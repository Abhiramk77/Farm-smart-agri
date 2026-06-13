import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  MessageSquare,
  Loader2 } from
'lucide-react';
import { contractService, Contract } from '../../api/services';

export function FarmerContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [negotiatePrice, setNegotiatePrice] = useState('');

  const handleAcceptContract = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      await contractService.acceptContract(contract.id);
      navigate('/farmer/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to accept contract');
      setIsSubmitting(false);
    }
  };

  const handleRejectContract = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      await contractService.rejectContract(contract.id);
      navigate('/farmer/marketplace');
    } catch (err) {
      console.error(err);
      alert('Failed to reject contract');
      setIsSubmitting(false);
    }
  };

  const STAGES = ['planting', 'growing', 'harvesting', 'ready', 'delivered'];
  
  const handleAdvanceProgress = async () => {
    if (!contract || contract.status !== 'active' || !contract.progress) return;
    
    const currentIndex = STAGES.indexOf(contract.progress);
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return;
    
    const nextStage = STAGES[currentIndex + 1];
    
    setIsSubmitting(true);
    try {
      const updated = await contractService.updateContractProgress(contract.id, nextStage);
      setContract(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to update progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNegotiation = () => {
    if (!negotiatePrice) return;
    // In a real app, this would send a message to the backend via an API
    navigate('/chat');
  };

  useEffect(() => {
    if (!id) return;
    contractService.getContractById(id)
      .then(data => setContract(data))
      .catch(err => {
        console.error('Failed to fetch contract details', err);
        setError('Could not load contract details. Please try again later.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
          <p className="font-bold mb-2">Error</p>
          <p>{error || 'Contract not found.'}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero Image */}
      <div className="h-64 md:h-80 w-full relative">
        <img
          src={contract.productImage}
          alt={contract.product}
          className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 md:top-8 md:left-8 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
          
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-6 left-4 md:left-8 right-4 md:right-8 flex justify-between items-end">
          <div className="text-white">
            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3 inline-block uppercase tracking-wider">
              {contract.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold">
              {contract.product}
            </h1>
            <p className="text-white/80 mt-1 text-lg">
              {contract.quantity} • {contract.quality}
            </p>
          </div>
          <div className="text-right text-white">
            <p className="text-3xl md:text-4xl font-bold text-accent">
              {contract.totalPrice}
            </p>
            <p className="text-white/80">{contract.price}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Contract Requirements</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Timeline</p>
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={18} className="text-primary" />{' '}
                  {contract.timeline}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Transport</p>
                <div className="flex items-center gap-2 font-medium">
                  <Truck size={18} className="text-primary" />
                  {contract.transportIncluded ?
                  'Farmer Delivers' :
                  'Buyer Pickup'}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Delivery Location</h2>
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="text-red-500 shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">
                  {contract.deliveryLocation}
                </p>
                <p className="text-sm text-gray-500">
                  {contract.distance} away from your farm
                </p>
              </div>
            </div>
            {/* Mock Map */}
            <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                alt="Map Route"
                className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-bold text-primary">
                  Route Preview
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${contract.buyerName}&background=random`}
                  alt="Buyer" />
                
              </div>
              <div>
                <p className="font-bold text-gray-900">{contract.buyerName}</p>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <ShieldCheck size={14} className="text-green-500" /> Verified
                  Buyer
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {contract.status === 'pending' ? (
                <>
                  <button 
                    onClick={handleAcceptContract}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Accept Contract'}
                  </button>
                  
                  <button 
                    onClick={handleRejectContract}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                    Reject Contract
                  </button>

                  {showNegotiate ?
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Counter Offer
                      </label>
                      <div className="flex gap-2">
                        <input
                        type="text"
                        value={negotiatePrice}
                        onChange={(e) => setNegotiatePrice(e.target.value)}
                        placeholder="$"
                        className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:border-primary" />
                      
                        <button 
                          onClick={handleSendNegotiation}
                          className="px-4 bg-secondary text-white rounded-lg font-medium">
                          Send
                        </button>
                      </div>
                    </div> :

                  <button
                    onClick={() => setShowNegotiate(true)}
                    className="w-full py-3 bg-secondary/10 text-secondary font-bold rounded-xl hover:bg-secondary/20 transition-colors">
                    
                      Negotiate Price
                    </button>
                  }
                </>
              ) : contract.status === 'active' ? (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Update Progress</h3>
                  
                  <div className="space-y-4 mb-6 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                    
                    {STAGES.map((stage, idx) => {
                      const currentIdx = STAGES.indexOf(contract.progress || 'planting');
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      
                      return (
                        <div key={stage} className={`flex items-center gap-3 relative ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                          <span className={`font-medium capitalize ${isCurrent ? 'text-primary font-bold' : ''}`}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleAdvanceProgress}
                    disabled={isSubmitting || contract.progress === 'delivered'}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (contract.progress === 'delivered' ? 'Contract Completed' : 'Advance to Next Stage')}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-green-50 text-green-700 font-bold rounded-xl text-center border border-green-200">
                  Contract Completed
                </div>
              )}

              <button
                onClick={() => navigate('/chat')}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mt-4">
                
                <MessageSquare size={18} /> Message Buyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}