const dashboard = require("../../models/dashboard.model");
const approverModel = require("../../models/offboardApprover/newapprover.model");
const ResignationModel = require("../../models/OffboardResignation/Resignation.model");
const mailer = require("../../util/offboarding_mail");
const { sendDbActionEmail } = require("../../util/mailUtil");
require("dotenv").config();
const link = process.env.HOST;
const fs = require("fs");
const path = require("path");
const { log } = require("console");

const offboardList = async (req, res) => {
  try {
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id,
    );

    allDistributor = allDistributor.map((distributor) => {
      let finalReason = [];

      if (distributor.offboarding_reason) {
        if (typeof distributor.offboarding_reason === "string") {
          finalReason = distributor.offboarding_reason
            .split(",")
            .map((r) => r.trim());
        }
      }

      if (!finalReason.length) {
        const resignationFields = [
          distributor.low_turnover,
          distributor.low_roi,
          distributor.limitation_in_investment,
          distributor.db_going_out_of_business,
          distributor.increasing_cost,
          distributor.not_ready_for_additional_infrastructure,
        ];

        resignationFields.forEach((reason) => {
          if (reason && typeof reason === "string" && reason.trim() !== "") {
            finalReason.push(reason.trim());
          }
        });

        if (
          distributor.gsv_average &&
          typeof distributor.gsv_average === "string"
        ) {
          finalReason.unshift(`GSV Average: ${distributor.gsv_average}`);
        }
      }

      return {
        ...distributor,
        final_reason_text: finalReason,
      };
    });

    let get_action_button = [];
    if (allDistributor && allDistributor.length > 0) {
      for (let distributor of allDistributor) {
        let buttons = await approverModel.getActionButtons(
          distributor.applicationId,
          req.cookies.user_id,
          req.cookies.role_name,
          distributor.total_complete_approval_level,
        );
        get_action_button.push({
          applicationId: distributor.applicationId,
          get_approvel_button: buttons,
        });
      }
    }
    // console.log("get_action_button:", get_action_button[1]);
    let navbarviews = await dashboard.navbarviewesult(data);
    let terminationReasons = await approverModel.getTerminationReasons();

    let notification = req.session.notification || null;

    delete req.session.notification;

    res.render("offboardApprover/newoffboardApprover", {
      token: navbarviews,
      notification:notification||[],
      data: allDistributor,
      terminationReasons: terminationReasons || [],
      get_action_button: get_action_button || [],
      role_name: req.cookies.role_name,
    });
  } catch (error) {
    req.session.notification = {
      type: "Error",
      message: "Sorry There is Some Problem !",
    };
    console.log(error);
    return res.redirect("/dashboard");
  }
};

const offboarddboffboardaction = async (req, res) => {
  try {
    const token = req.params.token;

    const renderData = {
      notification: null,
      firmName: "N/A",
      distributorName: "N/A",
      application_id: null,
      offboard_type: "termination",
      termination_reasons: [],
    };

    if (!token) {
      renderData.notification = { type: "Error", message: "Invalid link." };
      return res.render("offboardApprover/dbOffboardAction", renderData);
    }

    const details = await approverModel.getDistributorByToken(token);

    if (!details || details.offboard_type !== "termination") {
      renderData.notification = {
        type: "Error",
        message:
          "This link is not valid for termination acknowledgment. If this is for resignation, use the correct link.",
      };
      return res.render("offboardApprover/dbOffboardAction", renderData);
    }

    renderData.firmName = details.firmName || "N/A";
    renderData.distributorName = details.distributorName || "N/A";
    renderData.application_id = details.application_id;
    renderData.termination_reasons = details.termination_reasons || [];

    return res.render("offboardApprover/dbOffboardAction", renderData);
  } catch (error) {
    console.error("Error:", error);
    return res.render("offboardApprover/dbOffboardAction", {
      notification: { type: "Error", message: "Something went wrong." },
      firmName: "N/A",
      distributorName: "N/A",
      application_id: null,
      offboard_type: "termination",
      termination_reasons: [],
    });
  }
};

const offboardListEdit = async (req, res) => {
  try {
    const applicationId = req.params.id;

    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);

    let distributor = [];

    if (applicationId) {
      distributor = await approverModel.getDistributorListdata(applicationId);
    }

    res.render("offboardApprover/newoffboardApproverview", {
      token: navbarviews,
      data: distributor,
    });
  } catch (err) {
    console.log(err);
    return res.redirect("/dashboard");
  }
};

