import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
};

export const productsAPI = {
  getAll: (businessId: number = 1) => api.get(`/products?businessId=${businessId}`),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getLowStock: (businessId: number = 1) => api.get(`/products/alerts/low-stock?businessId=${businessId}`),
};

export const categoriesAPI = {
  getAll: (businessId: number = 1) => api.get(`/categories?businessId=${businessId}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const ordersAPI = {
  getAll: (businessId: number = 1, status?: string, limit?: number) => {
    let url = `/orders?businessId=${businessId}`;
    if (status) url += `&status=${status}`;
    if (limit) url += `&limit=${limit}`;
    return api.get(url);
  },
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId: number, itemId: number, status: string) =>
    api.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
  complete: (id: number) => api.post(`/orders/${id}/complete`),
};

export const paymentsAPI = {
  getByOrder: (orderId: number) => api.get(`/payments/order/${orderId}`),
  create: (data: any) => api.post('/payments', data),
};

export const tablesAPI = {
  getAll: (businessId: number = 1) => api.get(`/tables?businessId=${businessId}`),
  getOrder: (tableId: number) => api.get(`/tables/${tableId}/order`),
  create: (data: any) => api.post('/tables', data),
  update: (id: number, data: any) => api.put(`/tables/${id}`, data),
  delete: (id: number) => api.delete(`/tables/${id}`),
};

export const customersAPI = {
  getAll: (businessId: number = 1) => api.get(`/customers?businessId=${businessId}`),
  getByPhone: (phone: string) => api.get(`/customers/phone/${phone}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  addPoints: (id: number, points: number) =>
    api.post(`/customers/${id}/points`, { points }),
};

export const inventoryAPI = {
  getBatches: (productId: number) =>
    api.get(`/inventory/product/${productId}/batches`),
  getExpiring: (businessId: number = 1, days: number = 30) =>
    api.get(`/inventory/expiring?businessId=${businessId}&days=${days}`),
  addBatch: (data: any) => api.post('/inventory/batch', data),
  adjustStock: (productId: number, quantity: number, reason: string) =>
    api.post('/inventory/adjust', { productId, quantity, reason }),
};

export const suppliersAPI = {
  getAll: (businessId: number = 1) => api.get(`/suppliers?businessId=${businessId}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const couponsAPI = {
  getAll: (businessId: number = 1) => api.get(`/coupons?businessId=${businessId}`),
  validate: (code: string, orderAmount: number, businessId: number = 1) =>
    api.post('/coupons/validate', { code, orderAmount, businessId }),
  create: (data: any) => api.post('/coupons', data),
  use: (id: number) => api.post(`/coupons/${id}/use`),
};

export const analyticsAPI = {
  getDashboard: (businessId: number = 1, period: string = 'today') =>
    api.get(`/analytics/dashboard?businessId=${businessId}&period=${period}`),
  getSalesTrend: (businessId: number = 1, days: number = 30) =>
    api.get(`/analytics/sales-trend?businessId=${businessId}&days=${days}`),
  getCategoryPerformance: (businessId: number = 1, days: number = 30) =>
    api.get(`/analytics/category-performance?businessId=${businessId}&days=${days}`),
  getForecast: (businessId: number = 1) =>
    api.get(`/analytics/ai/forecast?businessId=${businessId}`),
  getPeakHours: (businessId: number = 1) =>
    api.get(`/analytics/ai/peak-hours?businessId=${businessId}`),
  getRecommendations: (businessId: number = 1) =>
    api.get(`/analytics/ai/recommendations?businessId=${businessId}`),
};
