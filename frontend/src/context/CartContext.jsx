import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], couponApplied: null });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data.data.cart || { items: [], couponApplied: null });
    } catch (error) {
      console.error('Fetch cart error:', error);
    }
  };

  // Fetch cart on mount if logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchCart();
    } else {
      // Load guest cart from localStorage
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        setCart(JSON.parse(guestCart));
      }
    }
  }, []);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!localStorage.getItem('token') && cart.items.length > 0) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = async (product, quantity = 1, size) => {
    try {
      setLoading(true);
      
      if (localStorage.getItem('token')) {
        // Logged in - use API
        const { data } = await api.post('/cart/items', {
          productId: product._id,
          quantity,
          size,
          price: product.salePrice || product.price
        });
        setCart(data.data.cart);
      } else {
        // Guest - use local state
        const existingIndex = cart.items.findIndex(
          item => item.product._id === product._id && item.size === size
        );
        
        let newItems = [...cart.items];
        if (existingIndex > -1) {
          newItems[existingIndex].quantity += quantity;
        } else {
          newItems.push({
            product,
            quantity,
            size,
            price: product.salePrice || product.price
          });
        }
        setCart({ ...cart, items: newItems });
      }
      
      toast.success('Added to cart!');
      setDrawerOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (localStorage.getItem('token')) {
        const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
        setCart(data.data.cart);
      } else {
        const newItems = cart.items.map(item => 
          item.product._id === itemId 
            ? { ...item, quantity: quantity < 1 ? 1 : quantity }
            : item
        ).filter(item => item.quantity > 0);
        setCart({ ...cart, items: newItems });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const removeItem = async (itemId) => {
    try {
      if (localStorage.getItem('token')) {
        const { data } = await api.delete(`/cart/items/${itemId}`);
        setCart(data.data.cart);
      } else {
        const newItems = cart.items.filter(item => item.product._id !== itemId);
        setCart({ ...cart, items: newItems });
      }
      toast.success('Removed from cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  };

  const applyCoupon = async (code) => {
    try {
      const { data } = await api.post('/cart/apply-coupon', { code });
      setCart(data.data.cart);
      toast.success('Coupon applied!');
      return data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon');
      throw error;
    }
  };

  const clearCart = async () => {
    setCart({ items: [], couponApplied: null });
    localStorage.removeItem('guestCart');
    if (localStorage.getItem('token')) {
      await api.delete('/cart');
    }
  };

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = cart.couponApplied?.discountAmount || 0;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, loading, drawerOpen, setDrawerOpen,
      addToCart, updateQuantity, removeItem, clearCart,
      applyCoupon, fetchCart,
      subtotal, discount, itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
