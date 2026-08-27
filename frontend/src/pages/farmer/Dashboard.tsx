import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, IndianRupee, ChevronRight, Loader2 } from 'lucide-react';
import { contractService, Contract, sanitizeContract } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_NAMES: Record<string, string> = {
  poultry: 'Poultry',
  agriculture: 'Agriculture',
  dairy: 'Dairy',
  aquaculture: 'Aquaculture',
};

export function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stages = ['planting', 'growing', 'harvesting', 'ready', 'delivered'];

  // Determine category (poultry, agriculture, dairy, aquaculture)
  const farmerCategory = user?.category || localStorage.getItem('mock_category') || 'poultry';
  const categoryLabel = CATEGORY_NAMES[farmerCategory] || (farmerCategory ? farmerCategory.charAt(0).toUpperCase() + farmerCategory.slice(1) : 'Farmer');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const userId = user?.id || localStorage.getItem('mock_user_id') || '';
    const userName = user?.name || localStorage.getItem('mock_user_name') || '';
    const userEmail = user?.email || localStorage.getItem('mock_user_email') || '';

    const loadFarmerContracts = (data: Contract[]) => {
      const sanitizedData = (data || []).map(sanitizeContract);
      const acceptedIdsKey = `accepted_contracts_${userId}`;
      const myAcceptedIds: string[] = JSON.parse(
        localStorage.getItem(acceptedIdsKey) || '[]'
      );

      const activeOnly = sanitizedData.filter((c) => {
        const isAccepted = c.status === 'active' || c.status === 'completed';
        if (!isAccepted) return false;

        const matchesFarmerId = c.farmerId && (c.farmerId === userId || c.farmerId === userEmail);
        const matchesFarmerName = c.farmerName && c.farmerName.toLowerCase() === userName.toLowerCase();
        const isLocallyAccepted = myAcceptedIds.includes(c.id);

        if (c.farmerId || c.farmerName) {
          return matchesFarmerId || matchesFarmerName || isLocallyAccepted;
        }
        return isLocallyAccepted;
      });

      setActiveContracts(activeOnly);
      setIsLoading(false);
    };

    contractService
      .getContracts()
      .then((data) => loadFarmerContracts(data))
      .catch((err) => {
        console.error('Failed to fetch contracts', err);
        setActiveContracts([]);
      })
      .finally(() => {
        const userId = user?.id || localStorage.getItem('mock_user_id') || 'unknown';
        const localListings = JSON.parse(
          localStorage.getItem(`farmer_listings_${userId}`) ||
          localStorage.getItem('farmer_listings') ||
          '[]'
        );
        const sanitizedListings = localListings.map((item: any) => ({
          ...item,
          price: item.price ? item.price.replace(/\$/g, '₹') : '',
        }));
        setMyListings(sanitizedListings);
        setIsLoading(false);
      });

    // Real-time subscription for live Android & Web sync
    unsubscribe = contractService.subscribeUserOrders((updatedOrders) => {
      loadFarmerContracts(updatedOrders);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, farmerCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Filter active contracts to only those matching this farmer's category
  const filteredActiveContracts = farmerCategory
    ? activeContracts.filter(c => c.category === farmerCategory)
    : activeContracts;

  // Filter farmer listings to match category
  const filteredListings = farmerCategory
    ? myListings.filter(l => l.category === farmerCategory)
    : myListings;

  const calcContractValue = (c: Contract) => {
    if (!c) return 0;
    if (c.totalPrice && c.totalPrice !== 'TBD' && c.totalPrice !== '₹0') {
      const cleaned = c.totalPrice.replace(/\$/g, '').replace(/,/g, '');
      const match = cleaned.match(/[\d.]+/);
      if (match) {
        const val = parseFloat(match[0]);
        if (!isNaN(val) && val > 0) return val;
      }
    }
    const qtyMatch = (c.quantity || '').replace(/,/g, '').match(/[\d.]+/);
    const priceMatch = (c.price || '').replace(/,/g, '').match(/[\d.]+/);
    const qty = qtyMatch ? parseFloat(qtyMatch[0]) : 1;
    const prc = priceMatch ? parseFloat(priceMatch[0]) : 0;
    return qty * prc;
  };

  const totalIncome = filteredActiveContracts.reduce(
    (acc, curr) => acc + calcContractValue(curr),
    0
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {categoryLabel} Farmer Dashboard
          </h1>
          <p className="text-gray-500">
            Track your active {categoryLabel.toLowerCase()} contracts and earnings.
          </p>
        </div>

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
            <IndianRupee size={100} />
          </div>
          <p className="text-primary-light font-medium mb-1">
            Total Earned Income
          </p>
          <p className="text-3xl font-bold">₹{totalIncome.toLocaleString()}</p>
          <p className="text-sm mt-4 text-white/80">
            {totalIncome === 0
              ? `Accept a buyer ${categoryLabel.toLowerCase()} contract to start earning`
              : `Updated across ${filteredActiveContracts.length} contract(s)`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-gray-500 font-medium mb-1">Est. Profit</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(totalIncome * 0.75).toLocaleString()}
          </p>
          <p className="text-sm mt-2 text-green-600 font-medium">
            {totalIncome === 0 ? 'No active contracts' : '+75% Margin'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} className="rotate-180" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Est. Expenses</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(totalIncome * 0.25).toLocaleString()}
          </p>
          <p className="text-sm mt-2 text-red-600 font-medium">
            {totalIncome === 0 ? 'No overhead yet' : '25% Overhead'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-gray-500 font-medium mb-1">Active Contracts</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredActiveContracts.length}
          </p>
          <p className="text-sm mt-2 text-gray-500">
            {filteredActiveContracts.length > 0
              ? `Next: ${filteredActiveContracts[0].timeline.split('-')[1] || 'Ongoing'}`
              : 'None in progress'}
          </p>
        </div>
      </div>

      {/* My Listings */}
      {filteredListings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            My Active {categoryLabel} Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  Listed
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {listing.product}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {listing.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {listing.price?.replace(/\$/g, '₹')}
                    </p>
                    <p className="text-xs text-gray-500">{listing.quantity}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Available: {listing.availableDate || 'TBD'}
                  </span>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => {
                      const newListings = myListings.filter(
                        (l) => l.id !== listing.id
                      );
                      setMyListings(newListings);
                      localStorage.setItem(
                        'farmer_listings',
                        JSON.stringify(newListings)
                      );
                    }}
                  >
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
        Active Production ({categoryLabel})
      </h2>
      <div className="space-y-4">
        {filteredActiveContracts.map((contract) => {
          const currentStageIndex = stages.indexOf(
            contract.progress || 'planting'
          );
          return (
            <div
              key={contract.id}
              onClick={() => navigate(`/farmer/contract/${contract.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={contract.productImage}
                    alt={contract.product}
                    className="w-16 h-16 rounded-xl object-cover"
                  />

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
                    width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
                  }}
                ></div>

                <div className="relative z-10 flex justify-between">
                  {stages.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    return (
                      <div key={stage} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            isCompleted
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-gray-300 text-gray-300'
                          } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                        >
                          {isCompleted ? '✓' : ''}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium capitalize hidden sm:block ${
                            isCurrent
                              ? 'text-primary'
                              : isCompleted
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        {filteredActiveContracts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-amber-500" size={24} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              No active {categoryLabel.toLowerCase()} contracts yet
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Browse buyer-released {categoryLabel.toLowerCase()} contracts in the Marketplace and accept one to start production.
            </p>
            <Link
              to="/farmer/marketplace"
              className="inline-block bg-primary text-white px-5 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors text-sm"
            >
              Browse {categoryLabel} Buyer Contracts
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}