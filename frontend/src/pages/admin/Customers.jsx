import { useState, useEffect, useMemo } from 'react';
import {
  Eye, Search, X, Users, Mail, Phone, Calendar, ShoppingBag,
  UserPlus, UserCheck, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../lib/api';

const AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
  'bg-pink-100 text-pink-600',
  'bg-teal-100 text-teal-600',
  'bg-indigo-100 text-indigo-600',
];

function hashColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, newThisMonth: 0, joinedToday: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: '15' });
      if (searchTerm) params.set('search', searchTerm);
      const { data } = await api.get(`/admin/customers?${params}`);
      setCustomers(data.data.customers);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/customers/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCustomerOrders = async (customerId) => {
    setFetchingOrders(true);
    try {
      const { data } = await api.get(`/admin/orders?userId=${customerId}`);
      setCustomerOrders(data.data.orders || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Debounced search on Enter
  useEffect(() => {
    if (!searchTerm) {
      fetchCustomers();
    }
  }, []);

  const sortedCustomers = useMemo(() => {
    const sorted = [...customers];
    switch (sortBy) {
      case 'newest': return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest': return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name': return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'orders': return sorted.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
      case 'spent': return sorted.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
      default: return sorted;
    }
  }, [customers, sortBy]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0
    }).format(price);
  };

  const statCards = [
    { label: 'Total Customers', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Joined Today', value: stats.joinedToday, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="admin-page-title mb-0">Customers</h1>
        <div className="text-sm text-gray-400">
          {pagination.total > 0 && <span>{pagination.total} customer{pagination.total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} className={card.color} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-4 items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name, Email, or Phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500"
          />
        </form>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ArrowUpDown size={14} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-red-500 text-sm font-medium"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="orders">Most Orders</option>
            <option value="spent">Highest Spent</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Orders</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Total Spent</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedCustomers.map(customer => (
              <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${hashColor(customer.name)} rounded-xl flex items-center justify-center font-bold text-lg font-heading shrink-0`}>
                      {customer.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{customer.name}</p>
                      <p className="text-xs text-gray-400">
                        {customer.addresses?.length || 0} address{(customer.addresses?.length || 0) !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm space-y-0.5">
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{customer.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span className="font-mono">{customer.phone || '—'}</span>
                    </p>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-purple-50 text-purple-700 font-bold text-sm">
                    {customer.orderCount || 0}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-bold text-slate-800">{formatPrice(customer.totalSpent || 0)}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>{new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedCustomer(customer);
                      fetchCustomerOrders(customer._id);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View Profile"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {sortedCustomers.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="admin-empty-state">
                  {searchTerm ? 'No customers match your search.' : 'No customers yet.'}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" className="p-8">
                  <div className="admin-loading-pulse space-y-3">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Page {page} of {pagination.pages} ({pagination.total} customers)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${hashColor(selectedCustomer.name)} rounded-xl flex items-center justify-center font-bold text-2xl font-heading`}>
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    ID: <span className="font-mono">{selectedCustomer._id.slice(-8).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedCustomer.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {selectedCustomer.role}
                    </span>
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact + Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                  <Mail size={16} className="text-blue-500 mb-1" />
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedCustomer.email}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100">
                  <Phone size={16} className="text-purple-500 mb-1" />
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-slate-800 font-mono">{selectedCustomer.phone || '—'}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100">
                  <ShoppingBag size={16} className="text-amber-500 mb-1" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Orders</p>
                  <p className="text-sm font-bold text-slate-800">{selectedCustomer.orderCount || 0}</p>
                </div>
              </div>

              {/* Spent + Joined */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-xl p-4 text-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="text-2xl font-black">{formatPrice(selectedCustomer.totalSpent || 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={16} className="text-gray-400" />
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {selectedCustomer.addresses?.length || 0}
                  </span>
                  Saved Addresses
                </h3>
                {selectedCustomer.addresses?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm relative">
                        {addr.isDefault && (
                          <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full">DEFAULT</span>
                        )}
                        <p className="font-medium text-slate-800 text-sm">{addr.street}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center italic border border-dashed border-gray-200">
                    No addresses saved yet.
                  </p>
                )}
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <ShoppingBag size={16} className="text-gray-400" />
                  Recent Orders ({customerOrders.length})
                </h3>
                {fetchingOrders ? (
                  <div className="space-y-2">
                    <div className="h-14 bg-gray-50 animate-pulse rounded-xl" />
                    <div className="h-14 bg-gray-50 animate-pulse rounded-xl" />
                  </div>
                ) : customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
                            <ShoppingBag size={16} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{order.orderNumber}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })} · {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">{formatPrice(order.total)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center italic border border-dashed border-gray-200">
                    No order history found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
