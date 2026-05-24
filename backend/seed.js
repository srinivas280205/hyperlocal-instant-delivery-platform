require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({ email: { $in: ['admin@quickdrop.com', 'rider@quickdrop.com', 'user@quickdrop.com'] } });

  await User.create([
    {
      name: 'Admin User',
      email: 'admin@quickdrop.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'admin',
    },
    {
      name: 'Ravi Kumar',
      email: 'rider@quickdrop.com',
      phone: '8888888888',
      password: 'rider123',
      role: 'rider',
      vehicleType: 'bike',
      vehicleNumber: 'TN01AB1234',
      isAvailable: true,
      rating: 4.5,
      ratingCount: 12,
      totalDeliveries: 45,
    },
    {
      name: 'Priya Sharma',
      email: 'user@quickdrop.com',
      phone: '7777777777',
      password: 'user123',
      role: 'customer',
    },
  ]);

  console.log('Demo accounts created:');
  console.log('  Admin: admin@quickdrop.com / admin123');
  console.log('  Rider: rider@quickdrop.com / rider123');
  console.log('  Customer: user@quickdrop.com / user123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
