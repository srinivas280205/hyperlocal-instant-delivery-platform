const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

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

    if (user.role === 'rider')    { socket.join('riders'); socket.join(`rider_${user._id}`); }
    if (user.role === 'customer') { socket.join(`customer_${user._id}`); }
    if (user.role === 'admin')    { socket.join('admin'); }

    // ─── Rider location broadcast ────────────────────────────────────
    socket.on('update_location', async ({ lat, lng }) => {
      if (user.role !== 'rider') return;
      await User.findByIdAndUpdate(user._id, { currentLocation: { lat, lng } });
      socket.broadcast.emit(`rider_location_${user._id}`, { lat, lng, riderId: user._id });
    });

    // ─── Order room ──────────────────────────────────────────────────
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    // ─── Chat: send message ──────────────────────────────────────────
    socket.on('send_message', async ({ orderId, text }) => {
      if (!orderId || !text?.trim()) return;
      try {
        const msg = await Message.create({
          orderId,
          sender: user._id,
          senderRole: user.role,
          text: text.trim(),
        });
        const populated = await msg.populate('sender', 'name role');
        // Broadcast to everyone in the order room
        io.to(`order_${orderId}`).emit('new_message', populated);
      } catch (e) {
        socket.emit('chat_error', { message: 'Failed to send message' });
      }
    });

    // ─── Chat: mark messages as read ─────────────────────────────────
    socket.on('mark_read', async ({ orderId }) => {
      await Message.updateMany(
        { orderId, sender: { $ne: user._id }, read: false },
        { read: true }
      );
      io.to(`order_${orderId}`).emit('messages_read', { orderId, userId: user._id });
    });

    // ─── Typing indicator ────────────────────────────────────────────
    socket.on('typing', ({ orderId }) => {
      socket.to(`order_${orderId}`).emit('user_typing', { name: user.name, role: user.role });
    });
    socket.on('stop_typing', ({ orderId }) => {
      socket.to(`order_${orderId}`).emit('user_stop_typing', { role: user.role });
    });

    // ─── Disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (user.role === 'rider') {
        User.findByIdAndUpdate(user._id, { isAvailable: false }).catch(() => {});
      }
    });
  });
};
