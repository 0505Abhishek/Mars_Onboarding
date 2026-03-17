const express = require('express');
const router = express.Router();
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");

const superDbReportController = require('../../controllers/super_db_report/super_db_report.controller');

router.route('/').get(userAuth, getDetails, superDbReportController.superDbReportPage);

module.exports = router;




