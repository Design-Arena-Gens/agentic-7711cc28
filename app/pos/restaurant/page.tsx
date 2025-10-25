'use client';

import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI, ordersAPI, paymentsAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { FiSearch, FiMinus, FiPlus, FiTrash2, FiCreditCard, FiPercent } from 'react-icons/fi';

export default function RestaurantPOSPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const cart = useCartStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

  const loadData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        categoriesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data.filter((p: any) => p.is_available));
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product: any) => {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: parseFloat(product.price),
      taxRate: parseFloat(product.tax_rate || 0),
      total: parseFloat(product.price),
      trackInventory: product.track_inventory,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const orderData = {
        businessId: 1,
        orderType: cart.orderType,
        tableId: cart.tableId,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        items: cart.items,
        subtotal: cart.getSubtotal(),
        taxAmount: cart.getTaxAmount(),
        discountAmount: cart.discount,
        totalAmount: cart.getTotal(),
        createdBy: 1,
      };

      const orderRes = await ordersAPI.create(orderData);

      // Create payment
      await paymentsAPI.create({
        orderId: orderRes.data.id,
        paymentMethod,
        amount: cart.getTotal(),
        createdBy: 1,
      });

      // Complete order
      await ordersAPI.complete(orderRes.data.id);

      toast.success('Order completed successfully!');
      cart.clearCart();
      setShowPayment(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Search bar */}
        <div className="bg-white p-4 shadow-sm border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 border-b shadow-sm overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition touch-btn ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition touch-btn ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-200 text-left touch-btn"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                <p className="text-lg font-bold text-primary-600">${parseFloat(product.price).toFixed(2)}</p>
                {product.track_inventory && (
                  <p className="text-xs text-gray-500 mt-1">Stock: {product.stock_quantity}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-white shadow-2xl flex flex-col">
        <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <h2 className="text-xl font-bold">Current Order</h2>
          <p className="text-sm opacity-90">Restaurant POS</p>
        </div>

        {/* Order type selector */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            {['dine-in', 'takeaway', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => cart.setOrderType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition touch-btn capitalize ${
                  cart.orderType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <p className="text-5xl mb-4">🛒</p>
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                  <button
                    onClick={() => cart.removeItem(item.productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        cart.updateItem(item.productId, {
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border touch-btn"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() =>
                        cart.updateItem(item.productId, {
                          quantity: item.quantity + 1,
                        })
                      }
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border touch-btn"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold text-gray-900">${item.total.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart summary */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">${cart.getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold">${cart.getTaxAmount().toFixed(2)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-${cart.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span className="text-primary-600">${cart.getTotal().toFixed(2)}</span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowPayment(!showPayment)}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition shadow-lg touch-btn"
              >
                <FiCreditCard className="inline mr-2" />
                Proceed to Payment
              </button>

              {showPayment && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Select Payment Method:</p>
                  {['cash', 'card', 'upi', 'wallet'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleCheckout(method)}
                      className="w-full py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition capitalize touch-btn"
                    >
                      {method}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => cart.clearCart()}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition touch-btn"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
