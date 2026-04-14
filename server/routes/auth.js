const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/authController');

router.post('/register/user',   controller.registerUser);
router.post('/register/vendor', controller.registerVendor);
router.post('/login/user',      controller.loginUser);
router.post('/login/vendor',    controller.loginVendor);
router.post('/login/admin',     controller.loginAdmin);

module.exports = router;