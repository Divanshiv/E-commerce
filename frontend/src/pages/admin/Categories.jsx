import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Search, Tag, Hash, Package, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalProductsInCategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    Promise.all([fetchCategories(), fetchStats()]);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/categories/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const searchMatch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && cat.isActive) ||
        (statusFilter === 'inactive' && !cat.isActive);
      return searchMatch && statusMatch;
    });
  }, [categories, searchTerm, statusFilter]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      setSaving(true);
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', formData);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', isActive: true });
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const toggleActive = async category => {
    try {
      const { data } = await api.put(`/admin/categories/${category._id}`, {
        ...category,
        isActive: !category.isActive,
      });
      setCategories(prev => prev.map(c => (c._id === category._id ? { ...c, ...data.data } : c)));
      fetchStats();
      toast.success(category.isActive ? 'Category deactivated' : 'Category activated');
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const openEdit = category => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', isActive: true });
    setShowModal(true);
  };

  const statCards = [
    {
      label: 'Total Categories',
      value: stats.total,
      icon: Tag,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: Hash,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      icon: EyeOff,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
    },
    {
      label: 'Products in Categories',
      value: stats.totalProductsInCategories,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  if (loading) {
    return (
      <div className="admin-loading-pulse space-y-4">
        <div className="admin-skeleton-card w-full h-24" />
        <div className="admin-skeleton-card w-full h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="admin-page-title mb-0">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icon size={22} className={card.color} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-48 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 bg-white font-medium text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl overflow-hidden admin-widget-card p-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Products
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCategories.map(category => (
              <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center shrink-0">
                      <Tag size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[240px]">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-block px-2.5 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-mono text-gray-500">
                    {category.slug}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-bold text-sm">
                    {category.productCount}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(category)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      category.isActive
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                    {category.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openEdit(category)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(category)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty-state">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No categories match your filters.'
                    : 'No categories yet. Click "Add Category" to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center">
                  <Tag size={18} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingCategory ? 'Update category details' : 'Add a new product category'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Winter Jackets"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                />
                {formData.name && (
                  <p className="text-xs text-gray-400 mt-1">
                    Slug:{' '}
                    <span className="font-mono">
                      {formData.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this category..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-slate-700">Active</p>
                  <p className="text-xs text-gray-400">Visible in storefront and product filters</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-in p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Delete Category</h2>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">{deleteConfirm.name}</strong>?
            </p>
            {deleteConfirm.productCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ {deleteConfirm.productCount} product
                  {deleteConfirm.productCount > 1 ? 's are' : ' is'} linked to this category. Delete
                  may affect product display.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
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
