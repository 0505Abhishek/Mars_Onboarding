const express = require('express');
const leadStatusCtrl = require("../../controllers/leadStatus/leadStatus.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, leadStatusCtrl.leadStatusView);
router.route('/:id')
    .get(userAuth, getDetails, getNotification, leadStatusCtrl.leadDistributorView)
    .post(userAuth, getDetails, getNotification, leadStatusCtrl.InsertleadDistributor);
router.route('/correction/:id')
.get(userAuth, getDetails, getNotification, leadStatusCtrl.leadCorrectionView)
.post(userAuth, getDetails, getNotification, leadStatusCtrl.InsertleadCorrection);
module.exports = router;

