const navbar = require('../../models/super_navbar.model');
const superdbReport = require('../../models/super_db_report/super_db_report.model');
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { decryptData } = require("../../util/encryption");
const { log } = require('console');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

const superDbReportPage = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        let getdbdata = await superdbReport.getdata();
        
        res.render('super_db_report', {
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: res.userDetail,
            getdbdata: getdbdata
        });
        req.session.destroy();
    } catch (error) {
        console.log("error:- ", error);
        return res.redirect("/dashboard");
    }
};

module.exports = {
    superDbReportPage
};
