import Notification from '../models/Notification.js';

// Admin: Get notifications with pagination
export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const filter = {};
    if (unreadOnly) filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ read: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get unread count only (lightweight)
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

// Admin: Mark single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

// Admin: Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ read: false }, { read: true });
    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ── Trigger Helpers (called from other controllers) ──

export const createNewOrderNotification = async (order, user) => {
  try {
    await Notification.create({
      type: 'new_order',
      title: 'New Order Received',
      message: `Order ${order.orderNumber} placed by ${user.name} — ₹${order.total}`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: user.name,
        amount: order.total,
      },
    });
  } catch (error) {
    console.error('Failed to create order notification:', error.message);
  }
};

export const createOrderStatusNotification = async (order, previousStatus) => {
  try {
    await Notification.create({
      type: 'order_status',
      title: 'Order Status Updated',
      message: `Order ${order.orderNumber} changed from ${previousStatus} to ${order.status}`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.total,
      },
    });
  } catch (error) {
    console.error('Failed to create status notification:', error.message);
  }
};

export const createLowStockNotification = async (product, sizeInfo) => {
  try {
    const sizeDetail = sizeInfo ? ` (Size: ${sizeInfo.size}, Stock: ${sizeInfo.stock})` : '';
    await Notification.create({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${product.name}${sizeDetail} is running low — only ${sizeInfo?.stock || product.stock} left`,
      data: {
        productId: product._id,
        productName: product.name,
      },
    });
  } catch (error) {
    console.error('Failed to create stock notification:', error.message);
  }
};

export const createNewCustomerNotification = async user => {
  try {
    await Notification.create({
      type: 'new_customer',
      title: 'New Customer Registered',
      message: `${user.name} (${user.email}) just created an account`,
      data: {
        customerId: user._id,
        customerName: user.name,
      },
    });
  } catch (error) {
    console.error('Failed to create customer notification:', error.message);
  }
};
