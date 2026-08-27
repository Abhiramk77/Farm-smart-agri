import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  MapPin, 
  Building, 
  Leaf, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Wheat,
  Bird,
  Milk,
  Fish
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'poultry', label: 'Poultry Farmer', icon: Bird },
  { id: 'agriculture', label: 'Agriculture Farmer', icon: Wheat },
  { id: 'dairy', label: 'Dairy Farmer', icon: Milk },
  { id: 'aquaculture', label: 'Aquaculture Farmer', icon: Fish },
];

export function Signup() {
  const navigate = useNavigate();
  const { pendingRole, signup } = useAuth();
  
  const [role, setRole] = useState<'buyer' | 'farmer'>(() => {
    if (pendingRole?.role) return pendingRole.role;
    return 'farmer';
  });

  const [category, setCategory] = useState<string>(() => {
    if (pendingRole?.category) return pendingRole.category;
    return 'agriculture';
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    state: '',
    city: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [duplicateAccount, setDuplicateAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (duplicateAccount) setDuplicateAccount(false);
  };

  const validateForm = (): boolean => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      return false;
    }

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    const trimmedMobile = formData.mobile.trim();
    if (!trimmedMobile || trimmedMobile.length < 7) {
      setError('Please enter a valid phone number.');
      return false;
    }

    if (!formData.password) {
      setError('Please enter a password.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    if (!formData.state.trim() || !formData.city.trim()) {
      setError('Please enter your state and city.');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDuplicateAccount(false);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        state: formData.state.trim(),
        city: formData.city.trim(),
        role,
        category: role === 'farmer' ? category : undefined
      });

      setIsLoading(false);
      setIsRegisteredSuccess(true);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Registration failed. Please check your information.';
      setError(msg);
      if (msg.toLowerCase().includes('already exists')) {
        setDuplicateAccount(true);
      }
    }
  };



  if (isRegisteredSuccess) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your <span className="font-semibold text-emerald-700">Smart Agri Connect</span> account has been created successfully.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please login using your registered credentials.
            </p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-left text-xs text-emerald-800 space-y-1">
            <p><span className="font-semibold">Account Email:</span> {formData.email}</p>
            <p><span className="font-semibold">Role:</span> {role === 'buyer' ? 'Buyer' : `Farmer (${category})`}</p>
          </div>

          <button
            onClick={() =>
              navigate('/login', {
                state: {
                  registeredEmail: formData.email,
                  registeredRole: role,
                  registeredCategory: category,
                  registeredSuccess: true
                }
              })
            }
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-sm"
          >
            Go to Login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/80 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Agriculture Visual Banner (Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 text-white flex flex-col justify-between relative overflow-hidden hidden lg:flex">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-emerald-300 border border-white/20">
                <Leaf size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Smart Agri Connect</span>
            </div>
            <h2 className="text-3xl font-extrabold mt-12 leading-tight text-emerald-50">
              Empowering Direct Agricultural Trade
            </h2>
            <p className="text-sm text-emerald-100/80 mt-4 leading-relaxed">
              Join thousands of farmers and buyers securing transparent contracts, verified produce prices, and smart agricultural logistics.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-8 border-t border-emerald-700/50">
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
              <span>Direct farmer-to-buyer smart contracting</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
              <span>Real-time market insights & verified buyers</span>
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Leaf size={20} />
                </div>
                <span className="font-bold text-lg text-emerald-800">Smart Agri Connect</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Join Smart Agri Connect as a <span className="font-semibold text-emerald-700">{role === 'buyer' ? 'Buyer' : 'Farmer'}</span>
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
            {/* Role Toggle */}
            <div className="flex bg-emerald-50/80 p-1 rounded-2xl mb-6 border border-emerald-100">
              {(['farmer', 'buyer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    role === r
                      ? 'bg-white text-emerald-800 shadow-md border border-emerald-200'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)} Registration
                </button>
              ))}
            </div>

            {/* Farmer Category Selector */}
            {role === 'farmer' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Select Farmer Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-sm ring-1 ring-emerald-500/30'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignup}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs sm:text-sm space-y-2">
                  <p className="font-medium text-center">{error}</p>
                  {duplicateAccount && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => navigate('/login', { state: { registeredEmail: formData.email, role } })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Go to Login <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="ramesh@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Min 8 chars"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* State & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="State"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Building size={16} />
                    </div>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="City"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      Create Account <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}