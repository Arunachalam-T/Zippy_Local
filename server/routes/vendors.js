const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/vendorController');
const auth       = require('../middleware/authMiddleware');

router.get('/',           controller.searchVendors);
router.get('/top',        controller.topVendors);
router.get('/categories', controller.getCategories);
router.get('/services/:vendor_id', controller.getVendorServices);
router.get('/:vendor_id', controller.getVendorProfile);
router.put('/availability', auth, controller.toggleAvailability);
router.put('/profile',      auth, controller.updateProfile);
router.put('/address', auth, controller.updateVendorAddress);
router.get('/allservices/:category_id', auth, controller.getServicesByCategory);
router.post('/service',                 auth, controller.addVendorService);
router.delete('/service/:service_id',   auth, controller.removeVendorService);
module.exports = router;