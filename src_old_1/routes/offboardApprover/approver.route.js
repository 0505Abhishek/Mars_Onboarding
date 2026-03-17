const express = require('express');
const approverList = require("../../controllers/offboardApprover/approver.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, approverList.offboardList);
router.route('/:id').get(userAuth, getDetails, getNotification, approverList.offboardApplicationViewById).post(userAuth, getDetails, getNotification, approverList.SubmitApprover);

module.exports = router;