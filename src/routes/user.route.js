let express = require('express');
let router = express.Router();

let user_controller = require('../controllers/user.controller');
let { validateJWT, verifyUserAccess } = require('../middlewares/authentication');
let user_validator = require("../validators/user.joi");

router.get('/locker', validateJWT, verifyUserAccess, user_controller.getUserLockerInfo);
router.get('/locker/unlock', validateJWT, verifyUserAccess, user_controller.unlockLockerWeb);
router.post('/locker/unlock', user_validator.unlockLocker, user_controller.unlockLockerID);

module.exports = router;