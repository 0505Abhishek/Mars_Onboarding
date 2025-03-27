const express = require('express');
const approveLeadCtrl = require("../../controllers/approveLead/approvelead.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,getNotification,approveLeadCtrl.approveLeadView);
router.route('/:id').get(userAuth, getDetails,getNotification,approveLeadCtrl.approveLeadViewById);
router.route('/Rsem_approval').post(userAuth, getDetails,getNotification,approveLeadCtrl.Rsem_approval);
module.exports = router;


