'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { customersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiStar, FiPhone, FiMail } from 'react-icons/fi';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await customersAPI.getAll();
      setCustomers(res.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Customers" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Customer Management" />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600">Manage customer database and loyalty program</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <FiPlus />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      <FiStar className="fill-current" />
                      <span className="text-gray-600">{customer.loyalty_points} pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiPhone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                  <p className="font-bold text-gray-900">
                    ${parseFloat(customer.total_spent || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Visits</p>
                  <p className="font-bold text-gray-900">{customer.visit_count}</p>
                </div>
              </div>

              {customer.last_visit && (
                <p className="text-xs text-gray-500 mt-3">
                  Last visit: {new Date(customer.last_visit).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">👥</p>
            <p>No customers yet</p>
            <p className="text-sm">Start adding customers to build your database</p>
          </div>
        )}
      </div>
    </div>
  );
}
