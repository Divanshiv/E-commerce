import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    category: 'men-tshirts',
    sizes: [{ name: 'M', stock: 0 }],
    images: [{ url: '' }],
    isFeatured: false,
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct._id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', formData);
        toast.success('Product created');
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || '',
      category: product.category,
      sizes: product.sizes || [{ name: 'M', stock: 0 }],
      images: product.images || [{ url: '' }],
      isFeatured: product.isFeatured,
      isActive: product.isActive
    });
    setShowModal(true);
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { name: 'L', stock: 0 }]
    });
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '', description: '', price: '', salePrice: '',
              category: 'men-tshirts', sizes: [{ name: 'M', stock: 0 }],
              images: [{ url: '' }], isFeatured: false, isActive: true
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(product => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/48'}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.brand?.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm capitalize">{product.category?.replace('-', ' ')}</td>
                <td className="px-6 py-4">
                  <p className="font-medium">₹{product.salePrice || product.price}</p>
                  {product.salePrice && <p className="text-xs text-gray-400 line-through">₹{product.price}</p>}
                </td>
                <td className="px-6 py-4 text-sm">
                  {product.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0} units
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(product)} className="p-2 hover:bg-gray-100 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="p-2 hover:bg-red-100 text-red-600 rounded ml-2">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="men-tshirts">Men's Tees</option>
                  <option value="women-tshirts">Women's Tees</option>
                  <option value="hoodies">Hoodies</option>
                  <option value="joggers">Joggers</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.images[0]?.url}
                  onChange={(e) => setFormData({ ...formData, images: [{ url: e.target.value }] })}
                  placeholder="https://..."
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Sizes & Stock</label>
                <div className="space-y-2">
                  {formData.sizes.map((size, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={size.name}
                        onChange={(e) => updateSize(i, 'name', e.target.value)}
                        className="border rounded-lg px-3 py-2"
                      >
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={size.stock}
                        onChange={(e) => updateSize(i, 'stock', parseInt(e.target.value) || 0)}
                        placeholder="Stock"
                        className="w-24 border rounded-lg px-3 py-2"
                      />
                      {formData.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            sizes: formData.sizes.filter((_, idx) => idx !== i)
                          })}
                          className="text-red-500 px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addSize} className="text-sm text-red-600">
                    + Add Size
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold">
                {editingProduct ? 'Update' : 'Create'} Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
