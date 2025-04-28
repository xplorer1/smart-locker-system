let express = require('express');
let router = express.Router();

let auth_controller = require('../controllers/auth.controller');
let auth_validator = require("../validators/auth.joi");

router.post('/sign_in', auth_validator.signIn, auth_controller.signIn);
router.post('/verify', auth_validator.verifyLockerAccess, auth_controller.verifyLockerAccess);
router.post('/door-events', auth_validator.logDoorEvents, auth_controller.logDoorEvents);

module.exports = router;