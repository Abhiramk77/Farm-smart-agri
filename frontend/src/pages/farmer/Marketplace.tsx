import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Filter, Star, Loader2 } from 'lucide-react';
import { contractService, Contract } from '../../api/services';

export function FarmerMarketplace() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = ['All', 'Nearby', 'High Price', 'Urgent'];

  useEffect(() => {
    contractService.getMarketplace()
      .then(data => setContracts(data))
      .catch(err => {
        console.error('Failed to fetch marketplace contracts', err);
        setError('Could not load the marketplace. Please try again later.');
        setContracts([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-500">
            Find and accept new farming contracts.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-4">
        {filters.map((filter) =>
        <button
          key={filter}
          onClick={() => setActiveFilter(filter.toLowerCase())}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === filter.toLowerCase() ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          
            {filter}
          </button>
        )}
      </div>

      {contracts.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
          <p className="text-gray-500">There are no contracts available in the marketplace right now.</p>
        </div>
      )}

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract) =>
        <div
          key={contract.id}
          onClick={() => navigate(`/farmer/contract/${contract.id}`)}
          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
          
            <div className="h-48 relative overflow-hidden">
              <img
              src={contract.productImage}
              alt={contract.product}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                {contract.distance} away
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {contract.product}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {contract.quantity} • {contract.quality}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {contract.totalPrice}
                  </p>
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
        )}
      </div>
    </div>
  );
}