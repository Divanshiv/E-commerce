import { useState, useEffect } from 'react';
import {
  Truck,
  Save,
  IndianRupee,
  Clock,
  PackageCheck,
  Zap,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Gem,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminShipment() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    freeShippingThreshold: 999,
    standardRate: 49,
    expressRate: 99,
    codCharges: 30,
    standardDeliveryDays: 5,
    expressDeliveryDays: 2,
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

  const handleUpdate = async e => {
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

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statCards = [
    {
      label: 'Free Shipping Above',
      value: `₹${config.freeShippingThreshold}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
      desc: 'Orders above this ship free',
    },
    {
      label: 'Standard Rate',
      value: formatPrice(config.standardRate),
      icon: PackageCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      desc: `${config.standardDeliveryDays || 5} business days`,
    },
    {
      label: 'Express Rate',
      value: formatPrice(config.expressRate),
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      desc: `${config.expressDeliveryDays || 2} business days`,
    },
    {
      label: 'COD Fee',
      value: formatPrice(config.codCharges),
      icon: IndianRupee,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      desc: 'Cash on Delivery charge',
    },
  ];

  if (loading) {
    return (
      <div className="admin-loading-pulse space-y-4">
        <div className="admin-skeleton-card w-full h-24" />
        <div className="admin-skeleton-card w-full h-80" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title mb-1">Logistics & Shipment</h1>
          <p className="text-sm text-gray-500">
            Configure shipping rates, delivery timelines, and free shipping rules
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <Icon size={22} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                    {card.label}
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">{card.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN FORM */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Rates */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Shipping Rates</h2>
                <p className="text-xs text-gray-400">
                  Set delivery charges for different service levels
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PackageCheck size={16} className="text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">Standard</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {config.standardDeliveryDays || 5} days
                  </span>
                </div>
                <div className="relative">
                  <IndianRupee
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                    size={14}
                  />
                  <input
                    type="number"
                    value={config.standardRate}
                    onChange={e => setConfig({ ...config, standardRate: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-3 rounded-lg bg-white border border-blue-200 font-bold text-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-blue-500/60 mt-2 font-medium">Charge per order</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-purple-600" />
                    <span className="font-bold text-slate-800 text-sm">Express</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    {config.expressDeliveryDays || 2} days
                  </span>
                </div>
                <div className="relative">
                  <IndianRupee
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"
                    size={14}
                  />
                  <input
                    type="number"
                    value={config.expressRate}
                    onChange={e => setConfig({ ...config, expressRate: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-3 rounded-lg bg-white border border-purple-200 font-bold text-lg focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-purple-500/60 mt-2 font-medium">Charge per order</p>
              </div>
            </div>

            {/* Delivery Estimates */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Delivery Time Estimates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1.5">
                    Standard Delivery (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={config.standardDeliveryDays}
                    onChange={e =>
                      setConfig({ ...config, standardDeliveryDays: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1.5">
                    Express Delivery (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={config.expressDeliveryDays}
                    onChange={e =>
                      setConfig({ ...config, expressDeliveryDays: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Free Shipping + COD */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Gem size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Pricing Rules</h2>
                <p className="text-xs text-gray-400">
                  Free shipping threshold and cash on delivery fees
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1.5">
                  Free Shipping Threshold (₹)
                </label>
                <div className="relative">
                  <IndianRupee
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="number"
                    min={0}
                    value={config.freeShippingThreshold}
                    onChange={e =>
                      setConfig({ ...config, freeShippingThreshold: Number(e.target.value) })
                    }
                    className="w-full pl-8 pr-3 py-3 rounded-lg bg-gray-50 border border-gray-200 font-bold text-lg focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Orders above this amount get free standard shipping
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-1.5">
                  COD Convenience Fee (₹)
                </label>
                <div className="relative">
                  <IndianRupee
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="number"
                    min={0}
                    value={config.codCharges}
                    onChange={e => setConfig({ ...config, codCharges: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-3 rounded-lg bg-gray-50 border border-gray-200 font-bold text-lg focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Extra charge applied to COD orders
                </p>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              disabled={saving}
              className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Free Shipping Highlight */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Gem size={20} className="text-emerald-400" />
              <span className="font-bold text-sm">Free Shipping</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Customers get free standard shipping on all orders above
            </p>
            <div className="text-4xl font-black tracking-tight mb-1">
              ₹{config.freeShippingThreshold}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              <TrendingUp size={12} />
              Active Threshold
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Free on orders &gt;</span>
                <span className="font-bold">₹{config.freeShippingThreshold}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Otherwise</span>
                <span className="font-bold">₹{config.standardRate}</span>
              </div>
            </div>
          </div>

          {/* Checkout Preview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <IndianRupee size={14} className="text-gray-500" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Customer Checkout Preview</span>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <PackageCheck size={14} className="text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800">Standard</span>
                  </div>
                  <span className="font-bold text-slate-800">₹{config.standardRate}</span>
                </div>
                <p className="text-[10px] text-blue-600/60">
                  Arrives in {config.standardDeliveryDays || 5} business days
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-purple-600" />
                    <span className="text-sm font-semibold text-slate-800">Express</span>
                  </div>
                  <span className="font-bold text-slate-800">₹{config.expressRate}</span>
                </div>
                <p className="text-[10px] text-purple-600/60">
                  Arrives in {config.expressDeliveryDays || 2} business days
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Free threshold</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {config.freeShippingThreshold > 0 ? `> ₹${config.freeShippingThreshold}` : 'N/A'}
                </span>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-[10px] text-green-600 font-semibold bg-green-50 rounded-lg px-3 py-2">
                  <ShieldCheck size={12} />
                  Policies update instantly across the store
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 mb-1">Pro Tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Setting a free shipping threshold just above your average order value (₹999)
                  encourages customers to add more items to qualify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
