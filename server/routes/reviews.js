const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reviewController');
const auth       = require('../middleware/authMiddleware');

router.post('/', auth, controller.submitReview);

router.get('/user', auth, controller.getUserReviews);
router.get('/:vendor_id', controller.getVendorReviews);
module.exports = router;