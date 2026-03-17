const express = require('express');
const approveIndoxCtrl = require("../../controllers/approver_indox/approver_indox.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,approveIndoxCtrl.approveIndoxView);
router.route('/territories').get(approveIndoxCtrl.TerritoryByRegion);

router.route('/:id').get(userAuth, getDetails,getNotification,approveIndoxCtrl.approveViewById).post(approveIndoxCtrl.submitApproveById);
router.route('/hierarchyRole/distributors').get(userAuth, getDetails,getNotification,approveIndoxCtrl.getByHierarchyRole);

module.exports = router;


