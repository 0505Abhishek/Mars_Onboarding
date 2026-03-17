const express = require('express');
const offBoardWebPage = require("../../controllers/webPage/webPage.controller");

const { offboardEmailAuth } = require("../../util/auth");

const router = express.Router();

router.route('/').get(offBoardWebPage.ThankYouPageView);

  
module.exports = router;
