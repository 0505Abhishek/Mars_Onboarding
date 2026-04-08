const express = require("express");
const approverList = require("../../controllers/offboardApprover/newapprover.controller");
// const { userAuth } = require("../../util/auth");
const { getDetails } = require("../../util/jwt");
const { getNotification } = require("../../util/notify");

const router = express.Router();

router.route("/").get(getDetails, getNotification, approverList.offboardList);
router
  .route("/newoffboardApproverview/:id?")
  .get(approverList.offboardListEdit);
router.post("/submitDbReplacement", approverList.submitDbReplacement);

router
  .route("/webpageView/:token")
  .get(approverList.offboardWebPage);

router
  .route("/webpageclearclearance/:token")
  .get(approverList.offboardWebPageclearclearance);
  
router.post("/saveAssetReconciliation", approverList.saveAssetReconciliation);
router .route("/webpagereversal/:token")
  .get(approverList.offboardWebpagereversal);
  

router
  .route("/webpagefnf/:token")
  .get(approverList.offboardWebpagefnf);

router.get("/download-fnf/:filename", approverList.downloadFnfFile);
router.post("/submitFnfForm", approverList.submitFnfForm);

router
  .route("/interviewCapture")
  .get(getDetails, getNotification, approverList.offboardInterviewcapture);

router.post(
  "/initiateOffboardAsmaction",
  getDetails,
  getNotification,
  approverList.initiateOffboardAsmaction,
);
router.post(
  "/assettransfersubmit",
  getDetails,
  getNotification,
  approverList.assettransfersubmit,
);
router.post(
  "/claimSubmit",
  getDetails,
  getNotification,
  approverList.claimSubmit,
);
router.post("/gstsubmit", getDetails, getNotification, approverList.gstsubmit);
router.post("/FnfSubmit", getDetails, getNotification, approverList.FnfSubmit);
router.post("/FnfsnfSubmit", getDetails, getNotification, approverList.FnfsnfSubmit);
router.post(
  "/zeroLedgerSubmit",
  getDetails,
  getNotification,
  approverList.zeroLedgerSubmit,
);
router.post(
  "/blockDbSubmit",
  getDetails,
  getNotification,
  approverList.blockDbSubmit,
);
router.post(
  "/fnfApproveBtn",
  getDetails,
  getNotification,
  approverList.fnfApproveBtn,
);
router.post(
  "/paymentSubmitBtn",
  getDetails,
  getNotification,
  approverList.paymentSubmitBtn,
);
router.post(
  "/saveResignation",
  approverList.saveResignation,
);

router
  .route("/webpageclearclearance")
  .get(getDetails, getNotification, approverList.offboardWebPageclearclearance);

router
  .route("/dbOffboardAction/:token")
  .get(approverList.offboarddboffboardaction);

router.post("/submitNocUpload", getNotification, approverList.submitNocUpload);

router.post(
  "/offboardrsemoffboardaction",
  getDetails,
  getNotification,
  approverList.offboardrsemoffboardaction,
);
router.post(
  "/submitGstReversal",
  approverList.submitGstReversal,
);
router.post("/submitDbResponse", approverList.submitDbResponse);
router.post("/submitDbResponseASM", approverList.submitDbResponseASM);
router.post("/rsmInitialAction", approverList.rsmInitialAction);
router.post("/snfPaymentSubmitBtn", approverList.snfPaymentSubmitBtn);

router
  .route("/:id")
  .get(getDetails, getNotification, approverList.offboardApplicationViewById)
  .post(getDetails, getNotification, approverList.SubmitApprover);

module.exports = router;
