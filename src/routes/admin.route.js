let express = require('express');
let router = express.Router();

let admin_controller = require('../controllers/admin.controller');
let admin_validator = require("../validators/admin.joi");

let authentication = require('../middlewares/authentication');

router.post('/', admin_validator.addAdmin, admin_controller.createAdmin);
router.get('/', authentication.validateJWT, admin_controller.getAllAdmins);
router.patch('/change-password', authentication.validateJWT, admin_controller.changePassword);

router.get('/users', authentication.validateJWT, admin_controller.getUsers);
router.post('/users', admin_validator.addUser, authentication.validateJWT, admin_controller.addUser);

router.get('/lockers', authentication.validateJWT, admin_controller.getActiveLockers);
router.post('/lockers', authentication.validateJWT, admin_controller.addLocker);

router.post('/assignments', admin_validator.assignLocker, authentication.validateJWT, admin_controller.assignLocker);
router.patch('/assignments/:id/release', authentication.validateJWT, admin_controller.deAssignLocker);

router.get('/logs', authentication.validateJWT, admin_controller.getAccessLogs);

module.exports = router;