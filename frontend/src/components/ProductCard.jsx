import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product._id);
  const discount = product.salePrice 
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;
  const inStock = product.sizes?.some(s => s.stock > 0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inStock) {
      addToCart(product, 1, product.sizes[0]?.name || 'M');
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 h-full">
        {/* Image Container */}
        <div className="relative h-32 sm:h-36 lg:h-40 bg-gray-50 overflow-hidden">
          <img
            src={product.images?.[0]?.url || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isWishlisted 
                ? 'bg-red-600 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-red-600 hover:text-white'
            }`}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Out of Stock Overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3">
          {/* Brand */}
          {product.brand?.name && (
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              {product.brand.name}
            </p>
          )}

          {/* Name */}
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm sm:text-base font-bold text-gray-900">
              ₹{product.salePrice || product.price}
            </span>
            {product.salePrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.price}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.round(product.rating?.average || 0) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">
              ({product.rating?.count || 0})
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-1 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] text-gray-500">
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`w-full py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all ${
              inStock
                ? 'bg-gray-900 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {inStock ? (
              <>
                <ShoppingCart size={14} />
                Add
              </>
            ) : (
              <>
                <Check size={14} />
                Notify
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
