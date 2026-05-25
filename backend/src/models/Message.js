const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  orderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  senderRole: { type: String, enum: ['customer', 'rider'], required: true },
  text:     { type: String, required: true, trim: true, maxlength: 500 },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
