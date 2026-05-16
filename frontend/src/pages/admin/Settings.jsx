import { useState, useEffect } from 'react';
import {
  Save,
  CreditCard,
  Smartphone,
  Wallet,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  IndianRupee,
  Shield,
  Globe,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const METHODS = [
  {
    key: 'card',
    label: 'Credit / Debit Cards',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    desc: 'Visa, Mastercard, Rupay & more',
  },
  {
    key: 'google_pay',
    label: 'Google Pay',
    icon: Smartphone,
    color: 'text-green-600',
    bg: 'bg-green-100',
    desc: 'Pay using Google Pay UPI',
    testField: {
      label: 'Test UPI ID',
      configKey: 'googlePayTestId',
      placeholder: 'success@razorpay',
    },
  },
  {
    key: 'phonepe',
    label: 'PhonePe',
    icon: Smartphone,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    desc: 'Pay using PhonePe UPI',
    testField: {
      label: 'Test UPI ID',
      configKey: 'phonePeTestId',
      placeholder: 'success@razorpay',
    },
  },
  {
    key: 'paytm_wallet',
    label: 'Paytm Wallet',
    icon: Wallet,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    desc: 'Pay using Paytm balance, UPI & cards',
  },
];

const TEST_CARDS = [
  {
    type: 'visa',
    label: 'Visa',
    number: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    holder: 'Test User',
  },
  {
    type: 'mastercard',
    label: 'Mastercard',
    number: '5555 5555 5555 4444',
    expiry: '12/28',
    cvv: '123',
    holder: 'Test User',
  },
  {
    type: 'rupay',
    label: 'Rupay',
    number: '6069 8888 8888 8888',
    expiry: '12/28',
    cvv: '123',
    holder: 'Test User',
  },
  {
    type: 'amex',
    label: 'Amex',
    number: '3782 822463 10005',
    expiry: '12/28',
    cvv: '1234',
    holder: 'Test User',
  },
  {
    type: 'maestro',
    label: 'Maestro',
    number: '5000 0000 0000 0610',
    expiry: '12/28',
    cvv: '123',
    holder: 'Test User',
  },
];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState({
    razorpayKeyId: '',
    currency: 'INR',
    codEnabled: true,
    codCharges: 30,
    allowedMethods: ['card', 'google_pay', 'phonepe', 'paytm_wallet', 'cod'],
    googlePayTestId: 'success@razorpay',
    phonePeTestId: 'success@razorpay',
  });

  const isRazorpayConfigured = config.razorpayKeyId?.length > 0;
  const activeMethods = config.allowedMethods || [];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/payment-config');
      setConfig(data.data.config);
    } catch (error) {
      console.error('Error fetching payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = key => {
    const updated = activeMethods.includes(key)
      ? activeMethods.filter(m => m !== key)
      : [...activeMethods, key];
    setConfig({ ...config, allowedMethods: updated });
  };

  const selectTestCard = type => {
    const card = TEST_CARDS.find(c => c.type === type);
    if (card) {
      setConfig({
        ...config,
        testCardType: card.type,
        testCardNumber: card.number,
        testCardExpiry: card.expiry,
        testCardCvv: card.cvv,
        testCardHolder: card.holder,
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put('/admin/payment-config', config);
      setConfig(data.data.config);
      toast.success('Payment settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-pulse space-y-4">
        <div className="admin-skeleton-card" />
        <div className="admin-skeleton-card" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="admin-page-title">Payment Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        <div className="admin-widget-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Razorpay Gateway</h2>
              <p className="text-xs text-gray-400">Payment gateway configuration</p>
            </div>
            {isRazorpayConfigured ? (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={12} /> Configured
              </span>
            ) : (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <XCircle size={12} /> Not configured
              </span>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Razorpay Key ID
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.razorpayKeyId}
                  onChange={e => setConfig({ ...config, razorpayKeyId: e.target.value })}
                  placeholder="rzp_test_..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-red-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Found in Razorpay Dashboard → Settings → API Keys
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Currency</label>
              <select
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 max-w-[240px]"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>
          </div>
        </div>

        {METHODS.map(method => {
          const Icon = method.icon;
          const isEnabled = activeMethods.includes(method.key);

          if (method.key === 'card') {
            return (
              <div
                key={method.key}
                className={`admin-widget-card transition ${!isEnabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 ${method.bg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon size={20} className={method.color} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-800">{method.label}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{method.desc}</p>
                      {isEnabled && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {config.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMethod(method.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isEnabled && (
                  <div className="ml-[52px] space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Accepted Card Networks
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Visa', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                          {
                            name: 'Mastercard',
                            color: 'bg-orange-50 text-orange-700 border-orange-200',
                          },
                          { name: 'Rupay', color: 'bg-green-50 text-green-700 border-green-200' },
                          {
                            name: 'American Express',
                            color: 'bg-purple-50 text-purple-700 border-purple-200',
                          },
                          { name: 'Maestro', color: 'bg-gray-50 text-gray-700 border-gray-200' },
                        ].map(card => (
                          <span
                            key={card.name}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${card.color}`}
                          >
                            <CreditCard size={11} />
                            {card.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-medium text-gray-500 mb-3">Saved Test Card</p>

                      <div className="mb-3">
                        <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wider">
                          Select Card
                        </label>
                        <select
                          value={config.testCardType || 'visa'}
                          onChange={e => selectTestCard(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                        >
                          {TEST_CARDS.map(card => (
                            <option key={card.type} value={card.type}>
                              {card.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wider">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={config.testCardHolder || ''}
                            onChange={e => setConfig({ ...config, testCardHolder: e.target.value })}
                            placeholder="John Doe"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wider">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={config.testCardNumber || ''}
                            onChange={e => setConfig({ ...config, testCardNumber: e.target.value })}
                            placeholder="4111 1111 1111 1111"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wider">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={config.testCardExpiry || ''}
                              onChange={e =>
                                setConfig({ ...config, testCardExpiry: e.target.value })
                              }
                              placeholder="MM/YY"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wider">
                              CVV
                            </label>
                            <input
                              type="password"
                              value={config.testCardCvv || ''}
                              onChange={e => setConfig({ ...config, testCardCvv: e.target.value })}
                              placeholder="123"
                              maxLength={4}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Shield size={13} className="text-green-500" />
                        3D Secure Authentication
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Globe size={13} className="text-blue-500" />
                        International Cards
                      </div>
                    </div>
                  </div>
                )}

                {!isRazorpayConfigured && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                    <XCircle size={10} /> Requires Razorpay key to be configured
                  </p>
                )}
              </div>
            );
          }
          return (
            <div
              key={method.key}
              className={`admin-widget-card transition ${!isEnabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 ${method.bg} rounded-xl flex items-center justify-center`}
                >
                  <Icon size={20} className={method.color} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800">{method.label}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">{method.desc}</p>
                    {isEnabled && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {config.currency}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod(method.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    isEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {isEnabled && method.testField && (
                <div className="ml-[52px]">
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    {method.testField.label}
                  </label>
                  <input
                    type="text"
                    value={config[method.testField.configKey] || ''}
                    onChange={e =>
                      setConfig({ ...config, [method.testField.configKey]: e.target.value })
                    }
                    placeholder={method.testField.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use <span className="font-mono">success@razorpay</span> to simulate successful
                    payment
                  </p>
                </div>
              )}
              {!isRazorpayConfigured && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <XCircle size={10} /> Requires Razorpay key to be configured
                </p>
              )}
            </div>
          );
        })}

        <div className="admin-widget-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <IndianRupee size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-800">Cash on Delivery</h2>
              <p className="text-xs text-gray-400">Pay when the order arrives</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, codEnabled: !config.codEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                config.codEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  config.codEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.codEnabled && (
            <div className="ml-[52px]">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                COD Charges (₹)
              </label>
              <input
                type="number"
                value={config.codCharges}
                onChange={e => setConfig({ ...config, codCharges: Number(e.target.value) })}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 max-w-[200px]"
              />
              <p className="text-xs text-gray-400 mt-1">Extra charge applied to COD orders</p>
            </div>
          )}
        </div>

        <div className="admin-widget-card">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 text-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
