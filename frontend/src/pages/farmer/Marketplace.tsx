import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Loader2, Wheat, Droplets, Fish, Bird } from 'lucide-react';
import { contractService, Contract } from '../../api/services';

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  agriculture: { label: 'Agriculture', color: 'bg-green-100 text-green-800',  icon: <Wheat size={14} /> },
  dairy:       { label: 'Dairy',       color: 'bg-blue-100 text-blue-800',    icon: <Droplets size={14} /> },
  aquaculture: { label: 'Aquaculture', color: 'bg-cyan-100 text-cyan-800',    icon: <Fish size={14} /> },
  poultry:     { label: 'Poultry',     color: 'bg-amber-100 text-amber-800',  icon: <Bird size={14} /> },
};

export function FarmerMarketplace() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read the farmer's category from localStorage (saved during signup)
  const farmerCategory = localStorage.getItem('mock_category') || '';
  const categoryMeta = CATEGORY_META[farmerCategory];

  useEffect(() => {
    contractService.getMarketplace()
      .then(data => {
        // ✅ Only show contracts that match this farmer's category
        const filtered = farmerCategory
          ? data.filter(c => c.category === farmerCategory)
          : data;
        setContracts(filtered);
      })
      .catch(err => {
        console.error('Failed to fetch marketplace contracts', err);
        setError('Could not load the marketplace. Please try again later.');
        setContracts([]);
      })
      .finally(() => setIsLoading(false));
  }, [farmerCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-gray-500">Buyer-released contracts ready for you to accept.</p>
            {categoryMeta && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${categoryMeta.color}`}>
                {categoryMeta.icon}
                {categoryMeta.label} contracts only
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {/* Empty state */}
      {contracts.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${categoryMeta ? categoryMeta.color : 'bg-gray-100 text-gray-400'}`}>
            {categoryMeta?.icon}
          </div>
          <p className="text-gray-700 font-semibold mb-1">
            No {categoryMeta?.label || ''} contracts available right now
          </p>
          <p className="text-gray-400 text-sm">
            Buyers haven't released any {categoryMeta?.label?.toLowerCase() || ''} contracts yet. Check back soon.
          </p>
        </div>
      )}

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract) => {
          const meta = CATEGORY_META[contract.category];
          return (
            <div
              key={contract.id}
              onClick={() => navigate(`/farmer/contract/${contract.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">

              {/* Product Image */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={contract.productImage}
                  alt={contract.product}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                {/* Category badge */}
                {meta && (
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${meta.color} shadow-sm`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                )}

                {/* Distance badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                  {contract.distance} away
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{contract.product}</h3>
                    <p className="text-sm text-gray-500">{contract.quantity} • {contract.quality}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-lg font-bold text-primary">{contract.totalPrice}</p>
                    <p className="text-xs text-gray-500">{contract.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <Star size={14} className="fill-accent text-accent" />
                  <span className="font-medium">{contract.buyerRating}</span>
                  <span className="text-gray-400 ml-1">{contract.buyerName}</span>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>{contract.timeline}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="truncate">{contract.deliveryLocation}</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-gray-50 text-primary font-semibold rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}