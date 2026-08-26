import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Leaf, 
  Wheat, 
  Droplets, 
  Fish, 
  Bird, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X 
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'poultry', label: 'Poultry Farmer', icon: Bird },
  { id: 'agriculture', label: 'Agriculture Farmer', icon: Wheat },
  { id: 'dairy', label: 'Dairy Farmer', icon: Droplets },
  { id: 'aquaculture', label: 'Aquaculture Farmer', icon: Fish },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pendingRole } = useAuth();

  const locationState = location.state as {
    registeredEmail?: string;
    registeredRole?: 'buyer' | 'farmer';
    registeredCategory?: string;
    registeredSuccess?: boolean;
  } | null;

  const [role, setRole] = useState<'buyer' | 'farmer'>(() => {
    if (locationState?.registeredRole) return locationState.registeredRole;
    if (pendingRole?.role) return pendingRole.role;
    const stored = localStorage.getItem('mock_role');
    if (stored === 'buyer' || stored === 'farmer') return stored;
    return 'farmer';
  });

  const [category, setCategory] = useState<string>(() => {
    if (locationState?.registeredCategory) return locationState.registeredCategory;
    if (pendingRole?.category) return pendingRole.category;
    return localStorage.getItem('mock_category') || 'agriculture';
  });

  const [formData, setFormData] = useState({
    email: locationState?.registeredEmail || '',
    password: '',
    mobile: '',
    name: '',
    state: '',
    city: ''
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(
    Boolean(locationState?.registeredSuccess)
  );

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    if (pendingRole?.role) {
      setRole(pendingRole.role);
    }
    if (pendingRole?.category) {
      setCategory(pendingRole.category);
    }
  }, [pendingRole]);

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCategory = role === 'farmer' ? category : undefined;
      if (selectedCategory) {
        localStorage.setItem('mock_category', selectedCategory);
      }

      await login({
        email: formData.email.trim(),
        password: formData.password,
        mobile: formData.mobile,
        name: formData.name,
        state: formData.state,
        city: formData.city,
        role,
        category: selectedCategory,
        rememberMe
      });

      setIsLoading(false);
      if (role === 'buyer') {
        navigate('/buyer/dashboard');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid email or password.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsSendingReset(true);
    try {
      const result = await authService.forgotPassword(resetEmail.trim());
      setIsSendingReset(false);
      setResetSuccessMessage(result.message);
    } catch (err: any) {
      setIsSendingReset(false);
      setResetSuccessMessage(err?.message || 'Failed to send reset email. Please try again.');
    }
  };

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
              Welcome Back to Smart Agri Connect
            </h2>
            <p className="text-sm text-emerald-100/80 mt-4 leading-relaxed">
              Sign in to manage your active farming contracts, track crop delivery stages, or discover new produce orders.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-8 border-t border-emerald-700/50">
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
              <span>Encrypted & safe authentication</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
              <span>Instant access to market & contracts</span>
            </div>
          </div>
        </div>

        {/* Right Login Form Area */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          {/* Registration Success Alert Banner */}
          {showSuccessBanner && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold">Registration Successful!</p>
                <p className="mt-0.5 text-emerald-700">
                  Your Smart Agri Connect account has been created. Please sign in below using your credentials.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X size={18} />
              </button>
            </div>
          )}

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
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Login to Smart Agri Connect
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
            
            {/* Role Switcher */}
            <div className="flex bg-emerald-50/80 p-1 rounded-2xl mb-6 border border-emerald-100">
              {(['farmer', 'buyer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    role === r
                      ? 'bg-white text-emerald-800 shadow-md border border-emerald-200 font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)} Login
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
                        onClick={() => {
                          setCategory(cat.id);
                          localStorage.setItem('mock_category', cat.id);
                        }}
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

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs sm:text-sm text-center font-medium">
                  {error}
                </div>
              )}

              {/* Email or Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email or Phone Number *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="text"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="you@example.com or +91 9876543210"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(formData.email);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (error) setError('');
                    }}
                    className="block w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="login-button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      Sign In <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => {
                setIsForgotPasswordOpen(false);
                setResetSuccessMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={24} />
            </div>

            <h3 className="text-xl font-bold text-gray-900">Forgot Password?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Enter your registered email address to receive password reset instructions.
            </p>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm">
                  {resetSuccessMessage}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setResetSuccessMessage('');
                  }}
                  className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-2xl text-sm hover:bg-emerald-700 transition-colors"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-2xl text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isSendingReset ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}