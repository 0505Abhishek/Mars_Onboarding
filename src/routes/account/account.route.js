const express = require('express');
const accountController = require("../../controllers/account/account.controller");
const { userAuth } = require("../../util/auth");

const router = express.Router();

router.route('/').get(accountController.loginView);
router.route('/signup').get(accountController.signupView).post(accountController.signup);
router.route('/user-login').get(accountController.userLogin);
router.route('/user-logout').get(userAuth, accountController.userLogout);
router.route('/forgot-password').get(accountController.forgotPasswordView).post(accountController.resetPassword);
router.route('/reset-password').get(accountController.updatePasswordView).post(accountController.updatePassword);

module.exports = router;

