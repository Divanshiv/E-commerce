import { useState, useEffect } from 'react';
import { Settings, Save, IndianRupee, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
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
      <h1 className="admin-page-title">Payment Settings</h1>

      <div className="admin-widget-card max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CreditCard size={16} />
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={config.razorpayKeyId}
              onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
              placeholder="rzp_test_..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <IndianRupee size={16} />
              Currency
            </label>
            <select
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ToggleLeft size={16} />
                Cash on Delivery
              </label>
              <p className="text-xs text-gray-500 mt-1">Allow customers to pay on delivery</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, codEnabled: !config.codEnabled })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                config.codEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {config.codEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {config.codEnabled && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <IndianRupee size={16} />
                COD Charges (₹)
              </label>
              <input
                type="number"
                value={config.codCharges}
                onChange={(e) => setConfig({ ...config, codCharges: Number(e.target.value) })}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
