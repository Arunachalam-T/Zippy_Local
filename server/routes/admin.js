const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/adminController');
const auth       = require('../middleware/authMiddleware');

router.get('/stats',           auth, controller.getDashboardStats);
router.get('/bookings',        auth, controller.getAllBookings);
router.get('/users',           auth, controller.getAllUsers);
router.get('/vendors',         auth, controller.getAllVendors);
router.get('/revenue/:year',   auth, controller.revenueReport);
router.put('/booking/status',  auth, controller.updateBookingStatus);
router.delete('/user/:id',     auth, controller.deleteUser);
router.delete('/vendor/:id',   auth, controller.deleteVendor);

module.exports = router;