import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SearchAutocomplete from './SearchAutocomplete';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { count } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.svg" alt="Kalaah Studio" className="h-9 w-auto" />
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchAutocomplete />
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 hover:bg-gray-100 rounded-full relative">
              <Heart size={22} className="text-gray-700" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full relative">
              <ShoppingCart size={22} className="text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative group">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <User size={22} className="text-gray-700" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50">My Orders</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50">Admin Panel</Link>
                    )}
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/login"
                className="hidden md:block bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <SearchAutocomplete />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
          <div className="flex flex-col gap-2">
            <Link to="/products" className="py-2 text-sm font-medium">All Products</Link>
            <Link to="/products?category=men-tshirts" className="py-2 text-sm">Men's Tees</Link>
            <Link to="/products?category=women-tshirts" className="py-2 text-sm">Women's Tees</Link>
            <Link to="/products?category=hoodies" className="py-2 text-sm">Hoodies</Link>
            <Link to="/products?category=joggers" className="py-2 text-sm">Joggers</Link>
            <div className="border-t border-gray-200 pt-2 mt-2">
              {user ? (
                <>
                  <Link to="/orders" className="block py-2 text-sm">My Orders</Link>
                  {isAdmin && <Link to="/admin" className="block py-2 text-sm">Admin Panel</Link>}
                  <button onClick={logout} className="py-2 text-sm text-red-600">Logout</button>
                </>
              ) : (
                <Link to="/login" className="block py-2 text-sm font-medium text-red-600">Login / Sign Up</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
