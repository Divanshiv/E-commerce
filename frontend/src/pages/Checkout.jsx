import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, Wallet, IndianRupee, ShieldCheck } from 'lucide-react';

const METHOD_CONFIG = {
  card:     { icon: CreditCard,     gradient: 'from-blue-500 to-purple-600', label: 'Credit / Debit Card',     desc: 'Visa, Mastercard, Rupay & more' },
  upi:      { icon: Smartphone,     gradient: 'from-green-400 to-teal-600',  label: 'UPI',                      desc: 'Google Pay, PhonePe & more' },
  paytm_wallet: { icon: Wallet,    gradient: 'from-blue-400 to-blue-600',   label: 'Paytm Wallet',             desc: 'Pay using Paytm balance, UPI & cards' },
  cod:      { icon: IndianRupee,    gradient: 'from-amber-400 to-orange-600',label: 'Cash on Delivery',         desc: 'Pay when you receive your order' }
};

// Map our method names to Razorpay's method parameter
// https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/checkout-fields/
const RAZORPAY_METHOD_MAP = {
  card: 'card',
  upi: 'upi',
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

  // Fetch which payment methods are enabled from the backend
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/payments/config');
        setPaymentConfig(data.data);
        // Default to the first enabled non-COD method, or cod
        const methods = data.data.allowedMethods || [];
        const first = methods.includes('card') ? 'card'
                   : methods.includes('upi') ? 'upi'
                   : methods.includes('paytm_wallet') ? 'paytm_wallet'
                   : methods.includes('cod') ? 'cod'
                   : 'card';
        setPaymentMethod(first);
      } catch {
        setPaymentConfig({ allowedMethods: ['card', 'upi', 'paytm_wallet', 'cod'], codEnabled: true, codCharges: 30 });
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

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.pincode || !address.phone) {
      toast.error('Please fill all address fields');
      return;
    }

    try {
      setLoading(true);
      setPaymentError(null);

      if (paymentMethod !== 'cod') {
        const { data: orderData } = await api.post('/payments/razorpay/order', {
          address,
          couponCode: cart.couponApplied?.code,
          paymentMethod
        });

        const order = orderData.data.order;

        const razorpayMethod = RAZORPAY_METHOD_MAP[paymentMethod];
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'Kalaah Studio',
          description: `Order ${order.orderNumber || order._id}`,
          order_id: orderData.data.razorpayOrderId,
          ...(razorpayMethod ? { method: razorpayMethod } : {}),
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
            } catch (error) {
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
                    return (
                      <label key={methodKey} className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                        paymentMethod === methodKey ? 'border-red-600 bg-red-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="radio" name="payment" value={methodKey}
                          checked={paymentMethod === methodKey}
                          onChange={() => setPaymentMethod(methodKey)}
                          className="mt-1 text-red-600 accent-red-600" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 bg-gradient-to-br ${cfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                            <Icon className="text-white" size={22} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{cfg.label}</p>
                            <p className="text-sm text-gray-500">{cfg.desc}</p>
                          </div>
                          <ShieldCheck className="text-green-500 shrink-0" size={18} />
                        </div>
                      </label>
                    );
                  })}
                </div>

                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}
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
