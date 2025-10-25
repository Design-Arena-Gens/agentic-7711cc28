'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useOfflineStore } from '@/lib/store';

export default function Header({ title }: { title: string }) {
  const { isOnline, setOnline, pendingOrders } = useOfflineStore();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('pos_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Monitor online status
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Online/Offline indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isOnline ? (
              <FiWifi className="w-4 h-4" />
            ) : (
              <FiWifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Pending sync indicator */}
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800">
              <span className="text-sm font-medium">
                {pendingOrders.length} Pending Sync
              </span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <FiBell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Staff'}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
