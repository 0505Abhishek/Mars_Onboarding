const express = require('express');
const currentStatusCtrl = require("../../controllers/current_status/current_status.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, currentStatusCtrl.currentStatusCtrlView);
router.route('/hierarchyRole/distributors').get(userAuth, getDetails,getNotification,currentStatusCtrl.getByHierarchyRole);
router.route('/:id').get(userAuth, getDetails,getNotification,currentStatusCtrl.currentStatusCtrlById);

module.exports = router;