const submitDbReplacement = async (req, res) => {
  try {
    const {
      application_id,
      is_replacement,
      replacement_db_name,
      replacement_db_code,
    } = req.body;

    if (!application_id || is_replacement === undefined) {
      return res.status(400).json({
        success: false,
        message: "application_id & is_replacement are required",
      });
    }

    if (is_replacement === 1) {
      await approverModel.updateReplacementStatusToNo(application_id);
    }

    const result = await approverModel.replacementModel({
      application_id,
      is_replacement,
      replacement_db_name,
      replacement_db_code,
      action_date: new Date(),
    });

    await approverModel.updatedate_dbreplace_flag(application_id);

    res.json({
      success: true,
      message: "DB Replacement submitted successfully",
    });
  } catch (err) {
    console.error("DB Replacement Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const saveAssetReconciliation = async (req, res) => {
  try {
    const {
      application_id,
      asset_reconciliation,
      asset_transfer_done,
      asset_remarks,
    } = req.body;

    if (!application_id) {
      return res.json({
        success: false,
        message: "application_id is required",
      });
    }

    const result = await approverModel.saveAssetReconciliationModel({
      application_id,
      asset_reconciliation,
      asset_transfer_done,
      asset_remarks,
      action_date: new Date(),
    });

    if (result.alreadyUpdated) {
      return res.json({
        success: false,
        message: "Asset reconciliation already updated",
      });
    }

    await approverModel.updatedate_assest_flag(application_id);

    res.json({
      success: true,
      message: result.inserted
        ? "Asset reconciliation saved"
        : "Asset reconciliation updated",
    });
  } catch (err) {
    console.error("Asset Save Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const offboardWebPage = async (req, res) => {
  try {
    const token = req.params.token;

    let notification = req.session.notification || null;
    delete req.session.notification;

    if (!token) {
      return res.render("offboardApprover/webpageView", {
        applicationId: null,
        token: null,
        notification: notification || {
          type: "error",
          message: "Invalid or missing link.",
        },
      });
    }

    const distributorDetails = await approverModel.getDistributorByToken(token);

    if (
      !distributorDetails ||
      distributorDetails.offboard_type !== "resignation"
    ) {
      const errorMsg =
        "This link is invalid, expired, or not meant for resignation submission.";
      notification = notification || { type: "error", message: errorMsg };

      return res.render("offboardApprover/webpageView", {
        applicationId: null,
        token: null,
        notification,
      });
    }

    const alreadySubmitted =
      await approverModel.checkResignationSubmitted(
        distributorDetails.application_id
      );

    if (alreadySubmitted) {
      return res.render("offboardApprover/webpageView", {
        applicationId: distributorDetails.application_id,
        token: token,
        distributor: distributorDetails,
        notification: {
          type: "success",
          message: "Resignation already submitted for this distributor.",
        },
      });
    }

    res.render("offboardApprover/webpageView", {
      applicationId: distributorDetails.application_id,
      token: token,
      distributor: distributorDetails,
      notification,
    });
  } catch (error) {
    console.error("Error in offboardWebPage (resignation token):", error);

    let notification = req.session.notification || null;
    delete req.session.notification;

    notification = notification || {
      type: "error",
      message: "Sorry, something went wrong. Please contact your ASM.",
    };

    res.render("offboardApprover/webpageView", {
      applicationId: null,
      token: null,
      notification,
    });
  }
};

const submitDbResponseASM= async (req, res) => {
  try {
    const { approval, amount, reason, application_id } = req.body;

    if (!approval) {
      return res.json({
        type: "error",
        message: "Please select approval status.",
      });
    }

    await approverModel.insertDbResponse({
      application_id,
      counter_amount: amount,
      counter_reason: reason,
      status: "FORWARDED",
    });
    let get_application_status =
      await approverModel.get_application_status(application_id);
    if (
      get_application_status &&
      (get_application_status.status == "APPROVED" ||
        get_application_status.status == "REJECTED")
    ) {
      return res.json({
        type: "error",
        message: "This application has already been processed.",
      });
    }
    if (approval === "approve") {
      await approverModel.updateDbTrackingStatus(application_id, "APPROVED");
      const currentRowss = await approverModel.checkOffboardingapprovedPDF(
        application_id,
        "0",
        "0",
        "4",
      );
      const row = currentRowss[0];
      let sequence = row.sequence;
      let last_approval_action_user_id = row.last_approval_action_user_id;
      let status = "APPROVED";
      let flag = "";
      let is_final_approval = "1";
      let data = {};
      await approverModel.updateWorkflowRow(row.id, {
        status: status,
        remark: reason,
        acted_by: "0",
        acted_at: new Date(),
        is_final_approval: is_final_approval,
        fnf_flag: "1",
        total_level: "4",
      });
      // await approverModel.updateOffboardapprovedfnf_flag(application_id, "1");

      await approverModel.insertWorkflowHistory({
        application_id,
        approver_id: "0",
        approver_role: "0",
        action: status,
        remarks: reason,
      });

      const nextSequence = sequence + 1;
      const nextRow = await approverModel.getNextSequenceRow(
        application_id,
        nextSequence,
      );
      if (nextRow) {
        await approverModel.updateWorkflowRow(nextRow.id, {
          status: "PENDING",
          is_final_approval: "0",
        });
      }
      await approverModel.nextapproval_action_user_id(
        nextRow,
        "0",
        application_id,
        "",
        "0",
      );
      await send_email_sac(nextRow.id);
      
      await approverModel.updateDbResponseStatus(application_id, "APPROVED");

      return res.json({
        type: "success",
        message: "Claim Approved Successfully!",
      });
    } else if (approval === "decline") {

  await approverModel.updateDbTrackingStatus(application_id, "DECLINED");
  const currentRowss = await approverModel.checkOffboardingapprovedPDF(
    application_id,
    "0",
    "0",
    "4",
  );

  const row = currentRowss[0];
  let sequence = row.sequence;

  let status = "REJECTED";

  await approverModel.updateWorkflowRow(row.id, {
    status: status,
    remark: reason,
    is_final_approval: "1",
    fnf_flag: "1",
    total_level: "4",
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: "0",
    approver_role: "0",
    action: status,
    remarks: reason,
  });

  if (sequence > 1) {
    const prevSequence = sequence - 1;

    const prevRow = await approverModel.getNextSequenceRow(
      application_id,
      prevSequence
    );

    if (prevRow) {
      await approverModel.updateWorkflowRow(prevRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });

      await approverModel.nextapproval_action_user_idN(
        prevRow,
        "0",
        application_id,
        "",
        2
      );

        await send_email_sac_returned(prevRow.approver_id);
      }
    }

   await approverModel.updateDbResponseStatus(application_id, "REJECTED");

      return res.json({
        type: "success",
        message: "Claim Rejected !",
      });
    }
    if (!amount || !reason) {
      return res.json({
        type: "error",
        message: "Please enter both amount and reason.",
      });
    }

    return res.json({
      type: "success",
      message: "Declined. Forwarded to ASM/DT Team.",
      data: {
        amount: amount + " " + unit,
        reason: reason,
      },
    });
  } catch (error) {
    console.error("DB Response Error:", error);
    return res.json({
      type: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

const submitDbResponse = async (req, res) => {
  try {
    const { approval, amount, reason, application_id } = req.body;

      if (!approval) {
        return res.json({
          type: "error",
          message: "Please select approval status.",
        });
      }
          
       

   const isTermination =
  await approverModel.shouldInitializeDbTracking(application_id);

if (isTermination) {
  const dbTracking = await approverModel.getDbTracking(application_id);

  if (!dbTracking) {
    return res.json({
      type: "error",
      message: "Invalid request.",
    });
  }

  if (dbTracking.db_response_status !== "PENDING") {
    return res.json({
      type: "error",
      message: "This claim has already been processed.",
    });
  }

  if (new Date() > new Date(dbTracking.db_deadline)) {
    return res.json({
      type: "error",
      message: "Response time expired. This claim is now handled by ASM.",
    });
  }
}



    await approverModel.insertDbResponse({
      application_id,
      counter_amount: amount,
      counter_reason: reason,
      status: "FORWARDED",
    });
    let get_application_status =
      await approverModel.get_application_status(application_id);
    if (
      get_application_status &&
      (get_application_status.status == "APPROVED" ||
        get_application_status.status == "REJECTED")
    ) {
      return res.json({
        type: "error",
        message: "This application has already been processed.",
      });
    }
    if (approval === "approve") {
      await approverModel.updateDbTrackingStatus(application_id, "APPROVED");
      const currentRowss = await approverModel.checkOffboardingapprovedPDF(
        application_id,
        "0",
        "0",
        "4",
      );
      const row = currentRowss[0];
      let sequence = row.sequence;
      let last_approval_action_user_id = row.last_approval_action_user_id;
      let status = "APPROVED";
      let flag = "";
      let is_final_approval = "1";
      let data = {};
      await approverModel.updateWorkflowRow(row.id, {
        status: status,
        remark: reason,
        acted_by: "0",
        acted_at: new Date(),
        is_final_approval: is_final_approval,
        fnf_flag: "1",
        total_level: "4",
      });
      // await approverModel.updateOffboardapprovedfnf_flag(application_id, "1");

      await approverModel.insertWorkflowHistory({
        application_id,
        approver_id: "0",
        approver_role: "Distributor",
        action: status,
        remarks: reason,
      });

      const nextSequence = sequence + 1;
      const nextRow = await approverModel.getNextSequenceRow(
        application_id,
        nextSequence,
      );
      if (nextRow) {
        await approverModel.updateWorkflowRow(nextRow.id, {
          status: "PENDING",
          is_final_approval: "0",
        });
      }
      await approverModel.nextapproval_action_user_id(
        nextRow,
        "0",
        application_id,
        "",
        "0",
      );
        const distributor = await approverModel.getDistributorDetailsrole(application_id);
        await send_email_sac(nextRow.approver_id, application_id, nextRow.approver_id);
        await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);
      await approverModel.updateDbResponseStatus(application_id, "APPROVED");

      return res.json({
        type: "success",
        message: "Claim Approved Successfully!",
      });
    } else if (approval === "decline") {

      await approverModel.updateDbTrackingStatus(application_id, "DECLINED");
  const currentRowss = await approverModel.checkOffboardingapprovedPDF(
    application_id,
    "0",
    "0",
    "4",
  );

  const row = currentRowss[0];
  let sequence = row.sequence;

  let status = "REJECTED";

  await approverModel.updateWorkflowRow(row.id, {
    status: status,
    remark: reason,
    is_final_approval: "1",
    fnf_flag: "1",
    total_level: "4",
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: "0",
    approver_role: "Distributor",
    action: status,
    remarks: reason,
  });

  if (sequence > 1) {
    const prevSequence = sequence - 1;

    const prevRow = await approverModel.getNextSequenceRow(
      application_id,
      prevSequence
    );

    if (prevRow) {
      await approverModel.updateWorkflowRow(prevRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });

      await approverModel.nextapproval_action_user_idN(
        prevRow,
        "0",
        application_id,
        "",
        2
      );

        await send_email_sac_returned(prevRow.approver_id);
      }
    }

   await approverModel.updateDbResponseStatus(application_id, "REJECTED");

      return res.json({
        type: "success",
        message: "Claim Rejected !",
      });
    }
    if (!amount || !reason) {
      return res.json({
        type: "error",
        message: "Please enter both amount and reason.",
      });
    }

    return res.json({
      type: "success",
      message: "Declined. Forwarded to ASM/DT Team.",
      data: {
        amount: amount + " " + unit,
        reason: reason,
      },
    });
  } catch (error) {
    console.error("DB Response Error:", error);
    return res.json({
      type: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

const updateapprovel_level_decline = async (
  application_id,
  approver_id,
  role_id,
  approver_role,
  action,
  remarks,
  fnf_flag,
  total_level,
) => {
  const currentRow = await approverModel.getRsemPendingRow(
    application_id,
    approver_id,
  );
  let sequence = currentRow.total_complete_approval_level;
  let last_approval_action_user_id = currentRow.last_approval_action_user_id;
  // console.log(currentRow,"sequence");
  // return
  if (!currentRow) {
    return res.status(403).json({
      success: false,
      message: "This action is not pending for you",
    });
  }

  let status = "PENDING";
  let flag = "";
  let is_final_approval = 0;
  let data = {};

  if (action === "Approve") {
    status = "PENDING";
    is_final_approval = 0;
    flag = 0;
  }
  await approverModel.updateWorkflowRow(last_approval_action_user_id, {
    status: status,
    remark: remarks,
    acted_by: role_id,
    acted_at: new Date(),
    is_final_approval: is_final_approval,
    fnf_flag: fnf_flag,
    total_level: total_level,
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: approver_id,
    approver_role: approver_role,
    action: status,
    remarks: remarks,
  });

  const nextSequence = sequence - 1;
  const nextRow = await approverModel.getNextSequenceRow(
    application_id,
    nextSequence,
  );
  if (nextRow) {
    await approverModel.updateWorkflowRow(nextRow.id, {
      status: "PENDING",
      is_final_approval: "0",
    });
  }
  await approverModel.nextapproval_action_user_id(
    nextRow,
    approver_id,
    application_id,
    fnf_flag,
    flag,
  );
  // console.log(nextRow.approver_id, "nextRow.id");

  const userData = await ResignationModel.getUserById(nextRow.approver_id);
  let obj = {};
  obj.sendToEmail = userData?.email_id;
  obj.firmName = "";
  obj.userName = "";
  obj.sendToName = userData?.employee_name;

  let sac = mailer.sentEmailForOffboarding(obj, "DECLINE");
};

const offboardWebPageclearclearance = async (req, res) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.render("offboardApprover/webpageView", {
        applicationId: null,
        token: null,
        notification: notification || {
          type: "error",
          message: "Invalid or missing link.",
        },
      });
    }
    const distributorDetails = await approverModel.getDistributorByToken(token);

    let get_application_id = await approverModel.get_dis_credit_data(
      distributorDetails.application_id,
    );
    let get_application_status = await approverModel.get_application_status(
      distributorDetails.application_id,
    );
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id,
    );

    res.render("offboardApprover/webpageclearclearance", {
      data: allDistributor,
      get_data: get_application_id,
      get_application_status: get_application_status,
    });
  } catch (error) {
    req.session.notification = {
      type: "Error",
      message: "Sorry There is Some Problem !",
    };
    console.log(error);
    // return res.redirect("/dashboard");
  }
};

const offboardWebpagereversal = async (req, res) => {
  try {
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id,
    );


    const token = req.params.token;
    let distributorDetails = null;
    let get_file = null;

    if (token) {
      distributorDetails = await approverModel.getDistributorByToken(token);
      if (distributorDetails?.application_id) {
        get_file = await approverModel.get_file(
          distributorDetails.application_id,
        );
      }
    }

    let gstReversalStatus = null;

    if (distributorDetails?.application_id) {
      gstReversalStatus = await approverModel.getGstReversalStatus(
        distributorDetails.application_id,
      );
    }

    res.render("offboardApprover/webpagereversal", {
      data: allDistributor,
      distributorDetails,
      get_file,
      applicationId: distributorDetails?.application_id || null,
      gstReversalStatus,
    });
  } catch (error) {
    req.session.notification = {
      type: "Error",
      message: "Sorry, there is some problem!",
    };
    console.log(error);
    return res.redirect("/dashboard");
  }
};

const offboardWebpagefnf = async (req, res) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.render("offboardApprover/webpageView", {
        applicationId: null,
        token: null,
        notification: notification || {
          type: "error",
          message: "Invalid or missing link.",
        },
      });
    }
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id,
    );


    const distributorDetails = await approverModel.getDistributorByToken(token);

    let get_file = await approverModel.get_file(
      distributorDetails.application_id,
    );

    let get_fnf_file = await approverModel.get_fnf_submission(
      distributorDetails.application_id,
    );

    res.render("offboardApprover/webpagefnf", {
      data: allDistributor,
      get_file: get_file,
      get_fnf_file: get_fnf_file,
    });
  } catch (error) {
    req.session.notification = {
      type: "Error",
      message: "Sorry There is Some Problem !",
    };
    console.log(error);
    return res.redirect("/dashboard");
  }
};

const offboardInterviewcapture = async (req, res) => {
  try {
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id,
    );
    let navbarviews = await dashboard.navbarviewesult(data);

    let notification = req.session.notification;

    delete req.session.notification;

    res.render("offboardApprover/interviewCapture", {
      token: navbarviews,
      notification,
      data: allDistributor,
    });
  } catch (error) {
    req.session.notification = {
      type: "Error",
      message: "Sorry There is Some Problem !",
    };
    console.log(error);
    return res.redirect("/dashboard");
  }
};

const offboardApplicationViewById = async (req, res) => {
  try {
    const encodedId = req.params.id;
    const application_id = Buffer.from(encodedId, "base64").toString("utf8");
    if (!application_id) {
      req.session.notification = {
        type: "error",
        message: "You can not take Action for this application!",
      };
      return res.redirect("/newoffboardApprover");
    }

    const user_id = req.cookies.user_id;

    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);

    let DistributorData =
      await approverModel.getDistributorData(application_id);

    return res.render("offboardApprover/distributorView", {
      token: navbarviews,
      token: navbarviews,
      DistributorData: DistributorData[0],
    });
  } catch (error) {
    console.log(error, "........error........");
    return res.redirect("/dashboard");
  }
};

