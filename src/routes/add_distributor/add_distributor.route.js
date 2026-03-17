const express = require("express");
const addDistributorCtrl = require("../../controllers/addDistributor/addDistributor.controller");
const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require("../../util/notify");

const router = express.Router();

router
  .route("/")
  .get(
    userAuth,
    getDetails,
    getNotification,
    addDistributorCtrl.addDistributorView
  )
  .post(addDistributorCtrl.createDistributor);
router
  .route("/save_draft")
  .post(userAuth, getDetails, getNotification, addDistributorCtrl.saveDraft);
router
  .route("/get-territory")
  .post(userAuth, getDetails, getNotification, addDistributorCtrl.territory);
router
  .route("/get-so-territory")
  .post(userAuth, getDetails, getNotification, addDistributorCtrl.soTerritory);

module.exports = router;
