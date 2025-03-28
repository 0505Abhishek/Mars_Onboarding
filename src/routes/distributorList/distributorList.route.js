const express = require('express');
const DistributorListCtrl = require("../../controllers/documentVerification/documentVerfication.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, DistributorListCtrl.DocumentVerificationView);
router.route('/:id').get(userAuth, getDetails, getNotification, DistributorListCtrl.DocumentVerificationApplication).post(userAuth, getDetails, getNotification, DistributorListCtrl.SubmitDocumentVerification);

module.exports = router;