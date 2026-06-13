import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Loader2,
  Truck,
  CreditCard,
  Receipt,
  Download
} from 'lucide-react';
import { ROLES, CATEGORIES } from '../../data/mockData';
import { contractService } from '../../api/services';
export function CreateContract() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    product: '',
    quantity: '',
    quality: 'Standard',
    price: '',
    startDate: '',
    endDate: '',
    deliveryLocation: '',
    pickupOption: false,
    transportIncluded: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const handlePayment = async () => {
    setIsSubmitting(true);
    
    const categoryProducts = CATEGORIES[formData.category as keyof typeof CATEGORIES] || [];
    const productObj = categoryProducts.find(p => p.name === formData.product);
    
    const qty = parseFloat(formData.quantity.replace(/[^\d.]/g, '')) || 1;
    const prc = parseFloat(formData.price.replace(/[^\d.]/g, '')) || 0;
    const computedTotal = qty * prc;
    const finalTotalPrice = computedTotal > 0 ? `$${computedTotal.toLocaleString()}` : 'TBD';

    try {
      await contractService.createContract({
        category: formData.category,
        product: formData.product,
        productImage: productObj?.image,
        quantity: formData.quantity,
        quality: formData.quality,
        price: formData.price,
        totalPrice: finalTotalPrice,
        timeline: formData.startDate && formData.endDate ? `${formData.startDate} to ${formData.endDate}` : 'Timeline flexible',
        deliveryLocation: formData.deliveryLocation || 'Not specified',
        distance: 'TBD',
        transportIncluded: formData.transportIncluded,
      });
      setStep(6);
    } catch (err) {
      console.error(err);
      alert('Failed to process payment & publish contract');
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderStepIndicator = () => {
    if (step === 6) return null;
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4, 5].map((i) =>
      <Fragment key={i}>
            <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${step >= i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
          
              {i}
            </div>
            {i < 5 &&
        <div
          className={`w-12 h-1 ${step > i ? 'bg-primary' : 'bg-gray-200'}`} />

        }
          </Fragment>
      )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Create New Contract
        </h1>
      </div>

      {renderStepIndicator()}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Category */}
          {step === 1 &&
          <motion.div
            key="step1"
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: -20
            }}>
            
              <h2 className="text-xl font-bold mb-6">
                Select Farming Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ROLES.filter((r) => r.id !== 'buyer').map((role) =>
              <div
                key={role.id}
                onClick={() => {
                  updateForm('category', role.id);
                  nextStep();
                }}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${formData.category === role.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}>
                
                    <div className="aspect-square relative">
                      <img
                    src={role.image}
                    alt={role.name}
                    className="w-full h-full object-cover" />
                  
                      <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                        <span className="text-white font-medium text-sm">
                          {role.name}
                        </span>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            </motion.div>
          }

          {/* STEP 2: Product */}
          {step === 2 &&
          <motion.div
            key="step2"
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: -20
            }}>
            
              <h2 className="text-xl font-bold mb-6">Select Product</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(
              CATEGORIES[formData.category as keyof typeof CATEGORIES] || []).
              map((product) =>
              <div
                key={product.id}
                onClick={() => {
                  updateForm('product', product.name);
                  nextStep();
                }}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${formData.product === product.name ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}>
                
                    <div className="aspect-square relative">
                      <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover" />
                  
                      <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                        <span className="text-white font-medium">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            </motion.div>
          }

          {/* STEP 3: Details */}
          {step === 3 &&
          <motion.div
            key="step3"
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: -20
            }}
            className="space-y-6">
            
              <h2 className="text-xl font-bold mb-6">Contract Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                  type="text"
                  placeholder="e.g., 500 kg"
                  value={formData.quantity}
                  onChange={(e) => updateForm('quantity', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary" />
                
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
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                  value={formData.quality}
                  onChange={(e) => updateForm('quality', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary">
                  
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Organic</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                    type="date"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                    type="date"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary" />
                  
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Logistics
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Location
                    </label>
                    <input
                    type="text"
                    placeholder="Enter address or drop pin"
                    value={formData.deliveryLocation}
                    onChange={(e) =>
                    updateForm('deliveryLocation', e.target.value)
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary mb-2" />
                  
                    {/* Mock Map */}
                    <div className="w-full h-32 bg-gray-200 rounded-xl overflow-hidden relative">
                      <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                      alt="Map"
                      className="w-full h-full object-cover opacity-50" />
                    
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium text-gray-600 flex items-center gap-2">
                          <MapPin size={16} className="text-red-500" /> Select
                          on Map
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Truck className="text-primary" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Transport Included
                        </p>
                        <p className="text-xs text-gray-500">
                          Farmer handles delivery
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.transportIncluded}
                      onChange={(e) =>
                      updateForm('transportIncluded', e.target.checked)
                      } />
                    
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          }

          {/* STEP 4: Review */}
          {step === 4 &&
          <motion.div
            key="step4"
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: -20
            }}>
            
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Review Contract</h2>
                <p className="text-gray-500">
                  Please review the details before proceeding to payment.
                </p>
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
                  <span className="text-gray-500">Total Price</span>
                  <span className="font-medium text-primary">
                    {(() => {
                      const qty = parseFloat(formData.quantity.replace(/[^\d.]/g, '')) || 1;
                      const prc = parseFloat(formData.price.replace(/[^\d.]/g, '')) || 0;
                      return qty * prc > 0 ? `$${(qty * prc).toLocaleString()}` : 'TBD';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-right max-w-[200px] truncate">
                    {formData.deliveryLocation || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transport</span>
                  <span className="font-medium">
                    {formData.transportIncluded ? 'Included' : 'Buyer Pickup'}
                  </span>
                </div>
              </div>
            </motion.div>
          }

          {/* STEP 5: Payment */}
          {step === 5 &&
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-primary" /> Payment Details
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <span className="text-gray-500">Amount Due</span>
                <span className="text-2xl font-bold text-primary">
                  {(() => {
                    const qty = parseFloat(formData.quantity.replace(/[^\d.]/g, '')) || 1;
                    const prc = parseFloat(formData.price.replace(/[^\d.]/g, '')) || 0;
                    return qty * prc > 0 ? `$${(qty * prc).toLocaleString()}` : 'TBD';
                  })()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="text" placeholder="MM/YY" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input type="password" placeholder="***" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input type="text" placeholder="John Doe" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary" />
              </div>
            </div>
          </motion.div>}

          {/* STEP 6: E-Receipt */}
          {step === 6 &&
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-500">Your contract has been created and payment processed.</p>
            </div>

            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 md:p-8 max-w-md mx-auto relative shadow-sm">
              <div className="text-center border-b border-dashed border-gray-200 pb-6 mb-6">
                <h3 className="text-xl font-bold uppercase tracking-wider text-gray-800">E-Receipt</h3>
                <p className="text-sm text-gray-500 mt-1">Transaction ID: #{(Math.random() * 10000000).toFixed(0)}</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product</span>
                  <span className="font-medium">{formData.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity</span>
                  <span className="font-medium">{formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price/Unit</span>
                  <span className="font-medium">{formData.price}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <span className="text-gray-800 font-bold">Total Paid</span>
                  <span className="font-bold text-primary text-lg">
                    {(() => {
                      const qty = parseFloat(formData.quantity.replace(/[^\d.]/g, '')) || 1;
                      const prc = parseFloat(formData.price.replace(/[^\d.]/g, '')) || 0;
                      return qty * prc > 0 ? `$${(qty * prc).toLocaleString()}` : 'TBD';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button 
                className="flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition-colors"
                onClick={() => alert('Downloading receipt...')}
              >
                <Download size={20} /> Download PDF Receipt
              </button>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {step < 6 && (
        <div className="flex justify-between mt-8">
          {step > 1 ?
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            
              Previous
            </button> :

          <div />
          }

          {step < 4 ?
          <button
            onClick={nextStep}
            disabled={
            step === 1 && !formData.category ||
            step === 2 && !formData.product
            }
            className="px-6 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            
              Next Step <ArrowRight size={18} />
            </button> : step === 4 ?
          <button
            onClick={nextStep}
            className="px-6 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2">
            
              Proceed to Payment <ArrowRight size={18} />
            </button> : step === 5 ?
          <button
            onClick={handlePayment}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2">
            
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}
            </button> : null
          }
        </div>
      )}

      {step === 6 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="px-8 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>);

}