import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingBag, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="admin-loading-pulse">
        <div className="admin-grid-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  const { stats: dashboardStats, recentOrders, lowStockProducts } = stats || {};

  return (
    <div className="admin-dashboard-wrapper">
      <h1 className="admin-page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="admin-grid-4 admin-metrics-container">
        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div>
              <p className="admin-stat-label">Total Revenue</p>
              <p className="admin-stat-value">{formatPrice(dashboardStats?.totalRevenue || 0)}</p>
            </div>
            <div className="admin-icon-wrap bg-green-light">
              <DollarSign className="icon-green" size={24} />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div>
              <p className="admin-stat-label">Total Orders</p>
              <p className="admin-stat-value">{dashboardStats?.totalOrders || 0}</p>
            </div>
            <div className="admin-icon-wrap bg-blue-light">
              <ShoppingBag className="icon-blue" size={24} />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div>
              <p className="admin-stat-label">Total Products</p>
              <p className="admin-stat-value">{dashboardStats?.totalProducts || 0}</p>
            </div>
            <div className="admin-icon-wrap bg-purple-light">
              <Package className="icon-purple" size={24} />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div>
              <p className="admin-stat-label">Total Customers</p>
              <p className="admin-stat-value">{dashboardStats?.totalUsers || 0}</p>
            </div>
            <div className="admin-icon-wrap bg-orange-light">
              <Users className="icon-orange" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Recent Orders */}
        <div className="admin-widget-card">
          <div className="admin-widget-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="admin-link">
              View All
            </Link>
          </div>
          <div className="admin-list-group">
            {recentOrders?.map(order => (
              <div key={order._id} className="admin-list-item">
                <div>
                  <p className="admin-item-title">{order.orderNumber}</p>
                  <p className="admin-item-subtitle">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="admin-item-title">{formatPrice(order.total)}</p>
                  <p className="admin-item-status capitalize">{order.status}</p>
                </div>
              </div>
            ))}
            {!recentOrders?.length && <p className="admin-empty-state">No orders yet</p>}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="admin-widget-card">
          <div className="admin-widget-header">
            <h2>Low Stock Alert</h2>
            <Link to="/admin/products" className="admin-link">
              View All
            </Link>
          </div>
          <div className="admin-list-group">
            {lowStockProducts?.map(product => (
              <div key={product._id} className="admin-list-item">
                <div className="admin-item-flex">
                  <div className="admin-icon-small-wrap bg-red-light">
                    <AlertTriangle className="icon-red" size={18} />
                  </div>
                  <div>
                    <p className="admin-item-title admin-truncate">{product.name}</p>
                    <p className="admin-item-subtitle">
                      {product.sizes?.reduce((sum, s) => sum + s.stock, 0)} units left
                    </p>
                  </div>
                </div>
                <Link to={`/admin/products?id=${product._id}`} className="admin-link">
                  Edit
                </Link>
              </div>
            ))}
            {!lowStockProducts?.length && (
              <p className="admin-empty-state">All products are well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
