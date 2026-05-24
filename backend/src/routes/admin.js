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

module.exports = router;
