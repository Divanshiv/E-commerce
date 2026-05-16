import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, Wallet, IndianRupee, ShieldCheck, Zap } from 'lucide-react';

const METHOD_CONFIG = {
  card:         { icon: CreditCard,     gradient: 'from-blue-500 to-purple-600', label: 'Credit / Debit Card',     desc: 'Visa, Mastercard, Rupay & more' },
  google_pay:   { icon: Smartphone,     gradient: 'from-blue-500 to-blue-700',    label: 'Google Pay',               desc: 'Fast & secure UPI payments' },
  phonepe:      { icon: Smartphone,     gradient: 'from-purple-500 to-indigo-600',label: 'PhonePe',                 desc: 'Pay using PhonePe UPI' },
  paytm_wallet: { icon: Wallet,         gradient: 'from-blue-400 to-blue-600',   label: 'Paytm Wallet',             desc: 'Pay using Paytm balance, UPI & cards' },
  cod:          { icon: IndianRupee,    gradient: 'from-amber-400 to-orange-600', label: 'Cash on Delivery',         desc: 'Pay when you receive your order' }
};

const RAZORPAY_METHOD_MAP = {
  card: 'card',
  google_pay: 'upi',
  phonepe: 'upi',
  paytm_wallet: 'wallet'
};

export default function Checkout() {
  const { cart, subtotal, discount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/payments/config');
        setPaymentConfig(data.data);
        const methods = data.data.allowedMethods || [];
        const first = methods.includes('card') ? 'card'
                   : methods.includes('google_pay') ? 'google_pay'
                   : methods.includes('phonepe') ? 'phonepe'
                   : methods.includes('paytm_wallet') ? 'paytm_wallet'
                   : methods.includes('cod') ? 'cod'
                   : 'card';
        setPaymentMethod(first);
      } catch {
        setPaymentConfig({ allowedMethods: ['card', 'google_pay', 'phonepe', 'paytm_wallet', 'cod'], codEnabled: true, codCharges: 30 });
      }
    })();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const shipping = subtotal - discount >= 999 ? 0 : 49;
  const total = subtotal - discount + shipping;

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const openRazorpayCheckout = async (orderData, order, method) => {
    const razorpayMethod = RAZORPAY_METHOD_MAP[method] || 'upi';

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.data.amount,
      currency: 'INR',
      name: 'Kalaah Studio',
      description: `Order ${order.orderNumber || order._id}`,
      order_id: orderData.data.razorpayOrderId,
      ...(method === 'google_pay' ? {
        method: 'upi',
        upi: {
          // Pre-fill UPI handler — user can choose Google Pay from UPI apps list
        }
      } : razorpayMethod ? { method: razorpayMethod } : {}),
      handler: async (response) => {
        try {
          await api.post('/payments/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          clearCart();
          navigate(`/order-success/${order._id}`, {
            state: { orderNumber: order.orderNumber }
          });
        } catch {
          setPaymentError('Payment verification failed. Please contact support with your order number.');
          toast.error('Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setPaymentError('Payment cancelled. You can retry or choose a different method.');
        }
      },
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: address.phone
      },
      theme: {
        color: '#dc2626'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      const reason = response.error?.description || 'Payment failed';
      setPaymentError(`${reason}. You can retry or choose a different method.`);
      toast.error(reason);
      setLoading(false);
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.pincode || !address.phone) {
      toast.error('Please fill all address fields');
      return;
    }

    try {
      setLoading(true);
      setPaymentError(null);

      if (paymentMethod === 'google_pay') {
        const { data: orderData } = await api.post('/payments/google-pay/order', {
          address,
          couponCode: cart.couponApplied?.code
        });
        const order = orderData.data.order;
        await openRazorpayCheckout(orderData, order, 'google_pay');
      } else if (paymentMethod !== 'cod') {
        const { data: orderData } = await api.post('/payments/razorpay/order', {
          address,
          couponCode: cart.couponApplied?.code,
          paymentMethod
        });
        const order = orderData.data.order;
        await openRazorpayCheckout(orderData, order, paymentMethod);
      } else {
        const { data } = await api.post('/payments/cod', { address });
        const order = data.data.order;
        clearCart();
        navigate(`/order-success/${order._id}`, {
          state: { orderNumber: order.orderNumber }
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to place order';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="text-red-600 font-medium">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200'
                }`}>1</div>
                <span className="font-medium">Address</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200'
                }`}>2</div>
                <span className="font-medium">Payment</span>
              </div>
            </div>

            {/* Address Form */}
            {step === 1 && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4">Shipping Address</h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Street Address</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="123 Main Street"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Mumbai"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">State</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="Maharashtra"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Pincode</label>
                      <input
                        type="text"
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        placeholder="400001"
                        required
                        maxLength={6}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Phone</label>
                      <input
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="9876543210"
                        required
                        maxLength={10}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {/* Payment */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4">Payment Method</h2>
                <p className="text-sm text-gray-500 mb-4">Choose how you'd like to pay</p>

                <div className="grid gap-3">
                  {(paymentConfig?.allowedMethods || []).map(methodKey => {
                    if (methodKey === 'cod') {
                      if (!paymentConfig?.codEnabled) return null;
                      return (
                        <label key="cod" className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                          paymentMethod === 'cod' ? 'border-red-600 bg-red-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="radio" name="payment" value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="mt-1 text-red-600 accent-red-600" />
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-12 h-12 bg-gradient-to-br ${METHOD_CONFIG.cod.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                              <IndianRupee className="text-white" size={22} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{METHOD_CONFIG.cod.label}</p>
                              <p className="text-sm text-gray-500">{METHOD_CONFIG.cod.desc}</p>
                            </div>
                          </div>
                        </label>
                      );
                    }

                    const cfg = METHOD_CONFIG[methodKey];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    const isGPay = methodKey === 'google_pay';

                    return (
                      <div key={methodKey}>
                        <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                          paymentMethod === methodKey ? 'border-red-600 bg-red-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="radio" name="payment" value={methodKey}
                            checked={paymentMethod === methodKey}
                            onChange={() => setPaymentMethod(methodKey)}
                            className="mt-1 text-red-600 accent-red-600" />
                          <div className="flex items-center gap-3 flex-1">
                            {isGPay ? (
                              <div className="w-12 h-12 bg-[#1a73e8] rounded-lg flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 24 24" className="text-white" width="22" height="22" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              </div>
                            ) : (
                              <div className={`w-12 h-12 bg-gradient-to-br ${cfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                                <Icon className="text-white" size={22} />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{cfg.label}</p>
                              <p className="text-sm text-gray-500">{cfg.desc}</p>
                            </div>
                            {!isGPay && <ShieldCheck className="text-green-500 shrink-0" size={18} />}
                          </div>
                        </label>

                        {/* Google Pay - Professional Payment Sheet */}
                        {isGPay && paymentMethod === 'google_pay' && (
                          <div className="gpay-sheet animate-slide-down">
                            {/* Header */}
                            <div className="gpay-sheet-header">
                              <div className="gpay-sheet-brand">
                                <svg viewBox="0 0 272 92" className="gpay-logo" fill="none">
                                  <path d="M165.6 51.4c0-5.5 4.4-8.7 8.7-8.7 2.5 0 4.6 1 6.1 2.4l-2.5 2.5c-1-1-2.2-1.6-3.7-1.6-2.8 0-5 2.3-5 5.4 0 3.1 2.2 5.4 5 5.4 1.5 0 2.7-.6 3.7-1.6l2.5 2.5c-1.5 1.5-3.6 2.4-6.1 2.4-4.3 0-8.7-3.2-8.7-8.7zm23.6 0v14.4h-3.6V51.4h3.6v2.2c1.1-1.6 3-2.7 5.2-2.7 4 0 6.8 3.2 6.8 7.6 0 4.4-2.8 7.6-6.8 7.6-2.2 0-4.1-1-5.2-2.7v2.2h-3.6V51.4h3.6zm8.5 7.1c0-2.8-1.8-5-4.3-5s-4.3 2.2-4.3 5c0 2.8 1.8 5 4.3 5s4.3-2.2 4.3-5zm8.3-7.2c4.1 0 7.2 3.3 7.2 7.6 0 4.3-3.1 7.6-7.2 7.6-4.2 0-7.2-3.3-7.2-7.6 0-4.3 3-7.6 7.2-7.6zm0 3c-2.3 0-3.6 2-3.6 4.6s1.3 4.6 3.6 4.6c2.2 0 3.6-2 3.6-4.6s-1.4-4.6-3.6-4.6zm16.2-3c1.6 0 3 .5 4.2 1.6l-2 2.4c-.7-.7-1.5-1-2.5-1-2.1 0-3.6 1.7-3.6 4.5 0 2.8 1.5 4.5 3.6 4.5 1 0 1.8-.3 2.5-1l2 2.4c-1.2 1.1-2.6 1.6-4.2 1.6-4 0-7-2.9-7-7.5 0-4.6 3-7.5 7-7.5zm26.6 0v14.4h-3.6v-2.2c-1.1 1.6-3 2.7-5.2 2.7-4 0-6.8-3.2-6.8-7.6 0-4.4 2.8-7.6 6.8-7.6 2.2 0 4.1 1 5.2 2.7V51.4h3.6zm-8.5 7.1c0 2.8 1.8 5 4.3 5s4.3-2.2 4.3-5c0-2.8-1.8-5-4.3-5s-4.3 2.2-4.3 5zm22.6-7.1c2.6 0 4.6 1.3 5.7 3.3l-3 1.8c-.6-1.2-1.6-1.8-2.8-1.8-2 0-3.5 1.6-3.5 4.6s1.5 4.6 3.5 4.6c1.2 0 2.2-.6 2.8-1.8l3 1.8c-1.1 2-3.1 3.3-5.7 3.3-4.2 0-7.2-3.2-7.2-7.6 0-4.4 3-7.6 7.2-7.6zm10.2 14.4V56.8c0-1.7 1.3-2.8 3-2.8 1.7 0 3 1.1 3 2.8v8.9h3.6V56.8c0-1.7 1.4-2.8 3-2.8 1.7 0 3 1.1 3 2.8v8.9h3.6V56c0-3.7-2.5-6-5.8-6-2 0-3.6.8-4.8 2.2-1-1.4-2.6-2.2-4.6-2.2-1.8 0-3.4.8-4.5 2.2v-1.8h-3.6v14.3h3.6z" fill="currentColor"/>
                                  <circle cx="24" cy="46" r="24" fill="#4285F4"/>
                                  <path d="M33 34h-6v8h-8v6h8v8h6v-8h8v-6h-8v-8z" fill="white"/>
                                </svg>
                                <span className="gpay-badge gpay-badge-instant">
                                  <Zap size={10} /> Instant
                                </span>
                              </div>
                              <p className="gpay-sheet-sub">Pay fast & securely with your preferred UPI app</p>
                            </div>

                            {/* Payment Details Card */}
                            <div className="gpay-details-card">
                              <div className="gpay-details-title">Payment Details</div>
                              <div className="gpay-details-rows">
                                <div className="gpay-row">
                                  <span className="gpay-row-label">Subtotal</span>
                                  <span className="gpay-row-value">{formatPrice(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                  <div className="gpay-row gpay-row-discount">
                                    <span className="gpay-row-label">Discount</span>
                                    <span className="gpay-row-value">-{formatPrice(discount)}</span>
                                  </div>
                                )}
                                <div className="gpay-row">
                                  <span className="gpay-row-label">Shipping</span>
                                  <span className="gpay-row-value">{shipping === 0 ? <span className="text-green-600 font-semibold">FREE</span> : formatPrice(shipping)}</span>
                                </div>
                                <div className="gpay-divider" />
                                <div className="gpay-row gpay-row-total">
                                  <span className="gpay-total-label">Total</span>
                                  <span className="gpay-total-value">{formatPrice(total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Cart Items Preview */}
                            <div className="gpay-items-preview">
                              <div className="gpay-items-title">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</div>
                              <div className="gpay-items-list">
                                {cart.items.slice(0, 3).map((item, i) => (
                                  <div key={i} className="gpay-item">
                                    <img src={item.product?.images?.[0]?.url} alt="" className="gpay-item-img" />
                                    <div className="gpay-item-info">
                                      <div className="gpay-item-name">{item.product?.name}</div>
                                      <div className="gpay-item-meta">{item.quantity} × {item.size}</div>
                                    </div>
                                    <div className="gpay-item-price">{formatPrice(item.price * item.quantity)}</div>
                                  </div>
                                ))}
                                {cart.items.length > 3 && (
                                  <div className="gpay-item-more">+{cart.items.length - 3} more item{(cart.items.length - 3) > 1 ? 's' : ''}</div>
                                )}
                              </div>
                            </div>

                            {/* Pay Button */}
                            <button
                              onClick={handlePlaceOrder}
                              disabled={loading}
                              className="gpay-btn"
                            >
                              {loading ? (
                                <span className="gpay-btn-content">
                                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                <>
                                  <svg viewBox="0 0 272 92" className="gpay-btn-logo" fill="white">
                                    <path d="M165.6 51.4c0-5.5 4.4-8.7 8.7-8.7 2.5 0 4.6 1 6.1 2.4l-2.5 2.5c-1-1-2.2-1.6-3.7-1.6-2.8 0-5 2.3-5 5.4 0 3.1 2.2 5.4 5 5.4 1.5 0 2.7-.6 3.7-1.6l2.5 2.5c-1.5 1.5-3.6 2.4-6.1 2.4-4.3 0-8.7-3.2-8.7-8.7zm23.6 0v14.4h-3.6V51.4h3.6v2.2c1.1-1.6 3-2.7 5.2-2.7 4 0 6.8 3.2 6.8 7.6 0 4.4-2.8 7.6-6.8 7.6-2.2 0-4.1-1-5.2-2.7v2.2h-3.6V51.4h3.6zm8.5 7.1c0-2.8-1.8-5-4.3-5s-4.3 2.2-4.3 5c0 2.8 1.8 5 4.3 5s4.3-2.2 4.3-5zm8.3-7.2c4.1 0 7.2 3.3 7.2 7.6 0 4.3-3.1 7.6-7.2 7.6-4.2 0-7.2-3.3-7.2-7.6 0-4.3 3-7.6 7.2-7.6zm0 3c-2.3 0-3.6 2-3.6 4.6s1.3 4.6 3.6 4.6c2.2 0 3.6-2 3.6-4.6s-1.4-4.6-3.6-4.6zm16.2-3c1.6 0 3 .5 4.2 1.6l-2 2.4c-.7-.7-1.5-1-2.5-1-2.1 0-3.6 1.7-3.6 4.5 0 2.8 1.5 4.5 3.6 4.5 1 0 1.8-.3 2.5-1l2 2.4c-1.2 1.1-2.6 1.6-4.2 1.6-4 0-7-2.9-7-7.5 0-4.6 3-7.5 7-7.5zm26.6 0v14.4h-3.6v-2.2c-1.1 1.6-3 2.7-5.2 2.7-4 0-6.8-3.2-6.8-7.6 0-4.4 2.8-7.6 6.8-7.6 2.2 0 4.1 1 5.2 2.7V51.4h3.6zm-8.5 7.1c0 2.8 1.8 5 4.3 5s4.3-2.2 4.3-5c0-2.8-1.8-5-4.3-5s-4.3 2.2-4.3 5zm22.6-7.1c2.6 0 4.6 1.3 5.7 3.3l-3 1.8c-.6-1.2-1.6-1.8-2.8-1.8-2 0-3.5 1.6-3.5 4.6s1.5 4.6 3.5 4.6c1.2 0 2.2-.6 2.8-1.8l3 1.8c-1.1 2-3.1 3.3-5.7 3.3-4.2 0-7.2-3.2-7.2-7.6 0-4.4 3-7.6 7.2-7.6zm10.2 14.4V56.8c0-1.7 1.3-2.8 3-2.8 1.7 0 3 1.1 3 2.8v8.9h3.6V56.8c0-1.7 1.4-2.8 3-2.8 1.7 0 3 1.1 3 2.8v8.9h3.6V56c0-3.7-2.5-6-5.8-6-2 0-3.6.8-4.8 2.2-1-1.4-2.6-2.2-4.6-2.2-1.8 0-3.4.8-4.5 2.2v-1.8h-3.6v14.3h3.6z" fill="currentColor"/>
                                    <circle cx="24" cy="46" r="24" fill="white"/>
                                    <path d="M33 34h-6v8h-8v6h8v8h6v-8h8v-6h-8v-8z" fill="#4285F4"/>
                                  </svg>
                                  <span className="gpay-btn-text">Pay</span>
                                  <span className="gpay-btn-amount">{formatPrice(total)}</span>
                                </>
                              )}
                            </button>

                            {/* Footer Trust */}
                            <div className="gpay-footer">
                              <div className="gpay-footer-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                <span>256-bit encrypted — PCI DSS compliant</span>
                              </div>
                              <div className="gpay-footer-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                                <span>Protected by Razorpay & Google Pay security</span>
                              </div>
                              <div className="gpay-footer-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                <span>No extra charges — pay what you see</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}

                {/* Only show the bottom pay button for non-Google Pay methods */}
                {paymentMethod !== 'google_pay' && (
                  <>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                      <ShieldCheck size={14} />
                      <span>All online payments are securely processed by Razorpay</span>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : `Pay ${formatPrice(total)}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm max-h-60 overflow-y-auto mb-4">
                {cart.items?.map(item => (
                  <div key={item.product?._id} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0]?.url}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="line-clamp-1">{item.product?.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity} | Size: {item.size}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
