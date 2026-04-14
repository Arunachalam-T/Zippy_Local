const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/bookingController');
const auth       = require('../middleware/authMiddleware');

router.post('/',              auth, controller.createBooking);
router.get('/history',        auth, controller.bookingHistory);
router.get('/vendor',         auth, controller.vendorBookings);
router.put('/status',         auth, controller.updateStatus);
router.put('/cancel',         auth, controller.cancelBooking);
router.put('/payment',        auth, controller.updatePayment);
router.post('/address',       auth, controller.saveAddress);
router.get('/address',        auth, controller.getAddress);

module.exports = router;