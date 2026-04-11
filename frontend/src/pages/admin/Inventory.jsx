import { useState, useEffect, useMemo } from 'react';
import { Search, Save, Settings } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      // Need to retrieve ALL products to see their stock
      const { data } = await api.get('/admin/products?limit=100');
      // Deep clone so we can track dirty state if needed
      setProducts(JSON.parse(JSON.stringify(data.data.products)));
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleStockChange = (productId, sizeIndex, newValue) => {
    const value = parseInt(newValue) || 0;
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p._id === productId) {
          const updatedSizes = [...p.sizes];
          if (updatedSizes[sizeIndex]) {
            updatedSizes[sizeIndex].stock = value;
          }
          return { ...p, sizes: updatedSizes, _isDirty: true };
        }
        return p;
      })
    );
  };

  const handleAddSizeVariant = (productId) => {
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p._id === productId) {
          const updatedSizes = [...p.sizes, { name: 'M', stock: 0 }];
          return { ...p, sizes: updatedSizes, _isDirty: true };
        }
        return p;
      })
    );
  }

  const handleSizeNameChange = (productId, sizeIndex, newName) => {
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p._id === productId) {
          const updatedSizes = [...p.sizes];
          if (updatedSizes[sizeIndex]) {
            updatedSizes[sizeIndex].name = newName;
          }
          return { ...p, sizes: updatedSizes, _isDirty: true };
        }
        return p;
      })
    );
  };

  const removeSizeVariant = (productId, sizeIndex) => {
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p._id === productId) {
          const updatedSizes = p.sizes.filter((_, idx) => idx !== sizeIndex);
          return { ...p, sizes: updatedSizes, _isDirty: true };
        }
        return p;
      })
    );
  };

  const saveInventoryRow = async (product) => {
    if (!product._isDirty) return;
    
    setSavingId(product._id);
    try {
      await api.put(`/admin/products/${product._id}`, { sizes: product.sizes });
      toast.success(`Inventory updated for ${product.name}`);
      
      // Clear dirty flag
      setProducts(prevProducts => 
        prevProducts.map(p => {
          if (p._id === product._id) {
            return { ...p, _isDirty: false };
          }
          return p;
        })
      );
    } catch (error) {
      toast.error(`Failed to update ${product.name}`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-pulse">
        <div className="admin-skeleton-card w-full h-64" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="admin-page-title mb-6">Bulk Inventory</h1>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search products to manage stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0 shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Product</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Total Stock</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[300px]">Size Variants Mapping</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => {
                const totalStock = product.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
                const isOutOfStock = totalStock === 0;
                
                return (
                  <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${product._isDirty ? 'bg-yellow-50/30' : ''}`}>
                    <td className="p-4 bg-white/50">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/48'}
                          alt=""
                          className="w-10 h-10 object-cover rounded bg-gray-100 border border-gray-200 shadow-sm"
                        />
                        <div className="w-48 xl:w-64 whitespace-normal">
                          <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 bg-white/50">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {totalStock}
                      </span>
                    </td>

                    <td className="p-4 align-top w-full">
                      <div className="flex flex-wrap gap-2">
                        {product.sizes?.map((size, idx) => (
                          <div key={idx} className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden items-stretch">
                            <select
                              value={size.name}
                              onChange={e => handleSizeNameChange(product._id, idx, e.target.value)}
                              className="w-16 bg-gray-50 border-r border-gray-200 px-2 py-1 outline-none text-xs font-bold text-center appearance-none focus:ring-1 focus:ring-red-500 z-10 cursor-pointer"
                            >
                              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={size.stock}
                              onChange={e => handleStockChange(product._id, idx, e.target.value)}
                              className="w-16 px-2 py-1 outline-none font-mono text-sm text-center focus:bg-blue-50"
                            />
                            {product.sizes.length > 1 && (
                              <button 
                                onClick={() => removeSizeVariant(product._id, idx)}
                                className="px-2 border-l border-gray-200 bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddSizeVariant(product._id)}
                          className="flex items-center justify-center p-2 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
                        >
                          + Add Size
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right align-middle bg-white/50">
                      <button
                        onClick={() => saveInventoryRow(product)}
                        disabled={!product._isDirty || savingId === product._id}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all w-[100px] float-right ${
                          savingId === product._id 
                            ? 'bg-gray-100 text-gray-400' 
                            : product._isDirty 
                              ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800' 
                              : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {savingId === product._id ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save size={14} /> Save
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="4" className="admin-empty-state py-12">No products match your inventory search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
