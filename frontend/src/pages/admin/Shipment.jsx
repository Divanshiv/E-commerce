import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminShipment() {
  const [config, setConfig] = useState({
    freeShippingThreshold: 999,
    standardRate: 49,
    expressRate: 99,
    codCharges: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/shipment');
      setConfig(data.data.config);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/admin/shipment', config);
      toast.success('Shipment config updated');
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white rounded-xl" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shipment Settings</h1>

      <div className="bg-white rounded-xl p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2">
              Free Shipping Threshold (₹)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Orders above this amount get free shipping
            </p>
            <input
              type="number"
              value={config.freeShippingThreshold}
              onChange={(e) => setConfig({ ...config, freeShippingThreshold: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Standard Shipping Rate (₹)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Default shipping rate for orders below threshold
            </p>
            <input
              type="number"
              value={config.standardRate}
              onChange={(e) => setConfig({ ...config, standardRate: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Express Shipping Rate (₹)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Optional express delivery rate
            </p>
            <input
              type="number"
              value={config.expressRate}
              onChange={(e) => setConfig({ ...config, expressRate: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Cash on Delivery Charges (₹)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Extra charges for COD orders
            </p>
            <input
              type="number"
              value={config.codCharges}
              onChange={(e) => setConfig({ ...config, codCharges: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
