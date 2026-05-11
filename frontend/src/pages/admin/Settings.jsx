import { useState, useEffect } from 'react';
import { Save, IndianRupee, CreditCard, Smartphone, Wallet } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    razorpayKeyId: '',
    currency: 'INR',
    codEnabled: true,
    codCharges: 30
  });

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
    return <div className="admin-loading-pulse space-y-4">
      <div className="admin-skeleton-card" />
      <div className="admin-skeleton-card" />
    </div>;
  }

  return (
    <div>
      <h1 className="admin-page-title">Payment Setting</h1>

      <div className="admin-widget-card max-w-2xl">
        <div className="space-y-8">

          {/* Section: Online Payments (Razorpay) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Online Payments</h2>
                <p className="text-xs text-gray-400">Powered by Razorpay</p>
              </div>
            </div>

            <div className="space-y-4 pl-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Razorpay Key ID</label>
                <input
                  type="text"
                  value={config.razorpayKeyId}
                  onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
                  placeholder="rzp_test_..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Currency</label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Available Methods</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 -mx-3">
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} className="text-blue-500" />
                      <span className="text-sm text-gray-700">Credit / Debit Cards</span>
                    </div>
                    <button
                      onClick={() => {
                        const methods = config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod'];
                        setConfig({ ...config, allowedMethods: methods.includes('card') ? methods.filter(m => m !== 'card') : [...methods, 'card'] });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                        (config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('card')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {(config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('card') ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 -mx-3">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-green-500" />
                      <span className="text-sm text-gray-700">UPI (Google Pay / PhonePe)</span>
                    </div>
                    <button
                      onClick={() => {
                        const methods = config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod'];
                        setConfig({ ...config, allowedMethods: methods.includes('upi') ? methods.filter(m => m !== 'upi') : [...methods, 'upi'] });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                        (config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('upi')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {(config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('upi') ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 -mx-3">
                    <div className="flex items-center gap-3">
                      <Wallet size={16} className="text-blue-400" />
                      <span className="text-sm text-gray-700">Paytm Wallet</span>
                    </div>
                    <button
                      onClick={() => {
                        const methods = config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod'];
                        setConfig({ ...config, allowedMethods: methods.includes('paytm_wallet') ? methods.filter(m => m !== 'paytm_wallet') : [...methods, 'paytm_wallet'] });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                        (config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('paytm_wallet')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {(config.allowedMethods || ['card', 'upi', 'paytm_wallet', 'cod']).includes('paytm_wallet') ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Cash on Delivery */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <IndianRupee size={16} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Cash on Delivery</h2>
                <p className="text-xs text-gray-400">Pay when the order arrives</p>
              </div>
            </div>

            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Accept COD orders</span>
                <button
                  onClick={() => setConfig({ ...config, codEnabled: !config.codEnabled })}
                  className={`text-xs px-4 py-1.5 rounded-md font-medium transition ${
                    config.codEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {config.codEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {config.codEnabled && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">COD Charges (₹)</label>
                  <input
                    type="number"
                    value={config.codCharges}
                    onChange={(e) => setConfig({ ...config, codCharges: Number(e.target.value) })}
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 max-w-[200px]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
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
    </div>
  );
}
