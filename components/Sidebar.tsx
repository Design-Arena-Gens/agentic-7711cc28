'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiCreditCard,
  FiTrendingUp,
  FiShoppingBag,
  FiGrid,
} from 'react-icons/fi';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    router.push('/login');
  };

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/dashboard' },
    { icon: FiShoppingCart, label: 'POS - Restaurant', href: '/pos/restaurant' },
    { icon: FiShoppingBag, label: 'POS - Retail', href: '/pos/retail' },
    { icon: FiGrid, label: 'Tables', href: '/tables' },
    { icon: FiPackage, label: 'Products', href: '/products' },
    { icon: FiCreditCard, label: 'Orders', href: '/orders' },
    { icon: FiUsers, label: 'Customers', href: '/customers' },
    { icon: FiTrendingUp, label: 'Inventory', href: '/inventory' },
    { icon: FiBarChart2, label: 'AI Analytics', href: '/analytics' },
    { icon: FiSettings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0 transition-all duration-300 shadow-2xl z-50`}
    >
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold">AI POS</h1>
              <p className="text-xs text-gray-400">Business Intelligence</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 p-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 transition ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
