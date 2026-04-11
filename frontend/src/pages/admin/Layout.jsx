import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Ticket, Truck, LogOut, Tags, ClipboardList, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/categories', icon: Tags, label: 'Categories' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/inventory', icon: ClipboardList, label: 'Inventory' },
  { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { path: '/admin/shipment', icon: Truck, label: 'Shipment' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="admin-layout">
      
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-logo">SHOPKART</Link>
          <p className="admin-subtitle">Admin Panel</p>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-user-profile">
          <div className="admin-user-details">
            <div className="admin-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <p className="admin-user-name" title={user?.name}>{user?.name}</p>
              <p className="admin-user-email" title={user?.email}>{user?.email}</p>
            </div>
            <button onClick={logout} className="admin-logout-btn" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="admin-main">
        
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button 
              onClick={toggleSidebar}
              className="admin-mobile-toggle"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <h2 className="admin-breadcrumb">
              {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop().replace('-', ' ')}
            </h2>
          </div>

          <div className="admin-header-right">
            <button className="admin-notification-btn">
              <Bell size={20} />
              <span className="admin-notification-badge"></span>
            </button>
            <div className="admin-user-details" style={{ color: '#1e293b' }}>
              <div className="admin-user-info" style={{ textAlign: 'right' }}>
                <p className="admin-user-name" style={{ color: '#1e293b' }}>{user?.name}</p>
                <p className="admin-user-email" style={{ color: '#64748b' }}>{user?.role || 'Admin'}</p>
              </div>
              <div className="admin-avatar" style={{ marginLeft: '12px' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
