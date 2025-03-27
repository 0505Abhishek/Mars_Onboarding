const express = require('express');
const correctionPageCtrl = require("../../controllers/correctionPage/correctionPage.controller");

const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/basicPage').get(userAuth, getDetails,getNotification,correctionPageCtrl.basicPageView).post(userAuth, getDetails,getNotification, correctionPageCtrl.updateBasicPage);
router.route('/documentPage').get(userAuth, getDetails,getNotification,correctionPageCtrl.documentPageView).post(userAuth, getDetails,getNotification, correctionPageCtrl.updateDocumentPage);;

module.exports = router;


