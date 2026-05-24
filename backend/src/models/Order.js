const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  pickup: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
  },
  dropoff: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
  },

  packageType: {
    type: String,
    enum: ['medicine', 'food', 'tea_snacks', 'documents', 'fragile', 'gift', 'grocery', 'electronics', 'household', 'other'],
    required: true,
  },
  packageDescription: { type: String, default: '' },
  packageImage: { type: String, default: '' },
  weight: { type: Number, default: 1 },

  deliverySpeed: {
    type: String,
    enum: ['express', 'standard', 'scheduled'],
    default: 'standard',
  },
  scheduledTime: { type: Date, default: null },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
    default: 'pending',
  },

  price: { type: Number, required: true },
  distance: { type: Number, required: true },

  otp: { type: String, default: '' },
  otpVerified: { type: Boolean, default: false },

  paymentMethod: { type: String, enum: ['cash', 'upi', 'wallet'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },

  rating: { type: Number, default: null },
  review: { type: String, default: '' },

  cancelReason: { type: String, default: '' },
  estimatedTime: { type: Number, default: 30 },

  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.trackingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.trackingId = `HD${timestamp}${random}`;
  }
  if (!this.otp) {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
