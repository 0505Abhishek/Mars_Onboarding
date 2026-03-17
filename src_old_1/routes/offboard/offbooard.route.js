const express = require('express');
const offBoardCtrl = require("../../controllers/offboard/offboard.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, offBoardCtrl.offboardList);
router.route('/submit-offboarding').post(userAuth, getDetails, getNotification, offBoardCtrl.offboardDistributor);

module.exports = router;