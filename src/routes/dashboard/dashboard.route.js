const express = require('express');
const dashboardCtrl = require("../../controllers/dashboard/dashboard.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

// router.route('/').get(userAuth, getDetails, dashboardCtrl.dashboardView);
// router.route('/').get(dashboardCtrl.dashboardView);
router.route('/').get(userAuth, getDetails, getNotification, dashboardCtrl.dashboardBackView);

module.exports = router;