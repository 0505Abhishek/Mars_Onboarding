const express = require('express');
const roleManagementController = require("../../controllers/rolemanagement/rolemanagement.controller");
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
// const { getNotification } = require('../../util/notify');
const router = express.Router();

router.route('/').get(userAuth, getDetails,roleManagementController.roleManagmentView);
router.route('/createrole').get(userAuth,roleManagementController.createrole).post(roleManagementController.insertrole);
router.route('/editrole').get(userAuth,roleManagementController.vieweditrole).post(roleManagementController.editrole);
router.route('/delete').get(userAuth,roleManagementController.deleteview)
module.exports = router;

