import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Loader2,
  Truck
} from 'lucide-react';
import { ROLES, CATEGORIES } from '../../data/mockData';

export function SellProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    product: '',
    quantity: '',
    quality: 'Standard',
    price: '',
    availableDate: '',
    farmLocation: '',
    farmerDelivers: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handlePublish = async () => {
    setIsSubmitting(true);
    
    // Simulate network request and save to localStorage
    setTimeout(() => {
      const existingListings = JSON.parse(localStorage.getItem('farmer_listings') || '[]');
      const newListing = {
        id: `lst-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('farmer_listings', JSON.stringify([newListing, ...existingListings]));
      
      setIsSubmitting(false);
      navigate('/farmer/dashboard');
    }, 1000);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Fragment key={i}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${step >= i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {i}
          </div>
          {i < 4 && (
            <div className={`w-12 h-1 ${step > i ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          List a Product for Sale
        </h1>
        <p className="text-gray-500 mt-1">Add your available produce to the marketplace.</p>
      </div>

      {renderStepIndicator()}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Category */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold mb-6">Select Farming Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ROLES.filter((r) => r.id !== 'buyer').map((role) => (
                  <div
                    key={role.id}
                    onClick={() => {
                      updateForm('category', role.id);
                      nextStep();
                    }}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${formData.category === role.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={role.image}
                        alt={role.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                        <span className="text-white font-medium text-sm">
                          {role.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Product */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold mb-6">Select Specific Product</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(CATEGORIES[formData.category as keyof typeof CATEGORIES] || []).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      updateForm('product', product.name);
                      nextStep();
                    }}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${formData.product === product.name ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                        <span className="text-white font-medium">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold mb-6">Product Details & Pricing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Available
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 500 kg or 1000 L"
                    value={formData.quantity}
                    onChange={(e) => updateForm('quantity', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., $1.20"
                    value={formData.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={formData.quality}
                    onChange={(e) => updateForm('quality', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary"
                  >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Organic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability Date
                  </label>
                  <input
                    type="date"
                    value={formData.availableDate}
                    onChange={(e) => updateForm('availableDate', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Logistics
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Location / Pickup Point
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full address"
                      value={formData.farmLocation}
                      onChange={(e) => updateForm('farmLocation', e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary mb-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Truck className="text-primary" />
                      <div>
                        <p className="font-medium text-gray-900">I will deliver to the buyer</p>
                        <p className="text-xs text-gray-500">Enable if you can transport the goods</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.farmerDelivers}
                        onChange={(e) => updateForm('farmerDelivers', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Review Listing</h2>
                <p className="text-gray-500">Please review your product listing details.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="text-gray-500">Product</span>
                  <span className="font-medium">
                    {formData.product} ({formData.category})
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="text-gray-500">Quantity & Quality</span>
                  <span className="font-medium">
                    {formData.quantity} - {formData.quality}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="text-gray-500">Price per unit</span>
                  <span className="font-medium">{formData.price}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-right max-w-[200px] truncate">
                    {formData.farmLocation || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Options</span>
                  <span className="font-medium">
                    {formData.farmerDelivers ? 'Farmer Delivers' : 'Buyer Picks Up'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={nextStep}
            disabled={
              (step === 1 && !formData.category) ||
              (step === 2 && !formData.product)
            }
            className="px-6 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
          </button>
        )}
      </div>
    </div>
  );
}
