'use client';

import Header from '@/components/Header';
import { FiSettings, FiPrinter, FiCreditCard, FiUser, FiShield } from 'react-icons/fi';

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-6">
        {/* Business Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiSettings className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">Business Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                defaultValue="Demo Restaurant"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>Restaurant</option>
                <option>Retail Shop</option>
                <option>Cafe</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                defaultValue="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Printer Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiPrinter className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">Printer Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Receipt Printer</p>
                <p className="text-sm text-gray-500">Main counter printer</p>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Kitchen Printer</p>
                <p className="text-sm text-gray-500">For kitchen orders</p>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Bar Printer</p>
                <p className="text-sm text-gray-500">For beverage orders</p>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiCreditCard className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
          </div>
          <div className="space-y-3">
            {['Cash', 'Credit/Debit Card', 'UPI', 'Wallet'].map((method) => (
              <div key={method} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium text-gray-900">{method}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiUser className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-bold text-gray-900">User Management</h3>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              Add User
            </button>
          </div>
          <p className="text-gray-600">Manage staff access and permissions</p>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiShield className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">Security & Backup</h3>
          </div>
          <div className="space-y-4">
            <button className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Backup Data Now
            </button>
            <p className="text-sm text-gray-600">Last backup: Today at 3:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
