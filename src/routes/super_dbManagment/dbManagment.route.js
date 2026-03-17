const express = require('express');
const router = express.Router();
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");

const dbManagmentController = require('../../controllers/super_dbmanagment/dbManagment.controller');

router.route('/').get(userAuth, getDetails, dbManagmentController.DbManagmentPage);
router.route('/edit/:id').get(userAuth, getDetails,dbManagmentController.EditDbManagmentPage);
router.route('/offboardingedit/:id').get(userAuth, getDetails,dbManagmentController.OffboardingEditDbManagmentPage);
router.route('/offboardingapproverupdate').post(getDetails,dbManagmentController.offboardingApproverupdate);
router.route('/get-approvers-by-territory/:territoryId').get(getDetails,dbManagmentController.getApproversByTerritory);
router.route('/by-parent/:parentId').get(getDetails,dbManagmentController.getUsersByParentId);
router.route('/approverupdate').post(getDetails,dbManagmentController.approverupdate);

router.route('/add-user').get(getDetails,dbManagmentController.addUserPage).post(getDetails,dbManagmentController.addUser);
router.route('/upload').post(dbManagmentController.upload);
router.route('/upload_document').post(dbManagmentController.uploadDocument);
router.route('/export-db').get(dbManagmentController.exportDatabase);
router.route('/update_territory').post(dbManagmentController.updateTerritory);
module.exports = router;




