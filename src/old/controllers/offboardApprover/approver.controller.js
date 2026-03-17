const dashboard = require("../../models/dashboard.model");
const approverModel = require("../../models/offboardApprover/approver.model");
const ResignationModel = require("../../models/OffboardResignation/Resignation.model");
const mailer = require("../../util/offboarding_mail");

const offboardList = async (req, res) => {
  try {
    let data = await dashboard.selectQuery(req.cookies.email);
    let allDistributor = await approverModel.getDistributorList(
      req.cookies.role_id,
      req.cookies.region_id
    );
    let navbarviews = await dashboard.navbarviewesult(data);

    let notification = req.session.notification;

    delete req.session.notification;

    res.render("offboardApprover", {
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
      return res.redirect("/offboardApprover");
    }

    const user_id = req.cookies.user_id;

    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);

    let DistributorData = await approverModel.getDistributorData(
      application_id
    );

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
      req.cookies.region_id
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
        req.cookies.role_id
      );
      await ResignationModel.updateoOffboardingDistributorApproved(
        actionData.applicationId
      );
      const offboardHierarchyData = await ResignationModel.getoffboardHierarchy(
        user_id,
        actionData.applicationId,
        req.cookies.role_id
      );
      const NextApprover = await ResignationModel.getNextApprover(
        actionData.applicationId,
        offboardHierarchyData.sequence + 1
      );

      if (NextApprover[0]?.approver_id) {
        const userData = await ResignationModel.getUserById(
          NextApprover[0].approver_id
        );

        let obj = {};
        obj.sendToEmail = userData?.email_id;
        obj.firmName = Distributor[0]?.firmName;
        obj.userName = userName;
        obj.sendToName = userData?.employee_name;

        mailer.sentEmailForOffboarding(obj, "APPROVED");
      } else {
        const userData = await ResignationModel.getUserById(
          Distributor[0].initiator_id
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
        req.cookies.role_id
      );
      await ResignationModel.updateoOffboardingDistributor(
        actionData.applicationId
      );
      const asmData = await ResignationModel.getUserById(
        Distributor[0]?.initiator_id
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

module.exports = {
  offboardList,
  offboardApplicationViewById,
  SubmitApprover,
};
