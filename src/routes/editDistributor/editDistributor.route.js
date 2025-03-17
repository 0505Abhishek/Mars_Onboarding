const express = require('express');
const editDistributorCtrl = require("../../controllers/editDistributor/editDistributor.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, editDistributorCtrl.editDistributorView).post(editDistributorCtrl.updateDistributor);
router.route('/delete_distributor').get(userAuth, getDetails, getNotification, editDistributorCtrl.deleteDistributor);
router.route('/save_draft').post(userAuth, getDetails, getNotification, editDistributorCtrl.saveDraft);




module.exports = router;