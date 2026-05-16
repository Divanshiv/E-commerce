import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [brands, setBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: '',
    maxPrice: '',
    size: '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: 1,
  });

  const categories = [
    { slug: '', name: 'All Products' },
    { slug: 'men-tshirts', name: "Men's Tees" },
    { slug: 'women-tshirts', name: "Women's Tees" },
    { slug: 'hoodies', name: 'Hoodies' },
    { slug: 'joggers', name: 'Joggers' },
    { slug: 'accessories', name: 'Accessories' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: '-rating.average', label: 'Popularity' },
  ];

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page: filters.page };
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.size) params.size = filters.size;
      if (filters.search) params.search = filters.search;

      // Handle sort
      if (filters.sort === 'price_asc') params.sort = 'price';
      else if (filters.sort === 'price_desc') params.sort = '-price';
      else params.sort = filters.sort;

      const { data } = await api.get('/products', { params });
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/brands');
      setBrands(data.data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? prev.page : 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      size: '',
      search: '',
      sort: '-createdAt',
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.size ||
    filters.search;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {categories.find(c => c.slug === filters.category)?.name || 'All Products'}
            </h1>
            {filters.search && (
              <p className="text-gray-500 text-sm mt-1">Search results for "{filters.search}"</p>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={e => updateFilter('sort', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <aside
            className={
              showFilters
                ? 'fixed inset-0 z-50 flex justify-start'
                : 'hidden lg:block w-64 flex-shrink-0'
            }
          >
            {/* Backdrop */}
            {showFilters && (
              <div
                className="absolute inset-0 bg-black opacity-50"
                onClick={() => setShowFilters(false)}
              ></div>
            )}

            <div
              className={`relative bg-white h-full max-h-screen overflow-y-auto lg:h-auto lg:overflow-visible transition-transform ${showFilters ? 'w-4/5 max-w-sm rounded-r-2xl p-5 shadow-2xl' : 'w-full rounded-xl border border-gray-200 p-6 sticky top-24'}`}
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-500 font-medium hover:text-red-400 transition"
                    >
                      Clear All
                    </button>
                  )}
                  {showFilters && (
                    <button
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden text-gray-500 hover:text-white transition bg-gray-800 p-1 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Keyword Search */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Keyword</h4>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        filters.category === cat.slug
                          ? 'bg-red-50 text-red-700 font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={e => updateFilter('minPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={e => updateFilter('maxPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => updateFilter('size', filters.size === size ? '' : size)}
                      className={`w-10 h-10 border rounded-lg text-sm font-medium transition ${
                        filters.size === size
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              {brands.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Brand</h4>
                  <div className="space-y-2">
                    {brands.map(brand => (
                      <label key={brand._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.brand === brand._id}
                          onChange={() =>
                            updateFilter('brand', filters.brand === brand._id ? '' : brand._id)
                          }
                          className="rounded text-red-600"
                        />
                        <span className="text-sm">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="products-grid">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">No products found</p>
                <button onClick={clearFilters} className="text-red-600 font-medium">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateFilter('page', i + 1)}
                        className={`w-10 h-10 rounded-lg font-medium ${
                          pagination.page === i + 1
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
