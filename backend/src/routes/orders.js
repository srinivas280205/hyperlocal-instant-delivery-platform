const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Message = require('../models/Message');
const {
  createOrder, getPriceEstimate, getMyOrders, getOrder,
  acceptOrder, updateOrderStatus, verifyOtp,
  cancelOrder, rateOrder, getPendingOrders,
} = require('../controllers/orderController');

router.post('/estimate', protect, getPriceEstimate);
router.post('/', protect, authorize('customer'), createOrder);
router.get('/my', protect, getMyOrders);
router.get('/pending', protect, authorize('rider'), getPendingOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/accept', protect, authorize('rider'), acceptOrder);
router.put('/:id/status', protect, authorize('rider'), updateOrderStatus);
router.post('/:id/verify-otp', protect, verifyOtp);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/rate', protect, authorize('customer'), rateOrder);

// Chat history
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ orderId: req.params.id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch { res.status(500).json({ message: 'Failed to load messages' }); }
});

module.exports = router;
