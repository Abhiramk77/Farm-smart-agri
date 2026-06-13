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
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VoiceAssistant } from './VoiceAssistant';
export function Layout({ children }: {children: React.ReactNode;}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const userNotifications = MOCK_NOTIFICATIONS.filter(n => n.targetRole === user?.role);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
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
    path: `${basePath}/dashboard`
  },
  {
    icon: FileText,
    label: isBuyer ? 'Contracts' : 'Marketplace',
    path: isBuyer ? `${basePath}/contracts` : `${basePath}/marketplace`
  },
  {
    icon: MessageSquare,
    label: 'Chat',
    path: '/chat'
  },
  {
    icon: CreditCard,
    label: 'Payment Status',
    path: `${basePath}/payments`
  }];

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }
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
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold text-lg text-primary-dark hidden sm:block">
            Smart Agri
          </span>
        </div>

        <div className="flex items-center gap-4">
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
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button className="text-xs text-primary hover:text-primary-dark font-medium">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
              <img
                src={`https://ui-avatars.com/api/?name=${user.name}&background=2D6A4F&color=fff`}
                alt="Avatar" />
              
            </div>
            <span className="text-sm font-medium hidden md:block">
              {user.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-500 hidden md:block"
            title="Logout">
            
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`}>
                
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>);

          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Current Role</p>
            <p className="text-sm font-medium capitalize">
              {user.role} {user.category ? `(${user.category})` : ''}
            </p>
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
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
              
              <item.icon
                size={20}
                className={isActive ? 'fill-primary/20' : ''} />
              
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>);

        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500">
          
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

      <VoiceAssistant />
    </div>);

}