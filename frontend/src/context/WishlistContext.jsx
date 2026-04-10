import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    // Load from localStorage first
    const stored = localStorage.getItem('wishlist');
    if (stored) {
      setWishlist(JSON.parse(stored));
    }
    
    // If logged in, fetch from server
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

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data.data.wishlist?.products || []);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

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
