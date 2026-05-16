import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function getStockStatus(total) {
  if (total === 0) return { label: 'Out of Stock', class: 'stock-badge-oos' };
  if (total <= 5) return { label: 'Low Stock', class: 'stock-badge-low' };
  return { label: 'In Stock', class: 'stock-badge-in' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (searchTerm) params.search = searchTerm;
        if (stockStatus) params.stockStatus = stockStatus;
        if (categoryFilter) params.category = categoryFilter;

        const { data } = await api.get('/admin/products', { params });
        setProducts(data.data.products.map(p => ({ ...p, _isDirty: false })));
        setPagination(data.data.pagination);
      } catch (error) {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, stockStatus, categoryFilter, pagination.limit],
  );

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/inventory/stats');
      setStats(data.data.stats);
      setCategories(data.data.categoryBreakdown || []);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleSearch = e => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handlePageChange = page => {
    if (page < 1 || page > pagination.pages) return;
    fetchProducts(page);
  };

  // Inline stock editing
  const handleStockChange = (productId, sizeIndex, newValue) => {
    const value = Math.max(0, parseInt(newValue) || 0);
    setProducts(prev =>
      prev.map(p => {
        if (p._id !== productId) return p;
        const sizes = p.sizes.map((s, i) => (i === sizeIndex ? { ...s, stock: value } : s));
        return { ...p, sizes, _isDirty: true };
      }),
    );
  };

  const handleSizeNameChange = (productId, sizeIndex, newName) => {
    setProducts(prev =>
      prev.map(p => {
        if (p._id !== productId) return p;
        const sizes = p.sizes.map((s, i) => (i === sizeIndex ? { ...s, name: newName } : s));
        return { ...p, sizes, _isDirty: true };
      }),
    );
  };

  const addSizeVariant = productId => {
    setProducts(prev =>
      prev.map(p => {
        if (p._id !== productId) return p;
        const usedSizes = new Set(p.sizes.map(s => s.name));
        const available = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].find(s => !usedSizes.has(s));
        const sizes = [...p.sizes, { name: available || 'M', stock: 0 }];
        return { ...p, sizes, _isDirty: true };
      }),
    );
  };

  const removeSizeVariant = (productId, sizeIndex) => {
    setProducts(prev =>
      prev.map(p => {
        if (p._id !== productId) return p;
        const sizes = p.sizes.filter((_, i) => i !== sizeIndex);
        return { ...p, sizes, _isDirty: true };
      }),
    );
  };

  const saveRow = async product => {
    if (!product._isDirty) return;
    setSavingId(product._id);
    try {
      await api.put(`/admin/products/${product._id}`, { sizes: product.sizes });
      toast.success(`${product.name} inventory saved`);
      setProducts(prev => prev.map(p => (p._id === product._id ? { ...p, _isDirty: false } : p)));
    } catch {
      toast.error(`Failed to save ${product.name}`);
    } finally {
      setSavingId(null);
    }
  };

  const saveAllDirty = async () => {
    const dirtyProducts = products.filter(p => p._isDirty);
    if (dirtyProducts.length === 0) {
      toast('No changes to save');
      return;
    }
    setSavingAll(true);
    try {
      const updates = dirtyProducts.map(p => ({ productId: p._id, sizes: p.sizes }));
      await api.post('/admin/inventory/bulk-update', { updates });
      toast.success(`Saved ${dirtyProducts.length} product(s)`);
      setProducts(prev => prev.map(p => (p._isDirty ? { ...p, _isDirty: false } : p)));
    } catch {
      toast.error('Bulk save failed');
    } finally {
      setSavingAll(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Product Name', 'Category', 'Total Stock', 'Sizes (Name:Stock)'];
    const rows = products.map(p => {
      const sizes = p.sizes?.map(s => `${s.name}:${s.stock}`).join('; ') || '';
      const total = p.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
      return [p.name, p.category, total, sizes];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const dirtyCount = products.filter(p => p._isDirty).length;

  // Stats cards
  const statCards = stats
    ? [
        {
          label: 'Total Products',
          value: stats.totalProducts,
          icon: Package,
          color: 'bg-blue-light',
          iconColor: 'icon-blue',
        },
        {
          label: 'In Stock',
          value: stats.inStock,
          icon: CheckCircle2,
          color: 'bg-green-light',
          iconColor: 'icon-green',
        },
        {
          label: 'Low Stock',
          value: stats.lowStock,
          icon: AlertTriangle,
          color: 'bg-orange-light',
          iconColor: 'icon-orange',
        },
        {
          label: 'Out of Stock',
          value: stats.outOfStock,
          icon: XCircle,
          color: 'bg-red-light',
          iconColor: 'icon-red',
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title mb-1">Inventory Management</h1>
          <p className="text-sm text-gray-500">
            Track and update product stock levels in real time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={saveAllDirty}
            disabled={dirtyCount === 0 || savingAll}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              dirtyCount > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/15'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {savingAll ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                Saving...
              </span>
            ) : (
              <>
                <Save size={16} /> Save All {dirtyCount > 0 && `(${dirtyCount})`}
              </>
            )}
          </button>
          <button
            onClick={() => fetchProducts(pagination.page)}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
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
              placeholder="Search by product name or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-sm"
            />
          </form>

          <select
            value={stockStatus}
            onChange={e => setStockStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium text-gray-600"
          >
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium text-gray-600"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0 shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[280px]">
                  Size Variants
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <div
                          className="h-6 bg-gray-100 rounded animate-pulse"
                          style={{ width: `${50 + Math.random() * 50}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state py-12">
                    <Package className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">
                      No products found
                    </p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const totalStock = product.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
                  const status = getStockStatus(totalStock);
                  return (
                    <tr
                      key={product._id}
                      className={`hover:bg-gray-50 transition-colors ${product._isDirty ? 'bg-yellow-50/40' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0]?.url || 'https://via.placeholder.com/40'}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-gray-400 capitalize">
                              {product.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className={`stock-badge ${status.class}`}>{status.label}</span>
                            <span className="text-sm font-bold text-slate-700">{totalStock}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status.label === 'Out of Stock'
                                  ? 'bg-red-400'
                                  : status.label === 'Low Stock'
                                    ? 'bg-orange-400'
                                    : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(100, (totalStock / 50) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes?.map((size, idx) => (
                            <div key={idx} className="inv-size-editor">
                              <select
                                value={size.name}
                                onChange={e =>
                                  handleSizeNameChange(product._id, idx, e.target.value)
                                }
                                className="inv-size-select"
                              >
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={size.stock}
                                onChange={e => handleStockChange(product._id, idx, e.target.value)}
                                className={`inv-stock-input ${size.stock === 0 ? 'inv-stock-zero' : size.stock < 5 ? 'inv-stock-low' : ''}`}
                              />
                              {product.sizes.length > 1 && (
                                <button
                                  onClick={() => removeSizeVariant(product._id, idx)}
                                  className="inv-size-remove"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addSizeVariant(product._id)}
                            className="inv-size-add"
                            title="Add size variant"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(product.updatedAt)}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => saveRow(product)}
                          disabled={!product._isDirty || savingId === product._id}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            savingId === product._id
                              ? 'bg-gray-100 text-gray-400'
                              : product._isDirty
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {savingId === product._id ? (
                            'Saving...'
                          ) : (
                            <>
                              <Save size={14} className="inline mr-1" />
                              Save
                            </>
                          )}
                        </button>
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
    </div>
  );
}
