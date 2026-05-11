import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const WishlistPage = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import('./pages/admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminShipment = lazy(() => import('./pages/admin/Shipment'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className={`min-h-screen flex flex-col ${isAdminRoute ? 'bg-admin' : 'bg-white'}`}>
            {!isAdminRoute && <Navbar />}
            <main className={isAdminRoute ? 'admin-main-wrapper' : 'flex-1'}>
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Buyer Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Protected Buyer Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="shipment" element={<AdminShipment />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>
              </Routes>
              </Suspense>
              </ErrorBoundary>
            </main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <CartDrawer />}
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
