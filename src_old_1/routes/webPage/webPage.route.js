const express = require('express');
const offBoardWebPage = require("../../controllers/webPage/webPage.controller");

const { offboardEmailAuth } = require("../../util/auth");

const router = express.Router();

router.route('/:token').get(offboardEmailAuth, offBoardWebPage.webPageView).post(offboardEmailAuth, offBoardWebPage.webPageSubmit);;
router.route('/thankYou').get(offBoardWebPage.ThankYouPageView);

  
module.exports = router;
