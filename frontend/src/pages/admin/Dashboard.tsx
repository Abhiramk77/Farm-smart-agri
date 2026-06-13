import React from 'react';
import { Users, FileText, Settings, Activity } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { title: 'Total Farmers', value: '1,245', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Total Buyers', value: '843', icon: Users, color: 'text-green-500', bg: 'bg-green-100' },
    { title: 'Active Contracts', value: '432', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-100' },
    { title: 'Platform Health', value: '98%', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New Farmer Registration</p>
                <p className="text-xs text-gray-500">John Doe (Agriculture)</p>
              </div>
              <span className="text-xs text-gray-400">2 mins ago</span>
            </div>
            <div className="flex items-center space-x-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Contract Completed</p>
                <p className="text-xs text-gray-500">Contract #4928</p>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
            <div className="flex items-center space-x-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New Buyer Registration</p>
                <p className="text-xs text-gray-500">Acme Corp</p>
              </div>
              <span className="text-xs text-gray-400">3 hours ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700 hover:text-primary">
              Manage Users
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700 hover:text-primary">
              View All Contracts
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700 hover:text-primary">
              <div className="flex items-center gap-2">
                <Settings size={16} /> Platform Settings
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
