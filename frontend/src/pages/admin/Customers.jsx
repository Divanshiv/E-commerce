import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, MapPin, Mail, Phone, Calendar } from 'lucide-react';
import api from '../../lib/api';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Data
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/admin/customers');
      setCustomers(data.data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const s = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(s) ||
        customer.email?.toLowerCase().includes(s) ||
        customer.phone?.includes(s)
      );
    });
  }, [customers, searchTerm]);

  return (
    <div>
      <h1 className="admin-page-title mb-6">Customers</h1>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by Name, Email, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
              <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map(customer => (
              <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center font-bold font-heading">
                      {customer.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{customer.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600">{customer.email}</td>
                <td className="p-4 text-sm text-gray-600 font-mono">{customer.phone || '-'}</td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="View Full Profile"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty-state">No customers found matching search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold text-2xl font-heading">
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-800">{selectedCustomer.name}</h2>
                  <p className="text-sm text-gray-500">Customer ID: {selectedCustomer._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded text-gray-500">
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="admin-grid-2">
                <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm text-gray-400"><Mail size={18} /></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Email Account</p>
                    <p className="font-medium text-slate-800">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm text-gray-400"><Phone size={18} /></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Phone Number</p>
                    <p className="font-medium text-slate-800">{selectedCustomer.phone || 'Not Provided'}</p>
                  </div>
                </div>
              </div>

              {/* Saved Addresses */}
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <MapPin size={18} className="text-gray-400" /> Saved Addresses ({selectedCustomer.addresses?.length || 0})
                </h3>
                {selectedCustomer.addresses?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 relative bg-white shadow-sm">
                        {addr.isDefault && (
                          <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">DEFAULT</span>
                        )}
                        <p className="font-medium text-slate-800 mb-1">{addr.street}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state}</p>
                        <p className="text-sm text-gray-600 font-mono mt-1">PIN: {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">No addresses saved yet.</p>
                )}
              </div>

              {/* Meta */}
              <div className="border-t border-gray-100 pt-4 flex gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={16} /> Joined: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                </div>
                <div>Account Role: <span className="uppercase font-mono ml-1 px-2 py-0.5 bg-gray-100 rounded">{selectedCustomer.role}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
