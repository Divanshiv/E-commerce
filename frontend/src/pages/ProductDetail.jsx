import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Star, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/slug/${slug}`);
      setProduct(data.data.product);
      
      // Fetch related products
      const related = await api.get('/products', { 
        params: { category: data.data.product.category, limit: 4 } 
      });
      setRelatedProducts(related.data.data.products.filter(p => p._id !== data.data.product._id));
      
      // Set default size
      if (data.data.product.sizes?.length > 0) {
        const availableSize = data.data.product.sizes.find(s => s.stock > 0);
        if (availableSize) setSelectedSize(availableSize.name);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product, quantity, selectedSize);
  };

  const isWishlisted = product && isInWishlist(product._id);
  const discount = product?.salePrice 
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-500">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : [{ url: 'https://via.placeholder.com/600' }];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === i ? 'border-red-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.brand?.name && (
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                {product.brand.name}
              </p>
            )}
            
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.round(product.rating?.average || 0) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product.rating?.count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold">₹{product.salePrice || product.price}</span>
              {product.salePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Select Size</span>
                <button className="text-sm text-red-600">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map(size => (
                  <button
                    key={size.name}
                    onClick={() => size.stock > 0 && setSelectedSize(size.name)}
                    disabled={size.stock === 0}
                    className={`w-12 h-12 border-2 rounded-lg font-medium transition ${
                      selectedSize === size.name
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : size.stock === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size.name}
                    {size.stock === 0 && <span className="block text-xs">Out</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <span className="font-medium block mb-3">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Minus size={18} />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-gray-100"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 border-2 rounded-lg transition ${
                  isWishlisted 
                    ? 'border-red-600 bg-red-50 text-red-600' 
                    : 'border-gray-300 hover:border-red-600'
                }`}
              >
                <Heart size={24} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Features */}
            <div className="border-t pt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-xs text-gray-500">Free Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-xs text-gray-500">Secure Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-xs text-gray-500">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
