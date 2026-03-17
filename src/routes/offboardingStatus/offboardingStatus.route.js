const express = require('express');
const offboardingStatus = require("../../controllers/offBoardingStatus/offboardingStatus.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, offboardingStatus.offboardList);

module.exports = router;