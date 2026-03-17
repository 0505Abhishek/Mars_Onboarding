
const dashboard = require('../../models/super_account.model');
const navbar = require('../../models/super_navbar.model');
const { decryptData } = require("../../util/encryption");

const dashboardBackView = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let obj = {}
        obj['email'] = email;

        let data = await dashboard.selectQuery(obj);
               
        let navbarviews = await navbar.navbarviewesult(data);
        return res.render('super_dashboard', { token: navbarviews, user: res.userDetail,
            success: req.session.success,
            error: req.session.error,
            notification: res.notification, });

    }
    catch (e) {
        console.log("error:- ", e);
        return res.redirect("/");
    }
}
  


module.exports = {
    // dashboardView,
    dashboardBackView
}