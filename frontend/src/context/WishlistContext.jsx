import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      const serverProducts = data.data.wishlist?.products || [];
      setWishlist(serverProducts);
      localStorage.removeItem('wishlist');
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  // Watch for token changes (login/logout)
  const [token, setToken] = useState(localStorage.getItem('token'));
  useEffect(() => {
    const checkToken = () => {
      const current = localStorage.getItem('token');
      if (current !== token) {
        setToken(current);
        if (current) {
          fetchWishlist();
        } else {
          const stored = localStorage.getItem('wishlist');
          setWishlist(stored ? JSON.parse(stored) : []);
        }
      }
    };
    const interval = setInterval(checkToken, 500);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem('wishlist');
    if (stored && !localStorage.getItem('token')) {
      setWishlist(JSON.parse(stored));
    }
    
    if (localStorage.getItem('token')) {
      fetchWishlist();
    }
  }, []);

  // Save to localStorage when wishlist changes
  useEffect(() => {
    if (!localStorage.getItem('token') && wishlist.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const toggleWishlist = async (product) => {
    const productId = product._id;
    const isInWishlist = wishlist.some(p => 
      (p._id || p) === productId
    );

    try {
      if (localStorage.getItem('token')) {
        const { data } = await api.post(`/wishlist/toggle/${productId}`);
        const newIsInWishlist = data.data.isInWishlist;
        
        if (newIsInWishlist) {
          setWishlist(prev => [...prev, product]);
        } else {
          setWishlist(prev => prev.filter(p => (p._id || p) !== productId));
        }
      } else {
        // Guest - toggle locally
        if (isInWishlist) {
          setWishlist(prev => prev.filter(p => (p._id || p) !== productId));
          toast.success('Removed from wishlist');
        } else {
          setWishlist(prev => [...prev, product]);
          toast.success('Added to wishlist!');
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      }
      
      return !isInWishlist;
    } catch (error) {
      toast.error('Failed to update wishlist');
      return isInWishlist;
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(p => (p._id || p) === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlist, toggleWishlist, isInWishlist, count: wishlist.length
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
