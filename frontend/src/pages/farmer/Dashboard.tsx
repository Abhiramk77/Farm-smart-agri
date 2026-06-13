import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, DollarSign, ChevronRight, Loader2 } from 'lucide-react';
import { contractService, Contract } from '../../api/services';

export function FarmerDashboard() {
  const navigate = useNavigate();
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const stages = ['planting', 'growing', 'harvesting', 'ready', 'delivered'];

  useEffect(() => {
    contractService.getContracts('active')
      .then(data => setActiveContracts(data))
      .catch(err => {
        console.error('Failed to fetch contracts', err);
        setError('Could not load contracts. Please try again later.');
        // If there's no backend, it's expected to be empty, so we just set empty
        setActiveContracts([]);
      })
      .finally(() => {
        // Load local listings
        const localListings = JSON.parse(localStorage.getItem('farmer_listings') || '[]');
        setMyListings(localListings);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Calculate stats from real data
  const totalEarnings = activeContracts.reduce((acc, curr) => {
    if (!curr.totalPrice || curr.totalPrice === 'TBD') {
      const qty = parseFloat(curr.quantity.replace(/[^\d.]/g, '')) || 1;
      const prc = parseFloat(curr.price.replace(/[^\d.]/g, '')) || 0;
      return acc + (qty * prc);
    }
    const priceMatch = curr.totalPrice.match(/[\d,.]+/);
    return acc + (priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0);
  }, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-500">
            Track your active contracts and earnings.
          </p>
        </div>
        <Link 
          to="/farmer/sell"
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          Sell a Product
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-primary text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <DollarSign size={100} />
          </div>
          <p className="text-primary-light font-medium mb-1">
            Expected Revenue
          </p>
          <p className="text-3xl font-bold">${totalEarnings.toLocaleString()}</p>
          <p className="text-sm mt-4 text-white/80">Total gross income</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-gray-500 font-medium mb-1">Est. Profit</p>
          <p className="text-2xl font-bold text-gray-900">${(totalEarnings * 0.75).toLocaleString()}</p>
          <p className="text-sm mt-2 text-green-600 font-medium">+75% Margin</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} className="rotate-180" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Est. Expenses</p>
          <p className="text-2xl font-bold text-gray-900">${(totalEarnings * 0.25).toLocaleString()}</p>
          <p className="text-sm mt-2 text-red-600 font-medium">25% Overhead</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-gray-500 font-medium mb-1">Active Contracts</p>
          <p className="text-2xl font-bold text-gray-900">{activeContracts.length}</p>
          <p className="text-sm mt-2 text-gray-500">
            Next: {activeContracts.length > 0 ? activeContracts[0].timeline.split('-')[1] : 'None'}
          </p>
        </div>
      </div>

      {/* My Listings */}
      {myListings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            My Active Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  Listed
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{listing.product}</h3>
                    <p className="text-sm text-gray-500 capitalize">{listing.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{listing.price}</p>
                    <p className="text-xs text-gray-500">{listing.quantity}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Available: {listing.availableDate || 'TBD'}</span>
                  <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => {
                    const newListings = myListings.filter(l => l.id !== listing.id);
                    setMyListings(newListings);
                    localStorage.setItem('farmer_listings', JSON.stringify(newListings));
                  }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Contracts Progress */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Active Production
      </h2>
      <div className="space-y-4">
        {activeContracts.map((contract) => {
          const currentStageIndex = stages.indexOf(
            contract.progress || 'planting'
          );
          return (
            <div
              key={contract.id}
              onClick={() => navigate(`/farmer/contract/${contract.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-primary hover:shadow-md transition-all group">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={contract.productImage}
                    alt={contract.product}
                    className="w-16 h-16 rounded-xl object-cover" />
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {contract.product} for {contract.buyerName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {contract.quantity} • Deadline:{' '}
                      {contract.timeline.split('-')[1]}
                    </p>
                  </div>
                </div>
                <button className="text-primary font-medium text-sm hover:underline flex items-center gap-1">
                  Update <ChevronRight size={16} />
                </button>
              </div>

              {/* Stepper */}
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                  style={{
                    width: `${currentStageIndex / (stages.length - 1) * 100}%`
                  }}>
                </div>

                <div className="relative z-10 flex justify-between">
                  {stages.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    return (
                      <div key={stage} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-300'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                          
                          {isCompleted ? '✓' : ''}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium capitalize hidden sm:block ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                          
                          {stage}
                        </span>
                      </div>);

                  })}
                </div>
              </div>
            </div>);

        })}
        {activeContracts.length === 0 &&
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500 mb-4">No active contracts right now.</p>
            <Link
            to="/farmer/marketplace"
            className="text-primary font-medium hover:underline">
            
              Browse Marketplace
            </Link>
          </div>
        }
      </div>
    </div>);

}