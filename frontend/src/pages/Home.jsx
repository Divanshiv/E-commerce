import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw, Shirt, Layers, Target, Glasses, Package } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data } = await api.get('/products/featured');
      setFeaturedProducts(data.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { slug: 'men-tshirts', name: "Men's Tees", icon: Shirt },
    { slug: 'women-tshirts', name: "Women's Tees", icon: Layers },
    { slug: 'hoodies', name: 'Hoodies', icon: Target },
    { slug: 'joggers', name: 'Joggers', icon: Package },
    { slug: 'accessories', name: 'Accessories', icon: Glasses },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/hero_banner.png" alt="Hero" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50/90 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-xl glass p-8 md:p-12 rounded-3xl animate-fade-in border border-gray-200 shadow-xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 drop-shadow-sm">
              Discover High-End <span className="text-gray-900 border-b-4 border-gray-900">Minimalism</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 border-l-4 border-gray-400 pl-4 py-1">
              Elevated essentials and timeless pieces designed for the modern aesthetic. Simplicity is the ultimate sophistication.
            </p>
            <Link 
              to="/products"
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition hover:scale-105 shadow-md"
            >
              Explore Collection <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 inline-block relative">
              Shop by Category
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gray-900 rounded-full"></div>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="bg-white hover:bg-gray-100 rounded-2xl p-8 text-center transition group flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md border border-gray-100"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-all">
                    <Icon size={32} />
                  </div>
                  <h3 className="font-semibold text-gray-700 group-hover:text-gray-900 transition">
                    {cat.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white relative border-y border-gray-100 shadow-sm align-middle">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
            <h2 className="text-3xl font-bold text-gray-900 relative">
              Featured Products
              <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gray-900 rounded-full"></div>
            </h2>
            <Link to="/products" className="text-gray-600 font-medium hover:text-gray-900 transition flex items-center gap-2">
              View All <ArrowRight size={18} />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl text-center border shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Truck className="text-gray-900" size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Free Worldwide Shipping</h3>
              <p className="text-gray-500 text-sm">On elite orders above ₹999</p>
            </div>
            <div className="bg-white p-8 rounded-3xl text-center border shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="text-gray-900" size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Secure Payment</h3>
              <p className="text-gray-500 text-sm">100% encrypted checkout</p>
            </div>
            <div className="bg-white p-8 rounded-3xl text-center border shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="text-gray-900" size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Easy Returns</h3>
              <p className="text-gray-500 text-sm">7 day hassle-free return policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
