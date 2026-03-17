const express = require('express');
const ResignationList = require("../../controllers/OffboardResignation/Resignation.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require('../../util/notify');

const router = express.Router();

router.route('/').get(userAuth, getDetails, getNotification, ResignationList.offboardList);
router.route('/:id').get(userAuth, getDetails, getNotification, ResignationList.offboardResignationViewById).post(userAuth, getDetails, getNotification, ResignationList.SubmitResignation);

module.exports = router;