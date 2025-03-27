const express = require('express');
const rsemApplicationCorrectionCtrl = require("../../controllers/rsemApplicationCorrection/Correction.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,rsemApplicationCorrectionCtrl.CorrectionView).post(rsemApplicationCorrectionCtrl.updateDistributor);;
router.route('/:id').get(userAuth, getDetails,getNotification,rsemApplicationCorrectionCtrl.CorrectionDistributorView);
router.route('/saveDraft').post(userAuth, getDetails,getNotification,rsemApplicationCorrectionCtrl.CorrectionDistributorUpdate);

module.exports = router;

