import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Ticket,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Percent,
  IndianRupee,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const DEFAULT_FORM = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderValue: 0,
  maxDiscount: '',
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimit: 100,
  isActive: true,
};

function getCouponStatus(coupon) {
  const now = new Date();
  if (!coupon.isActive) return { label: 'Inactive', class: 'badge-inactive' };
  if (new Date(coupon.validUntil) < now) return { label: 'Expired', class: 'badge-expired' };
  if (coupon.usedCount >= coupon.usageLimit)
    return { label: 'Exhausted', class: 'badge-exhausted' };
  if (new Date(coupon.validFrom) > now) return { label: 'Scheduled', class: 'badge-scheduled' };
  return { label: 'Active', class: 'badge-active' };
}

function getDiscountLabel(coupon) {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue}% OFF`;
  }
  return `₹${coupon.discountValue} OFF`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCoupons = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter) params.status = statusFilter;
        if (discountTypeFilter) params.discountType = discountTypeFilter;
        if (sortBy) params.sortBy = sortBy;

        const { data } = await api.get('/admin/coupons', { params });
        setCoupons(data.data.coupons);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        toast.error('Failed to load coupons');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter, discountTypeFilter, sortBy, pagination.limit],
  );

  useEffect(() => {
    fetchCoupons(1);
  }, [fetchCoupons]);

  const handleFilterChange = setter => val => {
    setter(val);
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchCoupons(1);
  };

  const handlePageChange = page => {
    if (page < 1 || page > pagination.pages) return;
    fetchCoupons(page);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({ ...DEFAULT_FORM });
    setShowModal(true);
  };

  const openEditModal = coupon => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || '',
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        usageLimit: Number(formData.usageLimit),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      };

      if (editingCoupon) {
        await api.put(`/admin/coupons/${editingCoupon._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetchCoupons(pagination.page);
    } catch (error) {
      const msg = error.response?.data?.message || 'Action failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCoupon = async id => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      setDeleteConfirm(null);
      const newTotal = pagination.total - 1;
      const targetPage =
        newTotal <= (pagination.page - 1) * pagination.limit
          ? Math.max(1, pagination.page - 1)
          : pagination.page;
      fetchCoupons(targetPage);
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleStatus = async coupon => {
    try {
      await api.patch(`/admin/coupons/${coupon._id}/toggle`);
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
      fetchCoupons(pagination.page);
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const copyCode = code => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  // Stats summary cards
  const statCards = stats
    ? [
        {
          label: 'Total Coupons',
          value: stats.total,
          color: 'bg-blue-light',
          iconColor: 'icon-blue',
          icon: Ticket,
        },
        {
          label: 'Active',
          value: stats.active,
          color: 'bg-green-light',
          iconColor: 'icon-green',
          icon: CheckCircle2,
        },
        {
          label: 'Inactive',
          value: stats.inactive,
          color: 'bg-gray-100',
          iconColor: 'text-gray-500',
          icon: Ban,
        },
        {
          label: 'Expired',
          value: stats.expired,
          color: 'bg-red-light',
          iconColor: 'icon-red',
          icon: AlertTriangle,
        },
        {
          label: 'Exhausted',
          value: stats.exhausted,
          color: 'bg-orange-light',
          iconColor: 'icon-orange',
          icon: XCircle,
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title mb-1">Coupon Management</h1>
          <p className="text-sm text-gray-500">Create and manage promotional discount codes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/15"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-grid-4 mb-6">
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="admin-stat-card flex items-center gap-4">
                <div className={`admin-icon-wrap ${s.color}`}>
                  <Icon size={22} className={s.iconColor} />
                </div>
                <div>
                  <p className="admin-stat-label">{s.label}</p>
                  <p className="admin-stat-value text-2xl">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchCoupons(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </form>

          <select
            value={statusFilter}
            onChange={e => handleFilterChange(setStatusFilter)(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-sm font-medium text-gray-600"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="exhausted">Exhausted</option>
          </select>

          <select
            value={discountTypeFilter}
            onChange={e => handleFilterChange(setDiscountTypeFilter)(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-sm font-medium text-gray-600"
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-sm font-medium text-gray-600"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="code">Code A-Z</option>
            <option value="-code">Code Z-A</option>
            <option value="-discountValue">Highest Discount</option>
            <option value="discountValue">Lowest Discount</option>
            <option value="-validUntil">Expiry (Soonest)</option>
            <option value="validUntil">Expiry (Latest)</option>
            <option value="-usedCount">Most Used</option>
            <option value="usedCount">Least Used</option>
          </select>

          <button
            onClick={() => fetchCoupons(pagination.page)}
            className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Min Order
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <div
                          className="h-5 bg-gray-100 rounded animate-pulse"
                          style={{ width: `${60 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state py-12">
                    <Ticket className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">
                      No coupons found
                    </p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm uppercase tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[220px]">
                            {coupon.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`admin-icon-small-wrap ${coupon.discountType === 'percentage' ? 'bg-green-light' : 'bg-blue-light'}`}
                          >
                            {coupon.discountType === 'percentage' ? (
                              <Percent size={14} className="icon-green" />
                            ) : (
                              <IndianRupee size={14} className="icon-blue" />
                            )}
                          </span>
                          <span className="font-bold text-slate-800">
                            {getDiscountLabel(coupon)}
                          </span>
                        </div>
                        {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                          <p className="text-[10px] text-gray-400 mt-0.5 ml-9">
                            Max discount ₹{coupon.maxDiscount}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700">
                          {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} className="text-gray-300" />
                            {formatDate(coupon.validFrom)}
                          </span>
                          <span className="text-xs text-gray-400">
                            → {formatDate(coupon.validUntil)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 min-w-[48px]">
                            {coupon.usedCount}/{coupon.usageLimit}
                          </span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                coupon.usedCount >= coupon.usageLimit
                                  ? 'bg-red-400'
                                  : coupon.usedCount / coupon.usageLimit > 0.7
                                    ? 'bg-orange-400'
                                    : 'bg-green-400'
                              }`}
                              style={{
                                width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`coupon-status-badge ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleStatus(coupon)}
                            className={`p-2 rounded-lg transition-colors ${
                              coupon.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(coupon)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(
                  p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1,
                )
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-300 text-sm">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-colors ${
                        p === pagination.page
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black font-heading tracking-tight">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {editingCoupon ? 'Update coupon details' : 'Set up a new promotional code'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder="E.G. SUMMER50"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Discount Type
                  </label>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${
                        formData.discountType === 'percentage'
                          ? 'bg-white shadow-sm text-red-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Percent size={14} className="inline mr-1" />
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${
                        formData.discountType === 'fixed'
                          ? 'bg-white shadow-sm text-red-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <IndianRupee size={14} className="inline mr-1" />
                      Fixed Amount
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder={formData.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                      placeholder="No limit"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder="No minimum"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-medium text-sm focus:ring-2 focus:ring-red-500/20 outline-none h-20 resize-none"
                  placeholder="Optional — describe when this coupon should be used..."
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Valid From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
                <span className="text-sm font-bold text-slate-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {editingCoupon ? 'Updating...' : 'Creating...'}
                  </span>
                ) : editingCoupon ? (
                  'Update Coupon'
                ) : (
                  'Create Coupon'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[10001] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 ring-1 ring-black/5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 font-heading">Delete Coupon</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-slate-700 uppercase">{deleteConfirm.code}</strong>? This
                action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCoupon(deleteConfirm._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
