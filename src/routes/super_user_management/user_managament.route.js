const express = require('express');

const userManagment = require('../../controllers/super_user_management/usermanagement.controller');
const { userAuth } = require("../../util/auth");

const router = express.Router();


router.route('/').get(userAuth,userManagment.userManagmentView);
router.route('/edit/:id').get(userAuth,userManagment.userManagmentedit);
router.route('/updateuser').post(userAuth,userManagment.updateuser);
router.route('/upload-user').post(userManagment.upload_new_user);
router.route('/update-user').post(userManagment.upload_update_user);


router.route('/user-transfer').get(userAuth, userManagment.getUserTransferView);
router.route('/user-transfer/transfer').post(userAuth, userManagment.processUserTransfer);

router.route('/mapping').get(userAuth, userManagment.getMappingView);
module.exports = router;