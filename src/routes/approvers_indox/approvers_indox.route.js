const express = require('express');
const approveIndoxCtrl = require("../../controllers/approver_indox/approver_indox.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,approveIndoxCtrl.approveIndoxView);
router.route('/:id').get(userAuth, getDetails,getNotification,approveIndoxCtrl.approveViewById);

module.exports = router;


