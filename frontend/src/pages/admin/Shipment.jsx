import { useState, useEffect } from 'react';
import { Truck, Save, ArrowRight, ShieldCheck, Gem, IndianRupee } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminShipment() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    freeShippingThreshold: 999,
    standardRate: 49,
    expressRate: 99,
    codCharges: 30
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/shipment');
      setConfig(data.data.config);
    } catch (error) {
      console.error('Error fetching shipment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/shipment', config);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading configurations...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="admin-page-title mb-1">Logistics & Shipment</h1>
        <p className="text-sm text-gray-500">Configure global shipping rates and free delivery thresholds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Truck size={20} className="text-red-500" /> General Rates
            </h2>

            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Free Shipping Threshold (Above ₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    value={config.freeShippingThreshold}
                    onChange={e => setConfig({...config, freeShippingThreshold: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                    placeholder="999"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Any order above this value will have Standard Shipping set to ₹0 at checkout.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Standard Shipping Rate</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="number"
                      value={config.standardRate}
                      onChange={e => setConfig({...config, standardRate: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Express Shipping Rate</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="number"
                      value={config.expressRate}
                      onChange={e => setConfig({...config, expressRate: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Cash on Delivery (COD) Fee</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    value={config.codCharges}
                    onChange={e => setConfig({...config, codCharges: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={saving}
              className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save size={18} /> Update Logistics Config
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-red-600 rounded-3xl p-8 text-white shadow-xl shadow-red-900/20">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">
              <Gem size={24} /> Free Shipping Rule
            </h3>
            <p className="text-sm opacity-90 leading-relaxed mb-6">
              Customers love free shipping! Currently, your store offers it on all orders exceeding:
            </p>
            <div className="text-5xl font-black tracking-tight mb-2">₹{config.freeShippingThreshold}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Global Threshold Active</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-slate-800 mb-6 pb-4 border-b">Checkout Preview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Standard Delivery</span>
                <span className="font-bold text-slate-800">₹{config.standardRate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Express Delivery</span>
                <span className="font-bold text-slate-800">₹{config.expressRate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium font-bold">COD Convenience</span>
                <span className="font-bold text-red-600">+ ₹{config.codCharges}</span>
              </div>
              <div className="pt-4 border-t border-dashed">
                <div className="flex items-center gap-2 text-xs text-green-600 font-bold">
                  <ShieldCheck size={14} /> Policies are updated instantly
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
