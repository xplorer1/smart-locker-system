let express = require("express");
let router = express.Router();
let dayjs = require("dayjs");
let logger = require("../utils/logger");

let auth_routes = require("./auth.route");
let admin_routes = require("./admin.route");

router.use(function (req, res, next) {
    logger.info(`${dayjs()}: ${req.originalUrl}`);
    next();
});

//status check
router.get("/status", function (req, res) {
    res.status(200).send({message: "OK" });
});

router.use("/auth", auth_routes);
router.use("/admin", admin_routes);

module.exports = router;