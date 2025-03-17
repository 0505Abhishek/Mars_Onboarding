const express = require('express');

const dashboardRoute = require("../routes/dashboard/dashboard.route");
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
const path = require('path');
const router = express.Router();

const routes = [
    {
        path: '/',
        route: accountRoutes
    },
    {
        path: '/dashboard',
        route: dashboardRoute
    },
    {
        path: '/account',
        route: accountRoutes
    },
    {
        path: '/role_managment',
        route: roleManagmentRoutes
    },
    {
        path: '/add_distributor',
        route: addDistributor
    },
    {
        path: '/edit_distributor',
        route: editDistributor
    },
    {
        path: '/distributor_draft_list',
        route: distributorDraftList
    },
    {
        path:'/distributorList',
        route: distributorList
    },
    {
        path:'/rsem_application_correction',
        route: rsemApplicationCorrection
    },
    {
        path:'/approve_lead',
        route: approverLead
    },
    {
        path:'/lead_status',
        route: leadStatus
    },
    {
        path:'/approver_indox',
        route: approverIndox
    },
    {
        path:'/report',
        route: report
    }
];
routes.forEach((route) => {
    router.use(route.path, route.route);
});
module.exports = router;