import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, Filter, X, Users, Mail, Phone, MapPin, Package } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Tracking form
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      
      return searchMatch && statusMatch;
    });
  }, [orders, searchTerm, statusFilter]);

  const updateStatus = async (orderId, status) => {
    try {
      const payload = { status };
      if (status === 'shipped' && trackingNumber) {
        payload.trackingNumber = trackingNumber;
      }
      
      await api.put(`/admin/orders/${orderId}/status`, payload);
      toast.success('Status updated');
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status, trackingNumber: payload.trackingNumber || prev.trackingNumber }));
      }
      setTrackingNumber('');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <h1 className="admin-page-title mb-6">Orders</h1>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by Order ID, Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="relative w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 appearance-none bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.items.length} items</p>
                </td>
                <td className="p-4">
                  <p className="font-medium text-slate-700">{order.user?.name}</p>
                  <p className="text-xs text-gray-500">{order.user?.email}</p>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="p-4 font-bold text-slate-800">{formatPrice(order.total)}</td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border border-transparent outline-none cursor-pointer ${statusColors[order.status]}`}
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" className="admin-empty-state">No orders found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-800">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Update Block */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-slate-800 mb-3">Update Delivery Status</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder._id, e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-lg border font-medium outline-none ${statusColors[selectedOrder.status]} border-transparent ring-1 ring-black/5`}
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  
                  {selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        placeholder={selectedOrder.trackingNumber || "Enter Tracking Number..."}
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-lg outline-none focus:border-red-500"
                      />
                      <button 
                        onClick={() => updateStatus(selectedOrder._id, selectedOrder.status)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900"
                      >
                        Save
                      </button>
                    </div>
                  ) : selectedOrder.trackingNumber ? (
                    <div className="flex-1 flex items-center px-4 bg-white border rounded-lg text-sm">
                      <span className="text-gray-500 mr-2">Tracking:</span>
                      <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Users size={16} className="text-gray-400" /> Customer Information
                  </h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="font-bold text-gray-900">{selectedOrder.user?.name}</p>
                    <p className="flex items-center gap-1"><Mail size={12} /> {selectedOrder.user?.email}</p>
                    <p className="flex items-center gap-1 mt-1"><Phone size={12} /> {selectedOrder.user?.phone || 'No phone provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" /> Shipping Address
                  </h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900">{selectedOrder.address?.street}</p>
                    <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Contact: {selectedOrder.address?.phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-gray-400" /> Order Items ({selectedOrder.items.length})
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          SIZE: <span className="font-bold text-slate-600">{item.size}</span> | 
                          QTY: <span className="font-bold text-slate-600">{item.quantity}</span> | 
                          UNIT: <span className="font-bold text-slate-600">₹{item.price}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-400">
                      <span>Discount (Coupon)</span>
                      <span className="font-bold">-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Shipping Charges</span>
                    <span className="font-bold text-white">{selectedOrder.shippingCharges === 0 ? 'FREE' : formatPrice(selectedOrder.shippingCharges)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Amount</span>
                  <span className="text-3xl font-black text-white">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</h3>
                  <p className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] uppercase">{selectedOrder.payment?.method}</span>
                    {selectedOrder.payment?.status?.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction ID</h3>
                  <p className="font-mono text-xs text-slate-600">{selectedOrder.payment?.transactionId || 'OFFLINE_ORDER'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
