import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, Filter } from 'lucide-react';
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
                  <h3 className="font-semibold text-slate-800 mb-2">Customer</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedOrder.user?.name}</p>
                    <p>{selectedOrder.user?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Shipping Address</h3>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.address?.street}</p>
                    <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
                    <p className="mt-1">Phone: <span className="font-medium">{selectedOrder.address?.phone}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Order Items ({selectedOrder.items.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                      <img src={item.image} alt="" className="w-16 h-16 object-cover rounded bg-gray-50" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Size: <span className="font-medium text-gray-700">{item.size}</span> | Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-slate-800">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">{selectedOrder.shippingCharges === 0 ? 'FREE' : formatPrice(selectedOrder.shippingCharges)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Payment Details</h3>
                <div className="flex gap-4 text-sm">
                  <p><span className="text-gray-500">Method:</span> <span className="font-medium">{selectedOrder.payment?.method?.toUpperCase()}</span></p>
                  <p><span className="text-gray-500">Status:</span> <span className={`font-medium ${selectedOrder.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedOrder.payment?.status?.toUpperCase()}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
