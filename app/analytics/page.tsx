'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { analyticsAPI } from '@/lib/api';
import { FiTrendingUp, FiAlertCircle, FiZap, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [forecastRes, peakRes, recsRes] = await Promise.all([
        analyticsAPI.getForecast(),
        analyticsAPI.getPeakHours(),
        analyticsAPI.getRecommendations(),
      ]);

      setForecast(forecastRes.data.slice(0, 10));
      setPeakHours(peakRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load AI analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="AI Analytics" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="AI Business Assistant" />
      <div className="p-6 space-y-6">
        {/* AI Insights Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <FiZap className="w-8 h-8" />
            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
          </div>
          <p className="text-purple-100">
            Advanced analytics and predictions powered by machine learning to help you make better business decisions
          </p>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => {
            const icons = {
              stock_alert: FiAlertCircle,
              menu_optimization: FiTrendingUp,
              promote: FiZap,
            };
            const Icon = icons[rec.type as keyof typeof icons] || FiAlertCircle;
            const colors = {
              high: 'from-red-500 to-red-600',
              medium: 'from-yellow-500 to-yellow-600',
              low: 'from-blue-500 to-blue-600',
            };

            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className={`bg-gradient-to-r ${colors[rec.priority as keyof typeof colors]} p-4 text-white`}>
                  <Icon className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">{rec.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  {rec.items && rec.items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {rec.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-500">
                            {item.quantity_sold !== undefined && `Sold: ${item.quantity_sold}`}
                            {item.total_sold !== undefined && `Sold: ${item.total_sold}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Demand Forecasting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-600" />
            Demand Forecasting & Restock Suggestions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Daily Sales</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">7-Day Forecast</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Recommended Restock</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {item.avgDailySales.toFixed(1)} units
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex justify-end gap-1">
                        {item.nextWeekForecast.slice(0, 7).map((day: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-8 h-8 bg-primary-100 text-primary-700 rounded flex items-center justify-center text-xs font-medium"
                            title={day.date}
                          >
                            {day.forecastQuantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                        {item.recommendedRestock} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Peak Hours Analysis */}
        {peakHours && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiClock className="text-primary-600" />
              Peak Hours Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Busiest Hours</h4>
                <div className="space-y-2">
                  {peakHours.peakHours.slice(0, 5).map((hour: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">
                          {hour.hour}:00 - {hour.hour + 1}:00
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{hour.avgOrders} orders</p>
                        <p className="text-xs text-gray-500">${hour.avgValue.toFixed(2)} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Insights</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">Busiest Hour</p>
                    <p className="text-2xl font-bold text-green-700">
                      {peakHours.insights.busiestHour?.hour}:00
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Avg {peakHours.insights.busiestHour?.avgOrders} orders
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Quietest Hour</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {peakHours.insights.quietestHour?.hour}:00
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Avg {peakHours.insights.quietestHour?.avgOrders} orders
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-900 mb-2">💡 Recommendation</p>
                    <p className="text-xs text-purple-700">
                      Schedule more staff during peak hours ({peakHours.insights.busiestHour?.hour}:00) 
                      and reduce staffing during quiet periods.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
