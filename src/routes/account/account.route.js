const express = require('express');
const accountController = require("../../controllers/account/account.controller");
const { userAuth, emailAuth } = require("../../util/auth");

const router = express.Router();

router.route('/').get(accountController.loginView);
router.route('/token').get(accountController.tokenView);
router.route('/signup').get(accountController.signupView).post(accountController.signup);
router.route('/user-login').post(accountController.userLogin);
router.route('/user-logout').get(userAuth, accountController.userLogout);
router.route('/reset-password').get(accountController.resetPasswordView).post(accountController.resetPassword);
router.route('/change-password').get(emailAuth,accountController.changePasswordView).post(accountController.updatePassword);

module.exports = router;

