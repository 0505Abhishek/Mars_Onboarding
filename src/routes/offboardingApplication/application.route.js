const express = require('express');
const applicationList = require("../../controllers/offboardingApplication/application.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, applicationList.offboardList);
router.route('/:id').get(userAuth, getDetails, getNotification, applicationList.offboardApplicationViewById).post(userAuth, getDetails, getNotification, applicationList.offboardApplicationSubmit);

module.exports = router;