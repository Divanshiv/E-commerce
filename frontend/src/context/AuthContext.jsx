import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

function mergeGuestCart() {
  const guestCart = localStorage.getItem('guestCart');
  if (!guestCart) return;
  const { items } = JSON.parse(guestCart);
  if (!items || items.length === 0) return;

  items.forEach(item => {
    api.post('/cart/items', {
      productId: item.product?._id || item.product,
      quantity: item.quantity,
      size: item.size,
      price: item.price
    }).catch(() => {});
  });
  localStorage.removeItem('guestCart');
}

function mergeGuestWishlist() {
  const wishlistData = localStorage.getItem('wishlist');
  if (wishlistData) {
    const items = JSON.parse(wishlistData);
    if (items && items.length > 0) {
      items.forEach(item => {
        const productId = item._id || item;
        api.post(`/wishlist/${productId}`).catch(() => {});
      });
    }
    localStorage.removeItem('wishlist');
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        try {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('token', token);
          mergeGuestCart();
          mergeGuestWishlist();
        } catch (err) {
          console.error('Session restore failed:', err);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('token', session.access_token);
          if (event === 'SIGNED_IN') {
            mergeGuestCart();
            mergeGuestWishlist();
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify with backend and get MongoDB user
      const response = await api.post('/auth/login', { email, password });
      const { user: mongoUser, session } = response.data.data;

      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(mongoUser));
      setUser(mongoUser);

      toast.success('Welcome back!');
      return mongoUser;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) throw error;

      toast.success('Account created! Please check your email to verify.');
      return data;
    } catch (error) {
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const googleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed');
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, googleLogin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
