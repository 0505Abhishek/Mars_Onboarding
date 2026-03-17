const express = require('express');
const dashboardCtrl = require("../../controllers/super_dashboard/dashboard.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");

const router = express.Router();

// router.route('/').get(userAuth, getDetails, dashboardCtrl.dashboardView);
// router.route('/').get(dashboardCtrl.dashboardView);
router.route('/').get(userAuth, getDetails, dashboardCtrl.dashboardBackView);

module.exports = router;