const SubmitApprover = async (req, res) => {
  try {
    const actionData = req.body;
    const user_id = req.cookies.user_id;
    const userName = req.cookies.UserName;

    const Distributor = await ResignationModel.getDistributorByID(
      actionData.applicationId,
      req.cookies.role_id,
      req.cookies.region_id,
    );

    if (
      Distributor[0].is_final_approval === 1 ||
      Distributor[0].offboard_flag === 2
    ) {
      return res.status(400).json({
        type: "error",
        message: "You have already take action!",
      });
    }

    if (actionData.action === "Approve") {
      await ResignationModel.updateoffboardHierarchy(
        user_id,
        actionData.applicationId,
        1,
        actionData.remarkMsg,
        req.cookies.role_id,
      );
      await ResignationModel.updateoOffboardingDistributorApproved(
        actionData.applicationId,
      );
      const offboardHierarchyData = await ResignationModel.getoffboardHierarchy(
        user_id,
        actionData.applicationId,
        req.cookies.role_id,
      );
      const NextApprover = await ResignationModel.getNextApprover(
        actionData.applicationId,
        offboardHierarchyData.sequence + 1,
      );

      if (NextApprover[0]?.approver_id) {
        const userData = await ResignationModel.getUserById(
          NextApprover[0].approver_id,
        );

        let obj = {};
        obj.sendToEmail = userData?.email_id;
        obj.firmName = Distributor[0]?.firmName;
        obj.userName = userName;
        obj.sendToName = userData?.employee_name;

        mailer.sentEmailForOffboarding(obj, "APPROVED");
      } else {
        const userData = await ResignationModel.getUserById(
          Distributor[0].initiator_id,
        );
        let obj = {};
        obj.sendToEmail = userData?.email_id;
        obj.firmName = Distributor[0]?.firmName;
        obj.userName = userName;
        obj.sendToName = userData?.employee_name;

        mailer.sentEmailForOffboarding(obj, "APPROVED");
      }
    }

    if (actionData.action === "Reject") {
      await ResignationModel.updateRejectoffboardHierarchy(
        user_id,
        actionData.applicationId,
        actionData.remarkMsg,
        req.cookies.role_id,
      );
      await ResignationModel.updateoOffboardingDistributor(
        actionData.applicationId,
      );
      const asmData = await ResignationModel.getUserById(
        Distributor[0]?.initiator_id,
      );

      let obj = {};
      obj.sendToEmail = Distributor[0]?.initiator_email;
      obj.firmName = Distributor[0]?.firmName;
      obj.userName = userName;
      obj.asmName = asmData.employee_name;
      mailer.sentEmailForOffboarding(obj, "REJECTED");
    }

    return res.status(200).json({
      type: "success",
      message: `${actionData.action} successful!`,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      type: "error",
      message: "An error occurred. Please try again later.",
    });
  }
};

const initiateOffboardAsmaction = async (req, res) => {
  try {
    const {
      application_id,
      offboard_type,
      reason = [],
      checktermination_reasons,
    } = req.body;

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name || "ASM";

    if (!application_id || !offboard_type || !user_id) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }
    const alreadyInitiated =
      await approverModel.checkOffboardingInitiated(application_id);

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated.",
        data: alreadyInitiated[0],
      });
    }

   
    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: role_name,
      action: "Initiated",
      remarks: "Offboarding initiated by ASM",
    });

    await approverModel.insertOffboardInitiation(
      application_id,
      offboard_type,
      user_id,
      role_name,
      offboard_type === "termination" ? reason : []
    );

    const distributor =
      await approverModel.getDistributorDetailsrole(application_id);

    if (!distributor || !distributor.territory_id) {
      throw new Error("Distributor or Territory not found");
    }

    const territory_id = distributor.territory_id;

    if (offboard_type === "resignation") {
      const token =
        Date.now().toString(36) +
        Math.random().toString(36).substr(2) +
        Math.random().toString(36).substr(2);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await approverModel.saveDbLinkToken(application_id, token, expiryDate);

      const emailStatus = await sendDbActionEmail(
        distributor.email,
        application_id,
        offboard_type,
        distributor.firmName,
        distributor.distributorName,
        token
      );

      if (emailStatus === "done") {
        console.log(`Resignation email sent successfully to ${distributor.email}`);
      } else {
        console.warn(
          `Resignation email failed for ${distributor.email}, but initiation continued.`
        );
      }

      
      return res.status(200).json({
        type: "success",
        message: "Resignation initiated. Email sent to distributor.",
      });
    }

    const hierarchyPersons = await approverModel.getAllhierarchyPersons(territory_id);

      let approvalHierarchy = [];

        let selectedReasons = reason;

        if (typeof selectedReasons === "string") {
          selectedReasons = [selectedReasons];
        }

        if (
          Array.isArray(selectedReasons) &&
          selectedReasons.includes("Average Business Value in GSV (L3P Average)")
        ) {
          approvalHierarchy = [
            "RSM","DT Team","SNF","distributor","TAX GST","distributor",
            "O2C","distributor","SNF","O2C","MDM","RSM","NSM","AP TEAM"
          ];
        } else {
          approvalHierarchy = [
            "RSM","DT Team","SNF","distributor","TAX GST","distributor",
            "O2C","distributor","SNF","O2C","MDM","RSM","AP TEAM"
          ];
        }

    await approverModel.deleteExistingWorkflow(application_id);

    let hierarchy = [];
    let sequence = 1;

   for (let role of approvalHierarchy) {

  if (role === "distributor") {
    await approverModel.insertOffboardApprovalWorkflow({
      application_id,
      territory_id,
      role_id: 0,
      role_name: "distributor",
      approver_id: 0,
      status: "NOT_STARTED",
      remark: null,
      sequence: sequence,
    });

    sequence++;
    continue;
  }

      const person = hierarchyPersons.find((p) => p.role === role);
      if (!person) continue;

      let currentSequence = sequence;

      if (role === "NSM") {
        currentSequence = sequence - 1;

        await new Promise(resolve => setTimeout(resolve, 5));
      }

      await approverModel.insertOffboardApprovalWorkflow({
        application_id,
        territory_id,
        role_id: person.user_role_id || null,
        role_name: person.role,
        approver_id: person.user_id,
        status: "NOT_STARTED",
        remark: null,
        sequence: currentSequence,
      });

      if (role !== "NSM") {
        sequence++;
      }
    }

    const lastApprover = sequence - 1;

    if (hierarchy.length > 0) {
      await approverModel.updateProspectiveInfo(
        hierarchy,
        hierarchy.length,
        hierarchy[0],
        lastApprover,
        application_id
      );
    }

      const firstApprover = hierarchyPersons.find(p => p.role === "RSM");

        if (firstApprover && firstApprover.email_id) {

          const asmUser = await ResignationModel.getUserById(user_id);
          const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);


         const today = new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
          const mailObj = {
            sendToEmail: firstApprover.email_id,
            sendToName: firstApprover.role,
            firmName: distributor.firmName,
            mars_code: distributor.mars_code,
            employee_name: asmUser?.employee_name,
            start_date: today,
            last_action_by: "ASM",
            last_action_date: today,
            application_id: application_id
          };

          await mailer.sentEmailForOffboarding(mailObj, "APPROVAL");
        }
    return res.status(200).json({
      type: "success",
      message:
        "Termination initiated successfully. Workflow started from RSM.",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};



const send_email_asm_infoDB = async (application_id, territory_id, next_approver_id) => {
  const distributor = await approverModel.getDistributorDetailsrole(application_id);
  const offboardDetails = await approverModel.getOffboardEmailDetailsDB(application_id);
  const hierarchyPersons = await approverModel.getAllhierarchyPersons(territory_id);

  const asmUser = hierarchyPersons.find(user => user.role === 'ASM');
  const nextUser = await ResignationModel.getUserById(next_approver_id);
 const submittedDetails = await approverModel.getDistributorSubmittedDate(application_id);
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; 
  };

  let obj = {};
  obj.sendToEmail = asmUser?.email_id;
  obj.firmName = distributor?.firmName;
  obj.mars_code = distributor?.mars_code;
  obj.asm_name = asmUser?.employee_name || "ASM";
  obj.start_date = formatDate(offboardDetails?.start_date);
  obj.last_action_by = "Distributor";
    obj.last_action_date = formatDate(submittedDetails?.submitted_at);
  obj.current_action_pending = nextUser?.employee_name || nextUser?.role_name || "Distributor";
  obj.application_id = application_id;

  await mailer.sentEmailForOffboarding(obj, "DBASM_INFO");
};

