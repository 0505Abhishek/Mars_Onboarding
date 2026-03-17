const express = require("express");

const dashboardRoute = require("../routes/dashboard/dashboard.route");
const SuperDashboardRoute = require("../routes/super_dashboard/dashboard.route");
const roleManagmentRoutes = require("./roleManagmentRoute/roleManagement");
const accountRoutes = require("./account/account.route");
const addDistributor = require("../routes/add_distributor/add_distributor.route");
const editDistributor = require("../routes/editDistributor/editDistributor.route");
const distributorDraftList = require("../routes/distributor_draft_list/distributor_draft_list.route");
const distributorList = require("../routes/distributorList/distributorList.route");
const rsemApplicationCorrection = require("../routes/rsemApplicationCorrection/rsemApplicationCorrection.route");
const approverLead = require("../routes/approveLead/approveLead.route");
const leadStatus = require("../routes/lead_status/lead_status.route");
const approverIndox = require("../routes/approvers_indox/approvers_indox.route");
const report = require("../routes/report/report.route");
const correction = require("../routes/correction/correction.route");
const correctionPage = require("../routes/correctionPage/correctionPage.route");

const webPage = require("../routes/webPage/webPage.route");
const thankYou = require("../routes/thankYou/thankYou.route");
const CURRENT_STATUS = require("../routes/current_status/current_status.route");
const offboard_status = require("../routes/offboardingStatus/offboardingStatus.route");

const dbManagmentRoutes = require("../routes/super_dbManagment/dbManagment.route.js");
const offdbManagmentRoutes = require("../routes/super_dbManagment/offdbManagment.route.js");

const user_managment_route = require("../routes/super_user_management/user_managament.route.js");
const region_route = require("../routes/super_region/region.route.js");
const territory_route = require("../routes/super_territory/territory.route.js");
const channel_route = require("../routes/super_channel/channel.route.js");
const tab_route = require("../routes/super_tab/tab.route.js");
const roleSelectorCtrl = require("../routes/roleSelector/roleSelector.route.js");

const so_route = require("../routes/so_route/so_route.route.js");
const superdbReport = require("../routes/super_db_report/super_db_report.route.js");

const newoffboardApprover = require("../routes/offboardApprover/newapprover.route.js");
const newoffboardApproverview = require("../routes/offboardApprover/newapprover.route.js");

const webpageView = require("../routes/offboardApprover/newapprover.route.js");
const webpageclearclearance = require("../routes/offboardApprover/newapprover.route.js");
const webpagereversal = require("../routes/offboardApprover/newapprover.route.js");
const webpagefnf = require("../routes/offboardApprover/newapprover.route.js");
const interviewCapture = require("../routes/offboardApprover/newapprover.route.js");
const dbOffboardAction = require("../routes/offboardApprover/newapprover.route.js");
const router = express.Router();

const routes = [
  {
    path: "/",
    route: accountRoutes,
  },
  {
    path: "/dashboard",
    route: dashboardRoute,
  },
  {
    path: "/SuperDashboard",
    route: SuperDashboardRoute,
  },
  {
    path: "/account",
    route: accountRoutes,
  },
  {
    path: "/role_managment",
    route: roleManagmentRoutes,
  },
  {
    path: "/add_distributor",
    route: addDistributor,
  },
  {
    path: "/edit_distributor",
    route: editDistributor,
  },
  {
    path: "/distributor_draft_list",
    route: distributorDraftList,
  },
  {
    path: "/distributorList",
    route: distributorList,
  },
  {
    path: "/dbOffboardAction",
    route: dbOffboardAction,
  },
  {
    path: "/rsem_application_correction",
    route: rsemApplicationCorrection,
  },
  {
    path: "/approve_lead",
    route: approverLead,
  },
  {
    path: "/lead_status",
    route: leadStatus,
  },
  {
    path: "/approver_indox",
    route: approverIndox,
  },
  {
    path: "/report",
    route: report,
  },
  {
    path: "/correction",
    route: correction,
  },
  {
    path: "/correctionPage",
    route: correctionPage,
  },
  {
    path: "/webpageclearclearance",
    route: webpageclearclearance,
  },
  {
    path: "/webPage",
    route: webPage,
  },
  {
    path: "/webpagereversal",
    route: webpagereversal,
  },
  {
    path: "/webpagefnf",
    route: webpagefnf,
  },
  {
    path: "/interviewCapture",
    route: interviewCapture,
  },
  {
    path: "/thankYou",
    route: thankYou,
  },
  {
    path: "/newoffboardApprover",
    route: newoffboardApprover,
  },
  {
    path: "/webpageView",
    route: webpageView,
  },
  {
    path: "/newoffboardApproverview",
    route: newoffboardApproverview,
  },
  {
    path: "/CURRENT_STATUS",
    route: CURRENT_STATUS,
  },
  {
    path: "/offboard_status",
    route: offboard_status,
  },
  {
    path: "/db_managment",
    route: dbManagmentRoutes,
  },
  {
    path: "/off_db_managment",
    route: offdbManagmentRoutes,
  },
  {
    path: "/user_management",
    route: user_managment_route,
  },
  {
    path: "/region",
    route: region_route,
  },
  {
    path: "/territory",
    route: territory_route,
  },
  {
    path: "/so",
    route: so_route,
  },
  {
    path: "/channel",
    route: channel_route,
  },
  {
    path: "/tab",
    route: tab_route,
  },
  {
    path: "/roleSelector",
    route: roleSelectorCtrl,
  },
  {
    path: "/superdbReport",
    route: superdbReport,
  },
];
routes.forEach((route) => {
  router.use(route.path, route.route);
});
module.exports = router;
