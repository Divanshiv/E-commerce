import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, Calendar, Ticket, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 100,
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/admin/coupons');
      setCoupons(data.data.coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await api.put(`/admin/coupons/${editingCoupon._id}`, formData);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', formData);
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => 
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading coupons...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title mb-1">Coupon Management</h1>
          <p className="text-sm text-gray-500">Manage promotional codes and discounts</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '', description: '', discountType: 'percentage',
              discountValue: '', minOrderValue: 0,
              validFrom: new Date().toISOString().split('T')[0],
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              usageLimit: 100, isActive: true
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/10"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map(coupon => (
          <div key={coupon._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {!coupon.isActive && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest">Inactive</span></div>}
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg tracking-tight uppercase">{coupon.code}</h3>
                  <p className="text-xs text-slate-400 font-bold">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setFormData({
                      code: coupon.code,
                      description: coupon.description,
                      discountType: coupon.discountType,
                      discountValue: coupon.discountValue,
                      minOrderValue: coupon.minOrderValue,
                      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
                      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
                      usageLimit: coupon.usageLimit,
                      isActive: coupon.isActive
                    });
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteCoupon(coupon._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-[40px] italic">"{coupon.description || 'No description provided'}"</p>

            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><Calendar size={14} /> Validity</span>
                <span className="text-slate-700 font-bold">{new Date(coupon.validUntil).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Usage</span>
                <span className="text-slate-700 font-black">{coupon.usedCount || 0} / {coupon.usageLimit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">Min Order</span>
                <span className="text-slate-700 font-black">₹{coupon.minOrderValue}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredCoupons.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Ticket className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No coupons found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black font-heading tracking-tight">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Coupon Code</label>
                  <input
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder="E.G. SUMMER50"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Discount Type</label>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'percentage'})}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${formData.discountType === 'percentage' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
                    >Percent</button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'fixed'})}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${formData.discountType === 'fixed' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
                    >Fixed Amount</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={e => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder={formData.discountType === 'percentage' ? '40%' : '₹500'}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.usageLimit}
                    onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-medium text-sm focus:ring-2 focus:ring-red-500/20 outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={e => setFormData({...formData, validFrom: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded-lg accent-red-600"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Coupon is currently Active</label>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-[0.98] transition-all"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
