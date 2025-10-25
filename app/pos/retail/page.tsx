'use client';

import { useEffect, useState } from 'react';
import { productsAPI, ordersAPI, paymentsAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { FiSearch, FiMinus, FiPlus, FiTrash2, FiCreditCard, FiMaximize } from 'react-icons/fi';

export default function RetailPOSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const cart = useCartStore();

  useEffect(() => {
    loadProducts();
    cart.setOrderType('retail');
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data.filter((p: any) => p.is_available));
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) return;

    const product = products.find(
      (p) =>
        p.barcode === barcodeInput ||
        p.sku === barcodeInput ||
        p.id.toString() === barcodeInput
    );

    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast.error('Product not found');
    }
  };

  const addToCart = (product: any) => {
    if (product.track_inventory && product.stock_quantity <= 0) {
      toast.error('Product out of stock');
      return;
    }

    cart.addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: parseFloat(product.price),
      taxRate: parseFloat(product.tax_rate || 0),
      total: parseFloat(product.price),
      trackInventory: product.track_inventory,
    });
    toast.success(`${product.name} added`);
  };

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product?.track_inventory && product.stock_quantity < item.quantity) {
        toast.error(`Insufficient stock for ${item.productName}`);
        return;
      }
    }

    try {
      const orderData = {
        businessId: 1,
        orderType: 'retail',
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

      await paymentsAPI.create({
        orderId: orderRes.data.id,
        paymentMethod,
        amount: cart.getTotal(),
        createdBy: 1,
      });

      await ordersAPI.complete(orderRes.data.id);

      toast.success('Sale completed!');
      cart.clearCart();
      setShowPayment(false);
      
      // Reload products to update stock
      loadProducts();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side - Barcode & Search */}
      <div className="flex-1 flex flex-col">
        {/* Barcode scanner */}
        <div className="bg-white p-6 shadow-sm border-b">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Retail POS - Quick Scan</h2>
          <form onSubmit={handleBarcodeSearch} className="flex gap-3">
            <div className="relative flex-1">
              <FiMaximize className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or enter SKU/ID..."
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition touch-btn"
            >
              Add
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Use a barcode scanner or type product ID/SKU/barcode and press Enter
          </p>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Select Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.track_inventory && product.stock_quantity <= 0}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-200 text-left touch-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{product.name}</h3>
                {product.sku && (
                  <p className="text-xs text-gray-500 mb-1">SKU: {product.sku}</p>
                )}
                <p className="text-lg font-bold text-primary-600">${parseFloat(product.price).toFixed(2)}</p>
                {product.track_inventory && (
                  <p className={`text-xs mt-1 font-medium ${
                    product.stock_quantity <= product.low_stock_threshold
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    Stock: {product.stock_quantity}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-white shadow-2xl flex flex-col">
        <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
          <h2 className="text-xl font-bold">Current Sale</h2>
          <p className="text-sm opacity-90">Retail POS</p>
        </div>

        {/* Customer info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-2">
            <input
              type="text"
              value={cart.customerName}
              onChange={(e) => cart.setCustomer(e.target.value, cart.customerPhone)}
              placeholder="Customer Name (Optional)"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="tel"
              value={cart.customerPhone}
              onChange={(e) => cart.setCustomer(cart.customerName, e.target.value)}
              placeholder="Phone Number (Optional)"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <p className="text-5xl mb-4">🛍️</p>
              <p>Cart is empty</p>
              <p className="text-sm">Scan or add items</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{item.productName}</h4>
                    <p className="text-xs text-gray-500">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.productId)}
                    className="text-red-500 hover:text-red-700 ml-2"
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
                      className="w-7 h-7 bg-white rounded flex items-center justify-center border text-sm touch-btn"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() =>
                        cart.updateItem(item.productId, {
                          quantity: item.quantity + 1,
                        })
                      }
                      className="w-7 h-7 bg-white rounded flex items-center justify-center border text-sm touch-btn"
                    >
                      <FiPlus className="w-3 h-3" />
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
              <span className="text-gray-600">Tax (GST)</span>
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
              <span className="text-green-600">${cart.getTotal().toFixed(2)}</span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowPayment(!showPayment)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition shadow-lg touch-btn"
              >
                <FiCreditCard className="inline mr-2" />
                Proceed to Payment
              </button>

              {showPayment && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method:</p>
                  {['cash', 'card', 'upi', 'wallet'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleCheckout(method)}
                      className="w-full py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition capitalize touch-btn font-medium"
                    >
                      {method === 'upi' ? 'UPI' : method.charAt(0).toUpperCase() + method.slice(1)}
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
