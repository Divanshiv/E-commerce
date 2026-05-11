import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Ticket, Truck, LogOut, Tags, ClipboardList, Menu, X, Bell, Settings } from 'lucide-react';
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
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="sk-admin-layout">
      
      {/* Sidebar Component */}
      <aside className={`sk-admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sk-admin-sidebar-header">
          <Link to="/" className="sk-admin-logo">KALAAH STUDIO</Link>
          <p className="sk-admin-brand-tag">Terminal v1.0</p>
        </div>

        <nav className="sk-admin-nav">
          {navItems.map(item => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sk-admin-nav-item ${isActive ? 'is-active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sk-admin-sidebar-footer">
          {/* Admin Status Debug Indicator */}
          <div className={`sk-admin-status-badge ${user?.role === 'admin' ? 'is-verified' : 'is-warning'}`}>
            <div className="sk-admin-pulse-dot"></div>
            <span>{user?.role === 'admin' ? 'Admin Access Verified' : 'Check Access Role'}</span>
          </div>

          <div className="sk-admin-profile-pill">
            <div className="sk-admin-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sk-admin-user-meta">
              <span className="sk-admin-user-name">{user?.name}</span>
              <span className="sk-admin-user-role">{user?.role || 'Admin'}</span>
            </div>
            <button onClick={logout} className="sk-admin-logout-trigger" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="sk-admin-main">
        
        {/* Top Header Bar */}
        <header className="sk-admin-header">
          <div className="sk-admin-header-start">
            <button onClick={toggleSidebar} className="sk-admin-menu-toggle">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="sk-admin-breadcrumb">
              <span className="sk-admin-current-page">
                {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop().replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="sk-admin-header-end">
            <div className="sk-admin-stat-dot">
              <div className="sk-admin-pulse-dot"></div>
              <span>Live System</span>
            </div>
            <button className="sk-admin-notif-bell">
              <Bell size={20} />
              <span className="sk-admin-notif-indicator"></span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="sk-admin-content-area">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
