let express = require('express');
let router = express.Router();

let admin_controller = require('../controllers/admin.controller');
let admin_validator = require("../validators/admin.joi");

let authentication = require('../middlewares/authentication');

router.post('/admin/users', admin_validator.addAdmin, admin_controller.createAdmin);
router.get('/admin/users', authentication.validateJWT, admin_controller.getAllAdmins);
router.patch('/admin/change-password', authentication.validateJWT, admin_controller.changePassword);

router.get('/students', authentication.validateJWT, admin_controller.getStudents);
router.post('/students', admin_validator.addStudent, authentication.validateJWT, admin_controller.addStudent);

router.get('/lockers', authentication.validateJWT, admin_controller.getActiveLockers);
router.post('/lockers', authentication.validateJWT, admin_controller.addLocker);

router.post('/assignments', admin_validator.assignLocker, authentication.validateJWT, admin_controller.assignLocker);
router.patch('/assignments/:id/release', authentication.validateJWT, admin_controller.deAssignLocker);

router.get('/logs', authentication.validateJWT, admin_controller.getAccessLogs);

module.exports = router;