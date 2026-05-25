const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard, getAllUsers, toggleUserStatus,
  getAllOrders, getRevenueAnalytics,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/orders', getAllOrders);
router.get('/analytics', getRevenueAnalytics);

// Admin force-update order status
const Order = require('../models/Order');
router.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('customer rider', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Emit socket update
    req.app.get('io').to(`order_${order._id}`).emit('order_update', { order });
    res.json({ order });
  } catch { res.status(500).json({ message: 'Failed to update order' }); }
});

module.exports = router;
