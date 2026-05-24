const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    if (user.role === 'rider') {
      socket.join('riders');
      socket.join(`rider_${user._id}`);
    }
    if (user.role === 'customer') {
      socket.join(`customer_${user._id}`);
    }
    if (user.role === 'admin') {
      socket.join('admin');
    }

    socket.on('update_location', async ({ lat, lng }) => {
      if (user.role !== 'rider') return;
      await User.findByIdAndUpdate(user._id, { currentLocation: { lat, lng } });
      // Broadcast rider location to customers who have active orders with this rider
      socket.broadcast.emit(`rider_location_${user._id}`, { lat, lng, riderId: user._id });
    });

    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      if (user.role === 'rider') {
        User.findByIdAndUpdate(user._id, { isAvailable: false }).catch(() => {});
      }
    });
  });
};
