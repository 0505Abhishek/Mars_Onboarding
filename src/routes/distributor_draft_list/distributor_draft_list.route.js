const express = require('express');
const draftDistributorCtrl = require("../../controllers/distributorDraftList/distributorDraftList.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, draftDistributorCtrl.distributorDraftList);

module.exports = router;