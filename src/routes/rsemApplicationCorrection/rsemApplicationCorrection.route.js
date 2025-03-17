const express = require('express');
const rsemApplicationCorrectionCtrl = require("../../controllers/rsemApplicationCorrection/Correction.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,rsemApplicationCorrectionCtrl.CorrectionView);

module.exports = router;