const saveResignation = async (req, res) => {
  try {
    const { applicationId, gsvAverage } = req.body;
    let application_id = applicationId;
    const token = req.body.token || req.query.token || "";

    const alreadySubmitted =
      await approverModel.checkResignationSubmitted(applicationId);

    const {
      firmName,
      distributorName,
      email,
      contact_no,
      low_turnover,
      low_roi,
      limitation_in_investment,
      db_going_out_of_business,
      increasing_cost,
      not_ready_for_additional_infrastructure,
    } = req.body;

    let noc_file_path = null;
    let resignation_letter = null;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (req.files?.nocFile) {
      const file = req.files.nocFile;

      if (file.size > MAX_FILE_SIZE) {
        return res.redirect(`/newoffboardApprover/webpageView/${token}?error=noc_size`);
      }

     if (file.type !== "application/pdf") {
        return res.redirect(`/newoffboardApprover/webpageView/${token}?error=noc_type`);
      }

      const uploadDir = path.join(__dirname, "../../public/uploads/noc");
      fs.mkdirSync(uploadDir, { recursive: true });

      const extension = path.extname(file.name) || ".pdf";
      const baseName = path.basename(file.name, extension);
      const uniqueFilename = `${baseName}_${Date.now()}${extension}`;
      const destPath = path.join(uploadDir, uniqueFilename);

      fs.copyFileSync(file.path, destPath);
      fs.unlinkSync(file.path);

      noc_file_path = "/uploads/noc/" + uniqueFilename;
    }

    if (req.files?.regionFile) {
      const file = req.files.regionFile;

       if (file.size > MAX_FILE_SIZE) {
        return res.redirect(`/newoffboardApprover/webpageView/${token}?error=letter_size`);
      }

      if (file.type !== "application/pdf") {
        return res.redirect(`/newoffboardApprover/webpageView/${token}?error=letter_type`);
      }

      const uploadDir = path.join(
        __dirname,
        "../../public/uploads/resignation_letter",
      );
      fs.mkdirSync(uploadDir, { recursive: true });

      const extension = path.extname(file.name) || ".pdf";
      const baseName = path.basename(file.name, extension);
      const uniqueFilename = `${baseName}_${Date.now()}${extension}`;
      const destPath = path.join(uploadDir, uniqueFilename);

      fs.copyFileSync(file.path, destPath);
      fs.unlinkSync(file.path);

      resignation_letter = "/uploads/resignation_letter/" + uniqueFilename;
    }

    await approverModel.insertResignationDetails({
      application_id: applicationId,
      firm_name: firmName,
      distributor_name: distributorName,
      email,
      contact_no,
      noc_file_path,
      resignation_letter,
      gsv_average: gsvAverage,
      low_turnover: low_turnover || null,
      low_roi: low_roi || null,
      limitation_in_investment: limitation_in_investment || null,
      db_going_out_of_business: db_going_out_of_business || null,
      increasing_cost: increasing_cost || null,
      not_ready_for_additional_infrastructure:
        not_ready_for_additional_infrastructure || null,
    });

    await approverModel.updateOffboardStatus(applicationId, "1");

    const distributor =
      await approverModel.getDistributorDetailsrole(applicationId);
    if (!distributor || !distributor.territory_id) {
      throw new Error("Territory not found for this distributor");
    }

    if (!distributor || !distributor.territory_id) {
      throw new Error("Territory not found for distributor");
    }

    const territory_id = distributor.territory_id;
    const hierarchyPersons =
      await approverModel.getAllhierarchyPersons(territory_id);
    const approvalHierarchy = [];
    if (gsvAverage > "3 Lakh") {
      approvalHierarchy.push(
        "RSEM",
        "DT Team",
        "SNF",
        "distributor",
        "TAX GST",
        "distributor",
        "O2C",
        "distributor",
        "SNF",
        "O2C",
        "MDM",
        "RSM",
        "NSM",
        "AP TEAM",
      );
    } else {
      approvalHierarchy.push(
        "RSEM",
        "DT Team",
        "SNF",
        "distributor",
        "TAX GST",
        "distributor",
        "O2C",
        "distributor",
        "SNF",
        "O2C",
        "MDM",
        "RSM",
        "AP TEAM",
      );
    }

    await approverModel.deleteExistingWorkflow(applicationId);


    let hierarchy = [];
    let sequence = 1;

for (let role of approvalHierarchy) {

  if (role === "distributor") {
    await approverModel.insertOffboardApprovalWorkflow({
      application_id,
      territory_id,
      role_id: 0,
      role_name: "distributor",
      approver_id: 0,
      status: "NOT_STARTED",
      remark: null,
      sequence: sequence,
    });

    hierarchy.push(0);
    sequence++;
    continue;
  }

      const person = hierarchyPersons.find((p) => p.role === role);
      if (!person) {
        console.warn(`No user found for role: ${role}`);
        continue;
      }

      let currentSequence = sequence;

      if (role === "NSM") {
        currentSequence = sequence - 1;
      }

      await approverModel.insertOffboardApprovalWorkflow({
        application_id,
        territory_id,
        role_id: person.user_role_id || null,
        role_name: person.role,
        approver_id: person.user_id,
        status: "NOT_STARTED",
        remark: null,
        sequence: currentSequence,
      });

      hierarchy.push(person.user_id);

      if (role !== "NSM") {
        sequence++;
      }
    }


    let lastApprover = sequence || null;
    await approverModel.updateProspectiveInfo(
      hierarchy,
      hierarchy.length,
      hierarchy[0],
      lastApprover,
      application_id,
    );
    await approverModel.insertWorkflowHistory({
      application_id,
        approver_id: 0,
        approver_role: "Distributor",
      action: "Submit",
      remarks: "Application submitted for offboarding",
    });


    const nextRow = await approverModel.getNextSequenceRow(application_id, 1);

    if (nextRow) {

      const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      const nextUser = await ResignationModel.getUserById(nextRow.approver_id);
      const offboardDetails = await approverModel.getOffboardEmailDetailsDB(application_id);
        const formatDate = (date) => {
          if (!date) return "";
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

      const mailObj = {
        sendToEmail: nextUser?.email_id,
        sendToName: nextUser?.employee_name,
        firmName: distributor.firmName,
        mars_code: distributor.mars_code,
        employee_name: distributor.distributorName,
        start_date: formatDate(offboardDetails?.start_date),
        last_action_by: "Distributor",
        current_action_pending : nextUser?.employee_name,
        last_action_date: today,
        application_id: application_id
      };

      await mailer.sentEmailForOffboarding(mailObj, "DBAPPROVAL");
      await send_email_asm_infoDB(application_id, distributor.territory_id, nextRow.approver_id);
    }

    req.session.notification = {
      type: "success",
      message: alreadySubmitted
        ? "Resignation details updated successfully! Approval workflow has been refreshed."
        : "Resignation submitted successfully! Approval workflow initiated.",
    };

    return res.redirect(`/newoffboardApprover/webpageView/${token}`);
  } catch (error) {
    console.error("Error saving resignation:", error);

    return res.redirect(`/newoffboardApprover/webpageView/${token}?error=server`);

  }
};

const submitNocUpload = async (req, res) => {
  try {
    const { application_id, termination_reasons } = req.body;

    const checktermination_reasons =
      termination_reasons &&
      termination_reasons.includes(
        "Average Business Value in GSV (L3P Average)",
      )
        ? "Average Business Value in GSV (L3P Average)"
        : null;

    // console.log(checktermination_reasons,"ss");
    // return;

    const file = req.files?.nocFile;

    if (!file) {
      return res.json({
        type: "error",
        message: "Please select a NOC file to upload.",
      });
    }

    const existing = await approverModel.getNocCertificate(application_id);

    if (existing && existing.noc_certificate) {
      return res.json({
        type: "error",
        message: "NOC has already been submitted for this application.",
      });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedMimeTypes = ["application/pdf", "application/x-pdf"];

    if (!allowedMimeTypes.includes(file.type) || ext !== ".pdf") {
      return res.json({
        type: "error",
        message: "Only PDF files are allowed for NOC.",
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.json({
        type: "error",
        message: "File size should not exceed 5MB.",
      });
    }

    const uploadDir = path.join(__dirname, "../../public/uploads/noc");
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${path.basename(file.name, ext)}_${Date.now()}.pdf`;
    const destPath = path.join(uploadDir, fileName);

    fs.copyFileSync(file.path, destPath);
    fs.unlinkSync(file.path);

    const noc_file_path = `/uploads/noc/${fileName}`;

    await approverModel.updateNocCertificate(application_id, noc_file_path);

    await approverModel.updateOffboardStatus(application_id, "1");

    const distributor =
      await approverModel.getDistributorDetailsrole(application_id);
    if (!distributor || !distributor.territory_id) {
      throw new Error("Territory not found for distributor");
    }

    const territory_id = distributor.territory_id;
    const hierarchyPersons =
    await approverModel.getAllhierarchyPersons(territory_id);
    const approvalHierarchy = [];
    if (
      checktermination_reasons == "Average Business Value in GSV (L3P Average)"
    ) {
      approvalHierarchy.push(
        "RSEM",
        "DT Team",
        "SNF",
        "distributor",
        "TAX GST",
        "distributor",
        "O2C",
        "distributor",
        "SNF",
        "O2C",
        "MDM",
        "RSM",
        "NSM",
        "AP TEAM",
      );
    } else {
      approvalHierarchy.push(
        "RSEM",
        "DT Team",
        "SNF",
        "distributor",
        "TAX GST",
        "distributor",
        "O2C",
        "distributor",
        "SNF",
        "O2C",
        "MDM",
        "RSM",
        "AP TEAM",
      );
    }

    await approverModel.deleteExistingWorkflow(application_id);

    let hierarchy = [];
    let sequence = 1;
    const roleSequenceMap = new Map();

    for (let role of approvalHierarchy) {
      const person = hierarchyPersons.find((p) => p.role === role);

      if (!person) {
        if (role === "distributor") {
          const approval_sequence = sequence++;
          await approverModel.insertOffboardApprovalWorkflow({
            application_id,
            territory_id,
            role_id: 0,
            role_name: "distributor",
            approver_id: 0,
            status: "NOT_STARTED",
            remark: null,
            sequence: approval_sequence,
          });
          hierarchy.push(0);
          continue;
        }
        console.warn(
          `No user found for role: ${role} in territory ${territory_id} - skipping`,
        );
        continue;
      }

      if (role == "RSM" || role == "NSM") {
        if (roleSequenceMap.has("RSM_NSM_SHARED")) {
          person.approval_sequence = roleSequenceMap.get("RSM_NSM_SHARED");
        } else {
          person.approval_sequence = sequence;
          roleSequenceMap.set("RSM_NSM_SHARED", person.approval_sequence);
          sequence++;
        }
      } else {
        person.approval_sequence = sequence++;
      }

      hierarchy.push(person.user_id);
      // console.log(hierarchy, "hierarchy");

      await approverModel.insertOffboardApprovalWorkflow({
        application_id,
        territory_id,
        role_id: role === "distributor" ? 0 : person.user_role_id || null,
        role_name: role === "distributor" ? "distributor" : person.role,
        approver_id: person.user_id,
        status: "NOT_STARTED",
        remark: null,
        sequence: person.approval_sequence,
      });
    }
    let lastApprover = sequence || null;
    await approverModel.updateProspectiveInfo(
      hierarchy,
      hierarchy.length,
      hierarchy[0],
      lastApprover,
      application_id,
    );
    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: req.cookies.user_id,
      approver_role: req.cookies.role_name,
      action: "Submit",
      remarks: "Application submitted for offboarding",
    });
    // await approverModel.activateRsemPending(application_id);

    return res.json({
      type: "success",
      message:
        "NOC uploaded successfully! Approval workflow has been initiated. You may now close this window.",
    });
  } catch (err) {
    console.error("NOC Upload Error:", err);
    return res.json({
      type: "error",
      message: "Upload failed. Please try again.",
    });
  }
};

const offboardrsemoffboardaction = async (req, res) => {
  try {
    const { application_id, action, remarks = "" } = req.body;
    const role_id = req.cookies.role_id;
    const user_role = req.cookies.role_name;
    const user_id = req.cookies.user_id;

    if (!application_id || !action || !role_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required data" });
    }

    const currentRow = await approverModel.getRsemPendingRow(
      application_id,
      req.cookies.user_id,
    );
    let sequence = currentRow.total_complete_approval_level;
    if (!currentRow) {
      return res.status(403).json({
        success: false,
        message: "This action is not pending for you",
      });
    }

    const newStatus = action === "approve" ? "APPROVED" : "RETURNED";

    if (action === "return" && !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remarks are required when returning",
      });
    }

    await approverModel.updateWorkflowRow(currentRow.id, {
      status: newStatus,
      remark: remarks,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: 1,
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: user_role,
      action: newStatus,
      remarks,
    });

    if (action === "approve") {
      const nextSequence = sequence + 1;
      const nextRow = await approverModel.getNextSequenceRow(
        application_id,
        nextSequence,
      );
      if (nextRow) {
        await approverModel.updateWorkflowRow(nextRow.id, {
          status: "PENDING",
          is_final_approval: 0,
        });
      }
      await approverModel.nextapproval_action_user_id(
        nextRow,
        user_id,
        application_id,
        "",
        "",
      );

      await approverModel.updateMainOffboardStatus(
        application_id,
        "RSEM_APPROVED",
      );
      await send_email_sac(nextRow.approver_id, application_id, nextRow.approver_id);
      const distributor = await approverModel.getDistributorDetailsrole(application_id);
      await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);

      await approverModel.updatedt_team_flag(application_id);
    } else {
      await approverModel.deleteMainOffboardStatus(application_id);
      await approverModel.deleteMainOffboardStatusresign(application_id);

      const userData = await ResignationModel.getUserById(user_id);
      let obj = {};
      obj.sendToEmail = userData?.email_id;
      obj.firmName = "";
      obj.userName = "";
      obj.sendToName = userData?.employee_name;

      let sac = mailer.sentEmailForOffboarding(obj, "SENDTOTRETURN");
    }

    res.json({
      success: true,
      message:
        action === "approve"
          ? "Offboarding request approved and sent to ASM."
          : "Request returned for clarification.",
    });
  } catch (error) {
    console.error("RSEM Action Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const rsmInitialAction = async (req, res) => {
  try {
    const { application_id, action, remarks = "" } = req.body;
    const role_id = req.cookies.role_id;
    const user_role = req.cookies.role_name;
    const user_id = req.cookies.user_id;

    if (!application_id || !action || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    } 

    const currentRow = await approverModel.getRsemPendingRow(
      application_id,
      user_id
    );

    if (!currentRow) {
      return res.status(403).json({
        success: false,
        message: "This action is not pending for you",
      });
    }

    let sequence = currentRow.total_complete_approval_level || 0;
    const newStatus = action.toLowerCase() === "approve" ? "APPROVED" : "RETURNED";

    if (action.toLowerCase() === "return" && !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remarks are required when returning",
      });
    }

    await approverModel.updateWorkflowRow(currentRow.id, {
      status: newStatus,
      remark: remarks,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: 1,
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: user_role,
      action: newStatus,
      remarks,
    });

    if (action.toLowerCase() === "approve") {
      const nextSequence = sequence + 1;
      const nextRow = await approverModel.getNextSequenceRow(
        application_id,
        nextSequence
      );

      if (nextRow) {
        await approverModel.updateWorkflowRow(nextRow.id, {
          status: "PENDING",
          is_final_approval: 0,
        });

        await approverModel.nextapproval_action_user_id(
          nextRow,
          user_id,
          application_id,
          "",
          ""
        );

        await approverModel.updateMainOffboardStatus(
          application_id,
          "RSM_APPROVED"
        );

        const distributor = await approverModel.getDistributorDetailsrole(application_id);
        await send_email_sac(nextRow.approver_id, application_id, nextRow.approver_id);
        await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);
        await approverModel.updatedt_team_flag(application_id);
      }
    } else {
      await approverModel.deleteMainOffboardStatus(application_id);

      const userData = await ResignationModel.getUserById(user_id);
      let obj = {
        sendToEmail: userData?.email_id || "",
        firmName: "",
        userName: userData?.employee_name || "",
        sendToName: userData?.employee_name || "",
      };

      mailer.sentEmailForOffboarding(obj, "SENDTOTRETURN");
    }

    res.json({
      success: true,
      message:
        action.toLowerCase() === "approve"
          ? "Offboarding request approved and sent to next level."
          : "Request returned for clarification.",
    });
  } catch (error) {
    console.error("RSM Action Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const send_email_Approve = async (approver_id, application_id) => {
  const userData = await approverModel.getdisById_(approver_id);
  const userDatassss = await ResignationModel.getUserById(userData.user_id);
  const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);


  let obj = {};
  obj.sendToEmail = userData?.aseemail;
  obj.firmName = userData?.firmName;
  obj.asmName = userDatassss?.employee_name;
  obj.userName = userDatassss?.employee_name;
  obj.employee_name = userDatassss?.employee_name;
  obj.sendToName = userData?.firmName;
  obj.mars_code = userData?.mars_code;
  
  obj.start_date = offboardDetails?.start_date;
  obj.last_action_by = offboardDetails?.last_action_by;
  obj.last_action_date = offboardDetails?.last_action_date;

  let sac = mailer.sentEmailForOffboarding(obj, "APPROVED");
};

const send_email_Reject = async (approver_id) => {
  const userData = await approverModel.getdisById_(approver_id);
  const userDatassss = await ResignationModel.getUserById(userData.user_id);
  let obj = {};
  obj.sendToEmail = userData?.aseemail;
  obj.firmName = userData?.firmName;
  obj.asmName = userDatassss?.employee_name;
  obj.userName = userDatassss?.employee_name;
  obj.employee_name = userDatassss?.employee_name;
  obj.mars_code = userData?.mars_code;  
  obj.sendToName = userData?.firmName;

  let sac = mailer.sentEmailForOffboarding(obj, "REJECTED");
};

const send_email_sac = async (approver_id, application_id, next_approver_id) => {
  const userData = await ResignationModel.getUserById(approver_id);
  const distributor = await approverModel.getDistributorDetailsrole(application_id);
  const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);
  const nextUser = await ResignationModel.getUserById(next_approver_id);
  let obj = {};
  obj.sendToEmail = userData?.email_id;
  obj.firmName = distributor?.firmName;
  obj.mars_code = distributor?.mars_code;
  obj.sendToName = userData?.employee_name;
  obj.employee_name = userData?.employee_name;
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    obj.start_date = formatDate(offboardDetails?.start_date);
    obj.last_action_by = offboardDetails?.last_action_by;
    obj.current_action_pending = nextUser?.employee_name || nextUser?.role_name || "Pending";
    obj.last_action_date = formatDate(offboardDetails?.last_action_date);

    obj.application_id = application_id;

  let sac = mailer.sentEmailForOffboarding(obj, "APPROVED");
};

const send_email_asm_info = async (application_id, territory_id, next_approver_id) => {
  const distributor = await approverModel.getDistributorDetailsrole(application_id);
  const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);
  const hierarchyPersons = await approverModel.getAllhierarchyPersons(territory_id);

  const asmUser = hierarchyPersons.find(user => user.role === 'ASM');
  const nextUser = await ResignationModel.getUserById(next_approver_id);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; 
  };

  let obj = {};
  obj.sendToEmail = asmUser?.email_id;
  obj.firmName = distributor?.firmName;
  obj.mars_code = distributor?.mars_code;
  obj.asm_name = asmUser?.employee_name || "ASM";
  obj.start_date = formatDate(offboardDetails?.start_date);
  obj.last_action_by = offboardDetails?.last_action_by;
  obj.last_action_date = formatDate(offboardDetails?.last_action_date);
  obj.current_action_pending = nextUser?.employee_name || nextUser?.role_name || "Distributor";
  obj.application_id = application_id;

  await mailer.sentEmailForOffboarding(obj, "ASM_INFO");
};


const send_email_sac_returned = async (approver_id) => {
  const userData = await ResignationModel.getUserById(approver_id);
  let obj = {};
  obj.sendToEmail = userData?.email_id;
  obj.firmName = "";
  obj.userName = "";
  obj.sendToName = userData?.employee_name;

  await mailer.sentEmailForOffboarding(obj, "RETURNED");
};

const send_email_distu = async (approver_id, token, expiryDate) => {
  const userData = await approverModel.getdisById_(approver_id);

  let sendlink = "/newoffboardApprover/webpageclearclearance/" + token;
  let obj = {};
  obj.sendToEmail = userData?.email;
  obj.firmName = "";
  obj.userName = "";
  obj.sendToName = userData?.distributorName;
  obj.token = token;
  obj.sendlink = sendlink;

  let sac = mailer.sentEmailForOffboarding(obj, "DISTRIBUTORsnf");
};

const assettransfersubmit = async (req, res) => {
  try {
    const { application_id, transfer_assets, assetRemarksBox = [] } = req.body;
    // console.log(req.body,"req.body");
    // return

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (!application_id || !transfer_assets || !user_id) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated = await approverModel.checkOffboardingapproved(
      application_id,
      user_id,
      role_id,
    );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }

    await updateapprovel_level(
      application_id,
      user_id,
      role_id,
      role_name,
      transfer_assets,
      assetRemarksBox,
    );
    await approverModel.updateOffboardapproved(application_id, transfer_assets);
    return res.status(200).json({
      type: "success",
      message: "success",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const updateapprovel_levelNSM = async (
  application_id,
  approver_id,
  role_id,
  approver_role,
  action,
  remarks,
  fnf_flag,
  total_level,
) => {
  const currentRow = await approverModel.getRsemPendingRow(
    application_id,
    approver_id,
  );

  const sequence = currentRow?.total_complete_approval_level ?? "12";

  if (!currentRow) {
    throw new Error("This action is not pending for you");
  }

  let status = "APPROVED";
  let flag = "";
  let is_final_approval = 1;
  let data = {};

  if (action === "Approve") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  } else if (action === "Reject") {
    status = "REJECT";
    is_final_approval = 2;
    flag = 2;
    data = {
      approver_id: approver_id,
      sequence: sequence,
    };
  } else if (role_id == "15") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  }
  await approverModel.updateWorkflowRow(currentRow.id, {
    status: status,
    remark: remarks,
    acted_by: role_id,
    acted_at: new Date(),
    is_final_approval: is_final_approval,
    fnf_flag: fnf_flag,
    total_level: total_level,
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: approver_id,
    approver_role: approver_role,
    action: status,
    remarks: remarks,
  });

  if (action === "Reject") {
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_Reject(approver_id);
  } else if (role_id == "15") {
    data = {
      approver_id: approver_id,
      sequence: sequence,
      status: "Approve",
      is_final_approval: 1,
      flag: 1,
    };
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );

    await send_email_Approve(approver_id);
  } else {
    let nextSequence = [];
    if (sequence == "12") {
      let check_pending = await approverModel.checkPendingRow(
        application_id,
        sequence,
      );
      console.log(check_pending, "check_pending");

      const rsmApproval = check_pending.find(
        (row) => row.role_name === "RSM",
      )?.is_final_approval;
      const nsmApproval = check_pending.find(
        (row) => row.role_name === "NSM",
      )?.is_final_approval;

      const bothFullyApproved = rsmApproval === 1 && nsmApproval === 1;

      if (!bothFullyApproved) {
        console.log(
          "Both RSM and NSM need to be fully approved before proceeding",
        );
        return;
      }

      nextSequence = parseInt(sequence) + 1;
    } else {
      nextSequence = parseInt(sequence) + 1;
    }
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    // console.log(nextSequence, "nextSequence");
    // return;
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: 0,
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_sac(nextRow.approver_id);
  }
};

const updateapprovel_level = async (
  application_id,
  approver_id,
  role_id,
  approver_role,
  action,
  remarks,
  fnf_flag,
  total_level,
) => {
  currentRow = await approverModel.getRsemPendingRow(
    application_id,
    approver_id,
  );
  sequence = currentRow?.total_complete_approval_level ?? "12";
    if (!currentRow) {
    throw new Error("This action is not pending for you");
  }

  let status = "APPROVED";
  let flag = "";
  let is_final_approval = 1;
  let data = {};

  if (action === "Approve") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  } else if (action === "Reject") {
    status = "REJECT";
    is_final_approval = 2;
    flag = 2;
    data = {
      approver_id: approver_id,
      sequence: sequence,
    };
  } else if (role_id == "15") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  }
  await approverModel.updateWorkflowRow(currentRow.id, {
    status: status,
    remark: remarks,
    acted_by: role_id,
    acted_at: new Date(),
    is_final_approval: is_final_approval,
    fnf_flag: fnf_flag,
    total_level: total_level,
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: approver_id,
    approver_role: approver_role,
    action: status,
    remarks: remarks,
  });

  if (action === "Reject") {
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_Reject(approver_id);
  } else if (role_id == "15") {
    data = {
      approver_id: approver_id,
      sequence: sequence,
      status: "Approve",
      is_final_approval: 1,
      flag: 1,
    };
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );

    await send_email_Approve(approver_id);
  } else {
    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: 0,
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_sac(nextRow.approver_id, application_id, nextRow.approver_id);
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);
  }
};

const updateapprovel_Fnf = async (
  application_id,
  approver_id,
  role_id,
  approver_role,
  action,
  remarks,
  fnf_flag,
  total_level,
) => {
  currentRow = await approverModel.getRsemPendingRow(
    application_id,
    approver_id,
  );
  sequence = currentRow?.total_complete_approval_level ?? "12";
    if (!currentRow) {
    throw new Error("This action is not pending for you");
  }

  let status = "APPROVED";
  let flag = "";
  let is_final_approval = 1;
  let data = {};

  if (action === "Approve") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  } else if (action === "Reject") {
    status = "REJECT";
    is_final_approval = 2;
    flag = 2;
    data = {
      approver_id: approver_id,
      sequence: sequence,
    };
  } else if (role_id == "15") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  }
  await approverModel.updateWorkflowRow(currentRow.id, {
    status: status,
    remark: remarks,
    acted_by: role_id,
    acted_at: new Date(),
    is_final_approval: is_final_approval,
    fnf_flag: fnf_flag,
    total_level: total_level,
  });

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: approver_id,
    approver_role: approver_role,
    action: status,
    remarks: remarks,
  });

  if (action === "Reject") {
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_Reject(approver_id);
  } else if (role_id == "15") {
    data = {
      approver_id: approver_id,
      sequence: sequence,
      status: "Approve",
      is_final_approval: 1,
      flag: 1,
    };
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );

    await send_email_Approve(approver_id);
  } else {
    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: 0,
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    
    
  }
};


const updateapprovel_levelRSM = async (
  application_id,
  approver_id,
  role_id,
  approver_role,
  action,
  remarks,
  fnf_flag,
  total_level
) => {

  const currentRow = await approverModel.getRsemPendingRowRSM(
    application_id,
    approver_id,
  );

  if (!currentRow) {
    throw new Error("This action is not pending for you");
  }

  const sequence = currentRow.sequence;

 let status = "APPROVED";
  let flag = "";
  let is_final_approval = 1;
  let data = {};

  if (action === "Approve") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  } else if (action === "Reject") {
    status = "REJECT";
    is_final_approval = 2;
    flag = 2;
    data = {
      approver_id: approver_id,
      sequence: sequence,
    };
  } else if (role_id == "15") {
    status = "APPROVED";
    is_final_approval = 1;
    flag = 1;
  }
  await approverModel.updateWorkflowRow(currentRow.id, {
    status: status,
    remark: remarks,
    acted_by: role_id,
    acted_at: new Date(),
    is_final_approval: is_final_approval,
    fnf_flag: fnf_flag,
    total_level: total_level,
  });

  if (parseInt(sequence) === 12 && action === "Approve" && approver_role === "RSM") {
     await approverModel.updateParallelNSM(application_id, sequence);
   }

  await approverModel.insertWorkflowHistory({
    application_id,
    approver_id: approver_id,
    approver_role: approver_role,
    action: status,
    remarks: remarks,
  });

  if (action === "Reject") {
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
    await send_email_Reject(approver_id);
  } else if (role_id == "15") {
    data = {
      approver_id: approver_id,
      sequence: sequence,
      status: "Approve",
      is_final_approval: 1,
      flag: 1,
    };
    await approverModel.nextapproval_action_user_id(
      data,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );

    await send_email_Approve(approver_id);
  } else {
    let nextSequence = [];
    if (sequence == "12") {
    let check_pending = await approverModel.checkPendingRow(
      application_id,
      sequence,
    );

  const rsmRow = check_pending.find(
    (row) => row.role_name === "RSM"
  );

  const nsmRow = check_pending.find(
    (row) => row.role_name === "NSM"
  );

  const rsmApproved = rsmRow?.is_final_approval === 1;
  const nsmExists = !!nsmRow;
  const nsmApproved = nsmRow?.is_final_approval === 1;

  if (nsmExists) {
    if (!(rsmApproved && nsmApproved)) {
      console.log("Waiting for both RSM & NSM approval");
      return;
    }
  }
  else {
    if (!rsmApproved) {
      console.log("Waiting for RSM approval");
      return;
    }
  }

  nextSequence = parseInt(sequence) + 1;
} else {
      nextSequence = parseInt(sequence) + 1;
    }
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    // console.log(nextSequence, "nextSequence");
    // return;
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: 0,
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      approver_id,
      application_id,
      fnf_flag,
      flag,
    );
   
    await send_email_sac(nextRow.approver_id, application_id, nextRow.approver_id);
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);
  }
};

const claimSubmit = async (req, res) => {
  try {
    const {
      application_id,
      type,
      amount,
      total_complete_approval_level,
    } = req.body;
    // console.log(req.body, "req.body");
    // return;

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (!application_id || !type || !amount) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated = await approverModel.checkOffboardingapproved(
      application_id,
      user_id,
      role_id,
    );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }
    console.log(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level,
    );

    const Row = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level,
    );
    // console.log(currentRow);
    let currentRow = Row[0];
    // return;
    let sequence = currentRow.sequence;
    if (!currentRow) {
      return res.status(403).json({
        success: false,
        message: "This action is not pending for you",
      });
    }

    await approverModel.updateWorkflowRow(currentRow.id, {
      status: "APPROVED",
      remark: "",
      acted_by: role_id,
      acted_at: new Date(),
      sequence: sequence,
      is_final_approval: 1,
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: role_name,
      action: "APPROVED",
      remarks: "",
    });

    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: 0,
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      user_id,
      application_id,
      "",
      "",
    );

    await approverModel.deleteDbResponseByApplicationId(application_id);

    await approverModel.updateOffboardapprovedunit(
      application_id,
      type,
      amount,
    );

    const token =
      Date.now().toString(36) +
      Math.random().toString(36).substr(2) +
      Math.random().toString(36).substr(2);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    await approverModel.saveDbLinkToken(application_id, token, expiryDate);
    const shouldInit = await approverModel.shouldInitializeDbTracking(application_id);

    if (shouldInit) {
      await approverModel.initializeDbTracking(application_id);
    }
    await send_email_distu(application_id, token, expiryDate, link);
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);

    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated & email sent to distributor",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const gstsubmit = async (req, res) => {
  try {
    const {
      application_id,
      gstYes,
      gstRemark = [],
      gstNumber,
      total_complete_approval_level,
    } = req.body;
    // console.log(req.body,"req.body");
    // return

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (
      !application_id ||
      !gstYes ||
      !user_id ||
      !gstNumber ||
      !total_complete_approval_level
    ) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated = await approverModel.checkOffboardingapproved(
      application_id,
      user_id,
      role_id,
    );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }

    const currentRowss = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level,
    );
    const row = currentRowss[0];
    // console.log(row, "row");
    // return
    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    let status = "APPROVED";
    let flag = "";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: gstYes,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "",
      total_level: total_complete_approval_level,
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: role_name,
      action: status,
      remarks: gstYes,
    });

    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      "0",
      application_id,
      "",
      flag,
    );
    await approverModel.updateDbLinkStatus(application_id, 0);
    await approverModel.updateGstReversalStatus(application_id);
    const userData = await approverModel.getdisById_(application_id);
    const token =
      Date.now().toString(36) +
      Math.random().toString(36).substr(2) +
      Math.random().toString(36).substr(2);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    await approverModel.saveDbLinkToken(application_id, token, expiryDate);
    let sendlink = "/newoffboardApprover/webpagereversal/" + token;
    let obj = {};
    obj.sendToEmail = userData?.email;
    obj.firmName = "";
    obj.userName = "";
    obj.sendToName = userData?.distributorName;
    obj.token = token;
    obj.sendlink = sendlink;

    let sac = mailer.sentEmailForOffboarding(obj, "DISTRIBUTORsnf");
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);

    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated Successfully",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const FnfSubmit = async (req, res) => {
  try {
    const { application_id } = req.body;
    // console.log(req.body, "req.body");

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (!application_id || !user_id) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }
    let fnf_file_path = null;
    if (req.files?.fnfFile) {
      const file = req.files.fnfFile;
      const fs = require("fs");
      const path = require("path");

      const uploadsDir = path.join(__dirname, "../../src/public/uploads/fnf");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `fnf_${application_id}_${timestamp}${fileExtension}`;

      const filePath = path.join(uploadsDir, uniqueFilename);
      fs.copyFileSync(file.path, filePath);
      fs.unlinkSync(file.path);

      fnf_file_path = "/uploads/fnf/" + uniqueFilename;

      // console.log("F&F file saved:", fnf_file_path);
    } else {
      return res.status(400).json({
        type: "error",
        message: "No file uploaded",
      });
    }

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flag(
        application_id,
        user_id,
        role_id,
      );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }
    const currentRowss = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      "7",
    );
    const row = currentRowss[0];
    // console.log(row, "row");
    // return
    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    let status = "APPROVED";
    let flag = "";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: fnf_file_path,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "1",
      total_level: "6",
    });
    await approverModel.updateOffboardapprovedfnf_flag(application_id, "1");

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: role_name,
      action: status,
      remarks: "",
    });

    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      "0",
      application_id,
      "",
      flag,
    );

    // await updateapprovel_level(application_id,
    //   user_id,
    //   role_id,
    //   role_name,
    //   fnf_file_path,
    //   null, fnf_flag)

    await approverModel.updateOffboardapprovedfnf(
      application_id,
      fnf_file_path,
    );

    const token =
      Date.now().toString(36) +
      Math.random().toString(36).substr(2) +
      Math.random().toString(36).substr(2);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    await approverModel.saveDbLinkToken(application_id, token, expiryDate);
    await send_email_distu_fnf(application_id, token, expiryDate, link);
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);
    return res.status(200).json({
      type: "success",
      message: "F&F file uploaded successfully",
      filePath: fnf_file_path,
    });
  } catch (error) {
    console.log("F&F Submit Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const send_email_distu_fnf = async (approver_id, token, expiryDate) => {
  const userData = await approverModel.getdisById_(approver_id);

  let sendlink = "/newoffboardApprover/webpagefnf/" + token;
  let obj = {};
  obj.sendToEmail = userData?.email;
  obj.firmName = "";
  obj.userName = "";
  obj.sendToName = userData?.distributorName;
  obj.token = token;
  obj.sendlink = sendlink;

  let sac = mailer.sentEmailForOffboarding(obj, "DISTRIBUTORsnf");
};

const zeroLedgerSubmit = async (req, res) => {
  try {
    const {
      application_id,
      zeroLedgerSelect,
      zeroLedgerRemarks = [],
      fnf_flag,
      total_complete_approval_level,
    } = req.body;
    console.log(req.body, "req.body");
    // return

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (
      !application_id ||
      !zeroLedgerRemarks ||
      !user_id ||
      !zeroLedgerSelect
    ) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flagzero(
        application_id,
        user_id,
        role_id,
        total_complete_approval_level,
      );
    //     console.log(alreadyInitiated, "alreadyInitiated");
    // return
    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }
    // const currentRow = await approverModel.getRsemPendingRow(
    //   application_id,
    //   user_id,
    // );
    // if (!currentRow) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "This action is not pending for you",
    //   });
    // }
    const currentRowss = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level,
    );
    const row = currentRowss[0];
    // console.log(row, "row");
    // return
    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    let status = "APPROVED";
    let flag = "";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: zeroLedgerRemarks,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "",
      total_level: total_complete_approval_level,
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: user_id,
      approver_role: role_id,
      action: status,
      remarks: zeroLedgerRemarks,
    });

    const nextSequence = sequence + 1;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      "0",
      application_id,
      "",
      flag,
    );

    const userData = await ResignationModel.getUserById(nextRow.approver_id);
    // console.log("Next Row:", nextRow);
    // console.log("Approver ID:", nextRow?.approver_id);
    // console.log("User Data:", userData);


   const distributor = await approverModel.getDistributorDetailsrole(application_id);
   const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);

    let obj = {};
    obj.sendToEmail = userData?.email_id;
    obj.firmName = distributor?.firmName;
    obj.mars_code = distributor?.mars_code;
    obj.sendToName = userData?.employee_name;
    obj.employee_name = userData?.employee_name;
    obj.sendToName = userData?.employee_name;
    obj.employee_name = userData?.employee_name;

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    obj.start_date = formatDate(offboardDetails?.start_date);
    obj.last_action_by = offboardDetails?.last_action_by;
    obj.last_action_date = formatDate(offboardDetails?.last_action_date);
    obj.application_id = application_id;

    let sac = mailer.sentEmailForOffboarding(obj, "APPROVED");
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);

    return res.status(200).json({
      type: "success",
      message: "APPROVED",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};


const send_email_fnf_pending = async (application_id, territory_id, next_approver_id, approver_id) => {
  const distributor = await approverModel.getDistributorDetailsrole(application_id);
  const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);
  const hierarchyPersons = await approverModel.getAllhierarchyPersons(territory_id);
  const userData = await ResignationModel.getUserById(approver_id);
  
  
  const nextUser = await ResignationModel.getUserById(next_approver_id);
  const rsmUser = hierarchyPersons.find(user => user.role === "RSM");
  const nsmUser = hierarchyPersons.find(user => user.role === "NSM");

  const nsmWorkflow = await approverModel.checkRoleInWorkflow(
    application_id,
    "NSM"
  );


  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; 
  };

    let usersToNotify = [];

      if (rsmUser) {
    usersToNotify.push(rsmUser);
  }

  if (nsmUser && nsmWorkflow) {
    usersToNotify.push(nsmUser);
  }



  for (const user of usersToNotify) {
  const hierarchyUser = await ResignationModel.getUserById(user.user_id);

    let obj = {};
    obj.sendToEmail = hierarchyUser?.email_id;
    obj.firmName = distributor?.firmName;
    obj.application_id = application_id;
    obj.sendToName = hierarchyUser?.employee_name;
    obj.employee_name = userData?.employee_name;
    obj.start_date = formatDate(offboardDetails?.start_date);
    obj.last_action_by = offboardDetails?.last_action_by || 'N/A';
    obj.last_action_date = formatDate(offboardDetails?.last_action_date);
    obj.current_action_pending = nextUser?.employee_name || nextUser?.role_name || "Distributor";

    await mailer.sentEmailForOffboarding(obj, "FNFACTION_PENDING");
  }

};

const blockDbSubmit = async (req, res) => {
  try {
    const {
      application_id,
      blockDbSelect,
      blockDbRemarks = [],
      fnf_flag,
      total_complete_approval_level,
    } = req.body;
    // console.log(req.body,"req.body");
    // return

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (!application_id || !user_id || !blockDbSelect) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const distributor = await approverModel.getDistributorDetailsrole(application_id);

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flagzero(
        application_id,
        user_id,
        role_id,
        total_complete_approval_level,
      );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }

    await updateapprovel_Fnf(
      application_id,
      user_id,
      role_id,
      role_name,
      blockDbSelect,
      blockDbRemarks,
      total_complete_approval_level,
    );
    await approverModel.updateOffboardapprovedgst(
      application_id,
      blockDbSelect,
      blockDbRemarks,
    );

    const isTermination = await approverModel.shouldInitializeDbTracking(application_id);

    if (isTermination) {
       
      const currentRowArr = await approverModel.checkOffboardingapprovedPDF(
          application_id,
          user_id,
          role_id,
          total_complete_approval_level
        );

        const currentRow = currentRowArr[0];

        const nextSequence = currentRow.sequence + 1;

        const nextRow = await approverModel.getNextSequenceRow(
          application_id,
          nextSequence
        );

      if (nextRow) {
        await send_email_asm_info(
          application_id,
          distributor.territory_id,
          nextRow.approver_id
        );

        await send_email_fnf_pending(
          application_id,
          distributor.territory_id,
          nextRow.approver_id
        );

        
      }
    }
    await approverModel.updateRsmActionBtn(application_id);
  
    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated Successfully",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const fnfApproveBtn = async (req, res) => {
  try {
    const {
      application_id,
      fnfApproveBtn,
      fnfRemarks = [],
      fnf_flag,
      total_complete_approval_level,
      exitInterviewRemarks = null
    } = req.body;
    // console.log(req.body,"req.body");
    // return

    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const role_id = req.cookies.role_id;

    if (!application_id || !user_id || !fnfApproveBtn) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flagzero(
        application_id,
        user_id,
        role_id,
        total_complete_approval_level,
      );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }


    const distributor =
      await approverModel.getDistributorDetails(application_id);

    
    if (
      distributor &&
      distributor.offboard_type === "resignation" &&
      fnfApproveBtn === "Approve" &&
      distributor.exit_interview_completed == 0
    )  {
      if (!exitInterviewRemarks) {
        return res.status(400).json({
          type: "error",
          message: "Exit interview remarks are mandatory.",
          requireExitInterview: true
        });
      }

      const parsed = JSON.parse(exitInterviewRemarks || "[]");
      const anyEmpty = parsed.some(ans => !ans || ans.trim() === "");

      if (anyEmpty) {
        return res.status(400).json({
          type: "error",
          message: "Please answer all exit interview questions.",
          requireExitInterview: true
        });
      }
    }

    await updateapprovel_levelRSM(
      application_id,
      user_id,
      role_id,
      role_name,
      fnfApproveBtn,
      fnfRemarks,
      fnf_flag,
    );

    await approverModel.updateOffboardapprovedgst(
      application_id,
      fnfApproveBtn,
      fnfRemarks,
    );

    const result = await approverModel.handleTerminationApFlow(application_id);


    if (exitInterviewRemarks) {
      await approverModel.updateOffboardExitInterview(
        application_id,
        exitInterviewRemarks
      );
      await approverModel.markExitInterviewCompleted(application_id);
    }


    // const emailStatus = await sendDbActionEmail(
    //   distributor.email,
    //   application_id,
    //   offboard_type,
    //   distributor.firmName,
    //   distributor.distributorName,
    //   token
    // );

    // if (emailStatus === "done") {
    //   console.log(`Email sent successfully to ${distributor.email}`);
    // } else {
    //   console.warn(
    //     `Email failed for ${distributor.email}, but initiation continued.`
    //   );
    // }

    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated Successfully",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "This action is not pending for you",
    });
  }
};

const send_email_last_approve = async (approver_id, application_id) => {

  const distributor = await approverModel.getDistributorDetails(application_id);
  const userData = await approverModel.getdisById_(approver_id);
  const approverDetails = await ResignationModel.getUserById(userData?.user_id);
  const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  let obj = {};

  obj.sendToEmail = userData?.aseemail;
  obj.sendToName = distributor?.firmName;

  obj.firmName = distributor?.firmName;
  obj.mars_code = userData?.mars_code;

  obj.employee_name = approverDetails?.employee_name;
  obj.asmName = approverDetails?.employee_name;

  obj.start_date = formatDate(offboardDetails?.start_date);
  obj.last_action_by = offboardDetails?.last_action_by;
  obj.last_action_date = formatDate(offboardDetails?.last_action_date);

  obj.application_id = application_id;

  await mailer.sentEmailForOffboarding(obj, "LAST_APPROVED");
};

const paymentSubmitBtn = async (req, res) => {
  try {
    const { application_id, fnfApproveBtn, total_complete_approval_level } = req.body;
    const apTracking = await approverModel.getApTracking(application_id);

        if (!apTracking) {
          return res.json({
            type: "error",
            message: "AP details not found.",
          });
        }

        if (apTracking.offboard_type === "termination") {
          if (new Date() > new Date(apTracking.ap_deadline)) {
            return res.json({
              type: "error",
              message:
                "AP response time expired (15 days). Now SNF will process the payment.",
            });
          }
        }


        await approverModel.updateApAction(application_id, {
          ap_action_status: fnfApproveBtn === "YES" ? "APPROVED" : "REJECTED",
          ap_action_taken_at: new Date()
        });

        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        const role_id = req.cookies.role_id;

      if (!application_id || !user_id || !fnfApproveBtn) {
        return res.status(400).json({
          type: "error",
          message: "Invalid offboarding data or user not logged in",
        });
      }

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flagzero(
        application_id,
        user_id,
        role_id,
        total_complete_approval_level,
      );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }
    const currentRowss = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level,
    );

    if (!currentRowss || currentRowss.length === 0) {
      return res.status(400).json({
        type: "error",
        message: "No workflow row found for this user and application",
      });
    }

    const row = currentRowss[0]; 

    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    let status = "APPROVED";
    let flag = "1";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: fnfApproveBtn,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "",
      total_level: total_complete_approval_level,
    });

    if (role_id == "15") {
      status = "APPROVED";
      is_final_approval = 1;
      flag = 1;
    }

    if (role_id == "15") {
      data = {
        approver_id: user_id,
        sequence: sequence,
        status: "Approve",
        is_final_approval: 1,
        flag: 1,
      };
      await approverModel.nextapproval_action_user_id(
        data,
        user_id,
        application_id,
        "",
        flag,
      );

      await send_email_last_approve(user_id, application_id);
    }

    const distributor =
      await approverModel.getDistributorDetails(application_id);

    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated Successfully",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};


const snfPaymentSubmitBtn = async (req, res) => {
  try {
    const { application_id, fnfApproveBtn, total_complete_approval_level } =
      req.body;
        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        const role_id = req.cookies.role_id;

    if (!application_id || !user_id || !fnfApproveBtn) {
      return res.status(400).json({
        type: "error",
        message: "Invalid offboarding data or user not logged in",
      });
    }

    const alreadyInitiated =
      await approverModel.checkOffboardingapprovedfnf_flagzeroSNF(
        application_id,
        role_id,
        total_complete_approval_level,
      );
    // console.log(alreadyInitiated, "alreadyInitiated");

    if (alreadyInitiated && alreadyInitiated.length > 0) {
      return res.status(200).json({
        type: "info",
        message: "Offboarding request already initiated for this distributor.",
        data: alreadyInitiated[0],
      });
    }
    

    let currentRowss;

if (role_name === "SNF") {
  // SNF ke liye user_id ko ignore karo, sirf application_id aur total_complete_approval_level se row fetch
  currentRowss = await approverModel.getWorkflowRowForSNF(application_id, total_complete_approval_level);
} else {
  currentRowss = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      user_id,
      role_id,
      total_complete_approval_level
  );
}

if (!currentRowss || currentRowss.length === 0) {
  return res.status(400).json({
    type: "error",
    message: "No workflow row found for this user and application",
  });
}

    const row = currentRowss[0]; 

    await approverModel.updateWorkflowRow(row.id, {
      status: fnfApproveBtn === "YES" ? "APPROVED" : "REJECTED",
      remark: fnfApproveBtn,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: 1,
      fnf_flag: "",
      total_level: total_complete_approval_level,
    });

    if(role_name === "SNF") {
      await approverModel.nextapproval_action_user_id_SNF(application_id, 1, fnfApproveBtn === "YES" ? "Approved" : "Rejected");
    }
        if (!currentRowss || currentRowss.length === 0) {
          return res.status(400).json({
            type: "error",
            message: "No workflow row found for this user and application",
          });
        }

    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    let status = "APPROVED";
    let flag = "1";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: fnfApproveBtn,
      acted_by: role_id,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "",
      total_level: total_complete_approval_level,
    });

    if (role_id == "15") {
      status = "APPROVED";
      is_final_approval = 1;
      flag = 1;
    }

    if (role_id == "15") {
      data = {
        approver_id: user_id,
        sequence: sequence,
        status: "Approve",
        is_final_approval: 1,
        flag: 1,
      };

      if (role_name === "SNF") {
        await approverModel.updateWorkflowRow(row.id, {
          status: status,
          remark: fnfApproveBtn,
          acted_by: role_id,
          acted_at: new Date(),
          is_final_approval: 1,
          fnf_flag: "",
          total_level: total_complete_approval_level,
        });

        await approverModel.nextapproval_action_user_id_SNF(application_id, 1, "Approved");

        await approverModel.updateApActionSNF(application_id, {
          ap_action_status: fnfApproveBtn === "YES" ? "APPROVED" : "REJECTED",
          ap_action_taken_at: new Date(),
          snf_takeover_allowed: 1
        });
      }

      

      await send_email_Approve(user_id);
    }

    await approverModel.updateApActionSNF(application_id,{
      ap_action_status: fnfApproveBtn === "YES" ? "APPROVED" : "REJECTED",
      ap_action_taken_at: new Date(),
      snf_takeover_allowed: 1
    });

    const distributor =
      await approverModel.getDistributorDetails(application_id);

    return res.status(200).json({
      type: "success",
      message: "Offboarding initiated Successfully",
    });
  } catch (error) {
    console.log("Initiate Offboard Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Sorry, there was some problem!",
    });
  }
};

const submitFnfForm = async (req, res) => {
  try {
    const { application_id } = req.body;

    if (!application_id) {
      return res.status(400).json({
        type: "error",
        message: "Application ID is required",
      });
    }

    const signedFnf = req.files?.signedFnf;
    const chequeUpload = req.files?.chequeUpload;

    if (!signedFnf) {
      return res.status(400).json({
        type: "error",
        message: "Signed F&F letter is required",
      });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (signedFnf && !allowedTypes.includes(signedFnf.type)) {
      return res.status(400).json({
        type: "error",
        message: "Signed F&F letter must be PDF or image file",
      });
    }

    if (chequeUpload && !allowedTypes.includes(chequeUpload.type)) {
      return res.status(400).json({
        type: "error",
        message: "Cheque must be PDF or image file",
      });
    }

    const signedFnfDir = path.join(
      __dirname,
      "../../public/uploads/signed_fnf",
    );
    const chequeDir = path.join(__dirname, "../../public/uploads/cheque");

    fs.mkdirSync(signedFnfDir, { recursive: true });
    fs.mkdirSync(chequeDir, { recursive: true });

    const signedFnfExt = path.extname(signedFnf.name);
    const signedFnfFilename = `signed_fnf_${application_id}_${Date.now()}${signedFnfExt}`;
    const signedFnfPath = path.join(signedFnfDir, signedFnfFilename);

    fs.copyFileSync(signedFnf.path, signedFnfPath);
    fs.unlinkSync(signedFnf.path);

    let chequeFilePath = null;
    if (chequeUpload) {
      const chequeExt = path.extname(chequeUpload.name);
      const chequeFilename = `cheque_${application_id}_${Date.now()}${chequeExt}`;
      const chequePath = path.join(chequeDir, chequeFilename);

      fs.copyFileSync(chequeUpload.path, chequePath);
      fs.unlinkSync(chequeUpload.path);

      chequeFilePath = `/uploads/cheque/${chequeFilename}`;
    }

    await approverModel.saveFnfSubmission({
      application_id,
      signed_fnf_path: `/uploads/signed_fnf/${signedFnfFilename}`,
      cheque_path: chequeFilePath,
      submission_date: new Date(),
    });
    const currentRow = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      "0",
      "0",
      "8",
    );
    const row = currentRow[0];
    // console.log(row, "row");
    let sequence = row.sequence;
    let last_approval_action_user_id = row.last_approval_action_user_id;
    // console.log(sequence, "sequence");
    // return
    if (!row) {
      return res.status(403).json({
        success: false,
        message: "This action is not pending for you",
      });
    }

    let status = "APPROVED";
    let flag = "";
    let is_final_approval = "1";
    let data = {};
    await approverModel.updateWorkflowRow(row.id, {
      status: status,
      remark: "",
      acted_by: 0,
      acted_at: new Date(),
      is_final_approval: is_final_approval,
      fnf_flag: "",
      total_level: "8",
    });

    await approverModel.insertWorkflowHistory({
      application_id,
      approver_id: "0",
      approver_role: "distributor",
      action: status,
      remarks: "",
    });

    const nextSequence = sequence + 2;
    const nextRow = await approverModel.getNextSequenceRow(
      application_id,
      nextSequence,
    );
    if (nextRow) {
      await approverModel.updateWorkflowRow(nextRow.id, {
        status: "PENDING",
        is_final_approval: "0",
      });
    }
    await approverModel.nextapproval_action_user_id(
      nextRow,
      "0",
      application_id,
      "",
      flag,
    );

    const userData = await ResignationModel.getUserById(nextRow.approver_id);
    const distributor = await approverModel.getDistributorDetailsrole(application_id);
    const offboardDetails = await approverModel.getOffboardEmailDetails(application_id);

   let obj = {};
    obj.sendToEmail = userData?.email_id;
    obj.firmName = distributor?.firmName; 
    obj.mars_code = distributor?.mars_code;
    obj.sendToName = userData?.employee_name;
    obj.employee_name = userData?.employee_name;
    obj.sendToName = userData?.employee_name;
    obj.employee_name = userData?.employee_name;
    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      obj.start_date = formatDate(offboardDetails?.start_date);
      obj.last_action_by = offboardDetails?.last_action_by;
      obj.last_action_date = formatDate(offboardDetails?.last_action_date);
      obj.application_id = application_id;

    let sac = mailer.sentEmailForOffboarding(obj, "APPROVED");
    await send_email_asm_info(application_id, distributor.territory_id, nextRow.approver_id);

    res.json({
      type: "success",
      message: "F&F form submitted successfully!",
    });
  } catch (error) {
    console.error("Submit FNF Form Error:", error);
    res.status(500).json({
      type: "error",
      message: "Server error. Please try again.",
    });
  }
};

const downloadFnfFile = async (req, res) => {
  try {
    const filename = req.params.filename;

    if (!filename) {
      return res.status(400).json({
        type: "error",
        message: "Filename is required",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../src/public/uploads/fnf",
      filename,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        type: "error",
        message: "File not found",
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).json({
          type: "error",
          message: "Error downloading file",
        });
      }
    });
  } catch (error) {
    console.error("Download file error:", error);
    return res.status(500).json({
      type: "error",
      message: "Server error",
    });
  }
};

const submitGstReversal = async (req, res) => {
  try {
    const { application_id, decision, remark = "" } = req.body;

    if (!application_id || !decision) {
      return res.status(400).json({
        type: "error",
        message: "Invalid request data",
      });
    }

    await approverModel.saveGstReversalDecision({
      application_id,
      decision,
      remarks: remark,
      role_name: req.cookies.role_name || "distributor",
    });

    const rows = await approverModel.checkOffboardingapprovedPDF(
      application_id,
      "0",
      "0",
      "6"
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({
        type: "error",
        message: "This action is not pending for you",
      });
    }

    const row = rows[0];

    if (decision === "decline") {

      await approverModel.updateWorkflowRow(row.id, {
        status: "REJECTED",
        remark: remark || "GST Reversal Declined",
        is_final_approval: "1",
      });

      await approverModel.insertWorkflowHistory({
        application_id,
        approver_id: "0",
        approver_role: "distributor",
        action: "REJECTED",
        remarks: remark || "GST Reversal Declined",
      });
      await approverModel.updateGstReversalColumn(application_id, 0);

      if (row.sequence > 1) {

        const prevSequence = row.sequence - 1;

        const prevRow = await approverModel.getNextSequenceRow(
          application_id,
          prevSequence
        );

        if (prevRow) {

          await approverModel.updateWorkflowRow(prevRow.id, {
            status: "PENDING",
            is_final_approval: "0",
          });

          await approverModel.nextapproval_action_user_idN(
            prevRow,
            "0",
            application_id,
            "",
            2
          );

          await send_email_sac_returned(prevRow.approver_id);
        }
      }
      
      return res.json({
        type: "success",
        message: "GST Reversal has been rejected",
      });
    }

    if (decision === "accept") {

      await approverModel.updateWorkflowRow(row.id, {
        status: "APPROVED",
        remark: "GST Reversal submitted",
        is_final_approval: "1",
      });
      await approverModel.updateGstReversalColumn(application_id, 2);

      await approverModel.insertWorkflowHistory({
        application_id,
        approver_id: "0",
        approver_role: "distributor",
        action: "APPROVED",
        remarks: "GST Reversal submitted",
      });

      const nextSequence = row.sequence + 1;

      const nextRow = await approverModel.getNextSequenceRow(
        application_id,
        nextSequence
      );

      if (nextRow) {
        await approverModel.updateWorkflowRow(nextRow.id, {
          status: "PENDING",
          is_final_approval: "0",
        });

        await approverModel.nextapproval_action_user_id(
          nextRow,
          "0",
          application_id,
          "",
          ""
        );
      }

      return res.json({
        type: "success",
        message: "GST Reversal submitted successfully",
      });
    }

  } catch (error) {
    console.error("GST Reversal Error:", error);
    return res.status(500).json({
      type: "error",
      message: "Server error",
    });
  }
};

module.exports = {
  offboardList,
  offboardApplicationViewById,
  SubmitApprover,
  offboardListEdit,
  offboardWebPage,
  offboardWebPageclearclearance,
  offboardWebpagereversal,
  offboardWebpagefnf,
  offboardInterviewcapture,
  initiateOffboardAsmaction,
  saveResignation,
  offboarddboffboardaction,
  submitNocUpload,
  offboardrsemoffboardaction,
  assettransfersubmit,
  claimSubmit,
  gstsubmit,
  saveAssetReconciliation,
  submitDbReplacement,
  FnfSubmit,
  zeroLedgerSubmit,
  blockDbSubmit,
  fnfApproveBtn,
  paymentSubmitBtn,
  submitDbResponse,
  submitDbResponseASM,
  downloadFnfFile,
  submitFnfForm,
  submitGstReversal,
  rsmInitialAction,
  snfPaymentSubmitBtn
};
