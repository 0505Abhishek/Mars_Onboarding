const express = require('express');
const reportCtrl = require("../../controllers/report/report.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,reportCtrl.reportView);

module.exports = router;


