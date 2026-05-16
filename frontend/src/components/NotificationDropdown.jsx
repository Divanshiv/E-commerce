import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  X,
  CheckCheck,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import api from '../lib/api';

const NOTIFICATION_ICONS = {
  new_order: ShoppingBag,
  order_status: RefreshCw,
  low_stock: AlertTriangle,
  new_customer: UserPlus,
  payment_failed: CreditCard,
};

const NOTIFICATION_COLORS = {
  new_order: 'bg-blue-50 text-blue-600',
  order_status: 'bg-purple-50 text-purple-600',
  low_stock: 'bg-orange-50 text-orange-600',
  new_customer: 'bg-green-50 text-green-600',
  payment_failed: 'bg-red-50 text-red-600',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications', { params: { limit: 8 } });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications/unread-count');
      setUnreadCount(data.data.unreadCount);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load + auto-poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Refresh full list when opening dropdown
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAsRead = async id => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = notification => {
    if (!notification.read) markAsRead(notification._id);
    setOpen(false);

    // Navigate based on type
    if (notification.data?.orderId) {
      navigate('/admin/orders');
    } else if (notification.data?.productId) {
      navigate('/admin/products');
    } else if (notification.data?.customerId) {
      navigate('/admin/customers');
    }
  };

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="sk-admin-notif-bell"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown-panel">
          <div className="notif-dropdown-header">
            <div>
              <span className="notif-dropdown-title">Notifications</span>
              {unreadCount > 0 && <span className="notif-unread-label">{unreadCount} unread</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="notif-mark-all-btn">
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown-body">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={32} className="notif-empty-icon" />
                <p className="notif-empty-text">No notifications yet</p>
                <p className="notif-empty-sub">New orders and alerts will appear here</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[n.type] || 'bg-gray-50 text-gray-600';
                return (
                  <div
                    key={n._id}
                    className={`notif-item ${!n.read ? 'notif-item-unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`notif-item-icon ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-header">
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="notif-item-message">{n.message}</p>
                    </div>
                    <div className="notif-item-actions">
                      {!n.read && <span className="notif-unread-dot" />}
                      <button
                        className="notif-item-mark"
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(n._id);
                        }}
                        title="Mark as read"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="notif-dropdown-footer">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/admin/orders');
              }}
              className="notif-view-all-btn"
            >
              <ExternalLink size={14} />
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
