import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import {
  Home,
  FileText,
  MessageSquare,
  User as UserIcon,
  Bell,
  Menu,
  LogOut,
  ArrowLeft,
  Leaf,
  Repeat,
  X,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ClipboardList,
  Banknote,
  Users,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const userNotifications = MOCK_NOTIFICATIONS.filter(
    (n) => n.targetRole === user?.role
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isBuyer = user?.role === 'buyer';
  const basePath = isBuyer ? '/buyer' : '/farmer';
  const navItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: `${basePath}/dashboard`,
    },
    {
      icon: isBuyer ? Users : Building2,
      label: isBuyer ? 'Farmer Info' : 'Buyer Info',
      path: isBuyer ? `${basePath}/farmers` : `${basePath}/buyers`,
    },
    {
      icon: FileText,
      label: isBuyer ? 'Contracts' : 'Marketplace',
      path: isBuyer ? `${basePath}/contracts` : `${basePath}/marketplace`,
    },
    {
      icon: ClipboardList,
      label: 'Orders',
      path: `${basePath}/orders`,
    },
    {
      icon: Banknote,
      label: 'COD Payments',
      path: `${basePath}/payments`,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRoleToggle = () => {
    const nextRole = isBuyer ? 'farmer' : 'buyer';
    switchRole(nextRole);
    if (nextRole === 'buyer') {
      navigate('/buyer/dashboard');
    } else {
      navigate('/farmer/dashboard');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const categoryName = user.category
    ? user.category.charAt(0).toUpperCase() + user.category.slice(1)
    : localStorage.getItem('mock_category')
    ? localStorage.getItem('mock_category')!.charAt(0).toUpperCase() +
      localStorage.getItem('mock_category')!.slice(1)
    : '';

  const displayRoleTitle = isBuyer
    ? 'Buyer'
    : categoryName
    ? `${categoryName} Farmer`
    : 'Farmer';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Top Navbar (Mobile & Desktop) */}
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-30 h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 md:p-2 -ml-1 md:-ml-2 text-gray-500 hover:bg-gray-100 hover:text-primary rounded-full transition-colors focus:outline-none"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-primary/20 shadow-xs">
            <img src="farmer_buyer_logo.png" alt="FarmConnect Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-primary-dark hidden sm:block">
            FarmConnect
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              className="p-2 text-gray-500 hover:text-primary relative focus:outline-none"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">
                    Notifications
                  </h3>
                  <button className="text-xs text-primary hover:text-primary-dark font-medium">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4
                            className={`text-sm ${
                              !notification.read
                                ? 'font-semibold text-gray-900'
                                : 'font-medium text-gray-800'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                            {notification.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                      <Bell size={24} className="mb-2 text-gray-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
            title="Click to view saved account profile info"
          >
            <div
              className={`w-9 h-9 ${
                isBuyer
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-emerald-600 text-white border-emerald-700'
              } rounded-full flex items-center justify-center font-bold shadow-xs border`}
            >
              {isBuyer ? <Building2 size={18} /> : <UserCheck size={18} />}
            </div>
            <span className="text-sm font-medium hidden md:block text-gray-800">
              {user.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-500 hidden md:block"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-16 bottom-0 z-20">
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Current Role</p>
              <p className="text-sm font-semibold capitalize text-primary">
                {displayRoleTitle}
              </p>
            </div>

          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 mt-16 md:ml-64 pb-20 md:pb-0 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-30 flex justify-around items-center h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'fill-primary/20' : ''}
              />

              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

      {/* Account Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
              <div
                className={`w-16 h-16 ${
                  isBuyer
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                } rounded-2xl flex items-center justify-center font-bold border shadow-xs`}
              >
                {isBuyer ? <Building2 size={30} /> : <UserCheck size={30} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize mt-1">
                  {user.role === 'farmer' ? `${user.category || ''} Farmer` : 'Buyer'} Account
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Saved Account Information
            </h4>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <UserIcon size={16} className="text-primary" /> Full Name
                </span>
                <span className="font-semibold text-gray-900">{user.name || 'Not set'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Mail size={16} className="text-primary" /> Email
                </span>
                <span className="font-semibold text-gray-900">
                  {user.email || localStorage.getItem('mock_user_email') || 'Not set'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Phone size={16} className="text-primary" /> Mobile
                </span>
                <span className="font-semibold text-gray-900">
                  {user.mobile || localStorage.getItem('mock_user_mobile') || 'Not set'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> Location
                </span>
                <span className="font-semibold text-gray-900">
                  {user.city || localStorage.getItem('mock_user_city')
                    ? `${user.city || localStorage.getItem('mock_user_city')}, ${user.state || localStorage.getItem('mock_user_state')}`
                    : user.state || localStorage.getItem('mock_user_state') || 'Not set'}
                </span>
              </div>

              {user.role === 'farmer' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" /> Farmer Category
                  </span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {user.category || 'dairy'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <LogOut size={16} /> Sign Out
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-dark rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}