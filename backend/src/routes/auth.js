const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  register, login, getMe, updateProfile,
  updateRiderLocation, toggleAvailability,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, authorize('rider'), updateRiderLocation);
router.put('/availability', protect, authorize('rider'), toggleAvailability);

module.exports = router;
