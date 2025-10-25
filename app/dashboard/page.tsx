'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { analyticsAPI } from '@/lib/api';
import {
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardRes, trendRes] = await Promise.all([
        analyticsAPI.getDashboard(1, period),
        analyticsAPI.getSalesTrend(1, 30),
      ]);

      setData(dashboardRes.data);
      setSalesTrend(
        trendRes.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(d.revenue),
          orders: parseInt(d.orders),
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-6">
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const summary = data.summary;
  const statCards = [
    {
      icon: FiDollarSign,
      label: 'Total Revenue',
      value: `$${parseFloat(summary.total_revenue || 0).toFixed(2)}`,
      change: '+12.5%',
      color: 'bg-green-500',
    },
    {
      icon: FiShoppingCart,
      label: 'Total Orders',
      value: summary.total_orders || 0,
      change: '+8.2%',
      color: 'bg-blue-500',
    },
    {
      icon: FiTrendingUp,
      label: 'Avg Order Value',
      value: `$${parseFloat(summary.avg_order_value || 0).toFixed(2)}`,
      change: '+4.3%',
      color: 'bg-purple-500',
    },
    {
      icon: FiUsers,
      label: 'Customers',
      value: '245',
      change: '+15.8%',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Period selector */}
        <div className="flex gap-2">
          {['today', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">{card.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment methods */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  dataKey="total"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.paymentMethods.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top products and order types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top products */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-sm text-gray-500">{product.quantity_sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${parseFloat(product.revenue).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order types */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.orderTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="order_type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions and alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiClock className="text-primary-600" />
              Hourly Sales Today
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.hourlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiAlertCircle />
              Quick Insights
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90 mb-1">Peak Hour</p>
                <p className="text-xl font-bold">12:00 - 2:00 PM</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90 mb-1">Best Seller</p>
                <p className="text-xl font-bold">
                  {data.topProducts[0]?.product_name || 'N/A'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90 mb-1">Growth This Week</p>
                <p className="text-xl font-bold">+18.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
