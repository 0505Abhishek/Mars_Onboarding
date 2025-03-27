const express = require('express');
const correctionCtrl = require("../../controllers/correction/correction.controller");

const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,correctionCtrl.distributorView);
router.route('/:id').get(userAuth, getDetails,getNotification,correctionCtrl.CorrectionView).post(userAuth, getDetails,getNotification,correctionCtrl.submitCorrection);

module.exports = router;


