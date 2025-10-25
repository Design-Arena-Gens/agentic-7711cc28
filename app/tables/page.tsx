'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { tablesAPI, ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTables, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTables = async () => {
    try {
      const res = await tablesAPI.getAll();
      setTables(res.data);
    } catch (error) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleTableClick = (table: any) => {
    if (table.status === 'available') {
      // Start new order for this table
      router.push(`/pos/restaurant?table=${table.id}`);
    } else {
      // View existing order
      toast.success(`Table ${table.table_number} is ${table.status}`);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Table Management" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Table Management" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Reserved</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className="relative bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition border-2 border-gray-200 hover:border-primary-300"
            >
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)}`}></div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {table.table_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {table.seats} {table.seats === 1 ? 'Seat' : 'Seats'}
                </p>
                <p className="text-xs text-gray-500 mt-2 capitalize">
                  {table.status}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
