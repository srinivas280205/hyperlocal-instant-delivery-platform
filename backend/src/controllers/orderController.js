const Order = require('../models/Order');
const User = require('../models/User');
const { calculatePrice, calculateDistance, estimateTime } = require('../utils/pricing');

exports.createOrder = async (req, res) => {
  try {
    const {
      pickup, dropoff, packageType, packageDescription,
      weight, deliverySpeed, paymentMethod, scheduledTime,
    } = req.body;

    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    if (distance > 25) return res.status(400).json({ success: false, message: 'Max delivery range is 25 km' });

    const price = calculatePrice(distance, packageType, deliverySpeed, weight || 1);
    const estimated = estimateTime(distance, deliverySpeed);

    const order = await Order.create({
      customer: req.user._id,
      pickup, dropoff, packageType, packageDescription,
      weight: weight || 1, deliverySpeed, paymentMethod,
      scheduledTime: scheduledTime || null,
      price, distance: Math.round(distance * 10) / 10,
      estimatedTime: estimated,
      statusHistory: [{ status: 'pending', note: 'Order created' }],
    });

    const io = req.app.get('io');
    io.to('riders').emit('new_order', { order: await order.populate('customer', 'name phone') });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPriceEstimate = async (req, res) => {
  try {
    const { pickup, dropoff, packageType, deliverySpeed, weight } = req.body;
    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const price = calculatePrice(distance, packageType || 'other', deliverySpeed || 'standard', weight || 1);
    const estimated = estimateTime(distance, deliverySpeed || 'standard');
    res.json({ success: true, price, distance: Math.round(distance * 10) / 10, estimatedTime: estimated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'customer'
      ? { customer: req.user._id }
      : { rider: req.user._id };
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .populate('rider', 'name phone vehicleType vehicleNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('rider', 'name phone vehicleType vehicleNumber currentLocation rating');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ success: false, message: 'Order already taken' });

    order.rider = req.user._id;
    order.status = 'accepted';
    order.statusHistory.push({ status: 'accepted', note: 'Rider accepted' });
    await order.save();

    const populated = await order.populate(['customer', 'rider']);
    const io = req.app.get('io');
    io.to(`customer_${order.customer._id}`).emit('order_update', { order: populated });

    res.json({ success: true, order: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedTransitions = {
      accepted: 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    };
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (String(order.rider) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not your order' });
    if (allowedTransitions[order.status] !== status) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    order.status = status;
    order.statusHistory.push({ status, note: `Status updated to ${status}` });
    if (status === 'delivered') {
      order.paymentStatus = order.paymentMethod === 'cash' ? 'pending' : 'paid';
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalDeliveries: 1, totalEarnings: order.price * 0.8 },
      });
    }
    await order.save();

    const io = req.app.get('io');
    io.to(`customer_${order.customer}`).emit('order_update', { order });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    order.otpVerified = true;
    order.status = 'delivered';
    order.statusHistory.push({ status: 'delivered', note: 'OTP verified — delivery confirmed' });
    order.paymentStatus = 'paid';
    await order.save();

    res.json({ success: true, message: 'Delivery confirmed!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel after pickup' });
    }
    if (String(order.customer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || '';
    order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });
    await order.save();

    const io = req.app.get('io');
    if (order.rider) io.to(`rider_${order.rider}`).emit('order_cancelled', { orderId: order._id });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rateOrder = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'delivered') return res.status(400).json({ success: false, message: 'Can only rate delivered orders' });

    order.rating = rating;
    order.review = review || '';
    await order.save();

    const rider = await User.findById(order.rider);
    if (rider) {
      const newCount = rider.ratingCount + 1;
      rider.rating = (rider.rating * rider.ratingCount + rating) / newCount;
      rider.ratingCount = newCount;
      await rider.save();
    }

    res.json({ success: true, message: 'Thank you for rating!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'pending' })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
