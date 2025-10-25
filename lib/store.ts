import { create } from 'zustand';

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  variantInfo?: any;
  addons?: any[];
  notes?: string;
  trackInventory?: boolean;
}

interface CartStore {
  items: CartItem[];
  tableId: number | null;
  orderType: string;
  customerName: string;
  customerPhone: string;
  discount: number;
  couponCode: string;
  addItem: (item: CartItem) => void;
  updateItem: (productId: number, updates: Partial<CartItem>) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setTableId: (tableId: number | null) => void;
  setOrderType: (type: string) => void;
  setCustomer: (name: string, phone: string) => void;
  setDiscount: (discount: number) => void;
  setCouponCode: (code: string) => void;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableId: null,
  orderType: 'dine-in',
  customerName: '',
  customerPhone: '',
  discount: 0,
  couponCode: '',

  addItem: (item) => {
    const items = get().items;
    const existingIndex = items.findIndex((i) => i.productId === item.productId);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += item.quantity;
      newItems[existingIndex].total = 
        newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      set({ items: newItems });
    } else {
      set({ items: [...items, item] });
    }
  },

  updateItem: (productId, updates) => {
    const items = get().items;
    const newItems = items.map((item) => {
      if (item.productId === productId) {
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });
    set({ items: newItems });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.productId !== productId) });
  },

  clearCart: () => {
    set({
      items: [],
      tableId: null,
      orderType: 'dine-in',
      customerName: '',
      customerPhone: '',
      discount: 0,
      couponCode: '',
    });
  },

  setTableId: (tableId) => set({ tableId }),
  setOrderType: (type) => set({ orderType: type }),
  setCustomer: (name, phone) => set({ customerName: name, customerPhone: phone }),
  setDiscount: (discount) => set({ discount }),
  setCouponCode: (code) => set({ couponCode: code }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getTaxAmount: () => {
    return get().items.reduce((sum, item) => {
      const itemTax = (item.total * item.taxRate) / 100;
      return sum + itemTax;
    }, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount();
    const discount = get().discount;
    return subtotal + tax - discount;
  },
}));

// Offline sync store
interface OfflineStore {
  pendingOrders: any[];
  isOnline: boolean;
  addPendingOrder: (order: any) => void;
  removePendingOrder: (orderId: string) => void;
  setOnline: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineStore>((set) => ({
  pendingOrders: [],
  isOnline: true,

  addPendingOrder: (order) => {
    set((state) => ({
      pendingOrders: [...state.pendingOrders, order],
    }));
  },

  removePendingOrder: (orderId) => {
    set((state) => ({
      pendingOrders: state.pendingOrders.filter((o) => o.id !== orderId),
    }));
  },

  setOnline: (online) => set({ isOnline: online }),
}));
