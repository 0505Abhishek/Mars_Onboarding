const express = require('express');
const roleSelectorCtrl = require("../../controllers/roleSelector/roleSelector.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(roleSelectorCtrl.roleSelectorCtrlView).post(roleSelectorCtrl.setRoleSelectorCtrl);

module.exports = router;

