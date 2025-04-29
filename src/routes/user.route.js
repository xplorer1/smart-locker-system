let express = require('express');
let router = express.Router();

let user_controller = require('../controllers/user.controller');
let { validateJWT, verifyUserAccess } = require('../middlewares/authentication');
let user_validator = require("../validators/auth.joi");

router.get('/locker', validateJWT, verifyUserAccess, user_controller.getUserLockerInfo);
router.post('/locker/unlock', validateJWT, verifyUserAccess, user_controller.unlockLocker);

module.exports = router;