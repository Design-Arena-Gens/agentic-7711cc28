'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { productsAPI, inventoryAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiTrendingDown, FiPackage } from 'react-icons/fi';

export default function InventoryPage() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lowStockRes, expiringRes] = await Promise.all([
        productsAPI.getLowStock(),
        inventoryAPI.getExpiring(),
      ]);
      setLowStock(lowStockRes.data);
      setExpiring(expiringRes.data);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Inventory" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Inventory Management" />
      <div className="p-6 space-y-6">
        {/* Alert cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{lowStock.length}</h3>
                <p className="text-red-100 text-sm">Low Stock Items</p>
              </div>
            </div>
            <p className="text-sm text-red-100">
              These items need restocking soon to avoid stockouts
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiTrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{expiring.length}</h3>
                <p className="text-orange-100 text-sm">Expiring Soon</p>
              </div>
            </div>
            <p className="text-sm text-orange-100">
              Items expiring within 30 days - prioritize these sales
            </p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-red-600" />
            Low Stock Alert
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Current Stock</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Threshold</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FiPackage className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold text-sm">
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {product.low_stock_threshold}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lowStock.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>✅ All items are well stocked</p>
            </div>
          )}
        </div>

        {/* Expiring Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingDown className="text-orange-600" />
            Expiring Soon (Next 30 Days)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Batch #</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expiry Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.batch_number}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
                            daysLeft <= 7
                              ? 'bg-red-100 text-red-700'
                              : daysLeft <= 15
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {daysLeft} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {expiring.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>✅ No items expiring soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
