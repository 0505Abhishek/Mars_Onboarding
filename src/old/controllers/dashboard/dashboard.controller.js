
const dashboard = require('../../models/dashboard.model');

const dashboardBackView = async (req, res, next) => {

    try {
        let userId = req.cookies.user_id;
        let email = req.cookies.email;

        let data = await dashboard.selectQuery(email);
        let navbarviews = await dashboard.navbarviewesult(data);

        res.render('dashboard', { token: navbarviews, user: res.userDetail, notification: res.notification });
    }
    catch (error) {
        console.log("error:- ", error);
        res.redirect("/");
    }
}


const dashboardOnboardView = async (req, res, next) => {
    try {
        let userId = req.cookies.user_id;
        let email = req.cookies.email;
        let regionIds = req.cookies.region_id;

        regionIds = regionIds ?.split(',') .map(id => Number(id.trim())).filter(id => !isNaN(id));

        let data = await dashboard.selectQuery(email);

        let onboardData = await dashboard.getOnboardData(regionIds);

        let totalActiveApplication = 0;
        let totalCorrectionApplication = 0;
        let totalDraftsApplication = 0;
        let totalCompleteApplication = 0;

        onboardData.forEach(element => {
            if (element?.type !== 'ONBOARDING') return;

            if (element.invite_send_flag == null) {
                totalDraftsApplication++;
            }

            if (element.flag == 3 &&  element.final_flag !== 1) {
                totalCorrectionApplication++;
            }

            if (element.final_flag !== 1 || element.final_flag == null) {
                totalActiveApplication++;
            }

            if (element.final_flag == '1') {
                totalCompleteApplication++;
            }
        });

        let navbarviews = await dashboard.navbarviewesult(data);

        res.render('dashboard/onboarding', {
            token: navbarviews,
            user: res.userDetail,
            notification: res.notification,
            onboardData,
            totalActiveApplication,
            totalCorrectionApplication,
            totalDraftsApplication,
            totalCompleteApplication
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send("Something went wrong");
    }
}


const dashboardOffboardView = async (req, res, next) => {

    try {
        let userId = req.cookies.user_id;
        let email = req.cookies.email;
        let regionIds = req.cookies.region_id;

        let data = await dashboard.selectQuery(email);

        let offboardData = await dashboard.getOffboardData(regionIds);
        let navbarviews = await dashboard.navbarviewesult(data);

         let totalActiveApplication = 0;
        let totalDraftsApplication = 0;
        let totalCompleteApplication = 0;

        offboardData.forEach(element => {

            if (element.offboard_flag !== 1) {
                totalActiveApplication++;
            }

            if (element.distributor_flag == 0) {
                totalDraftsApplication++;
            }

            if (element.offboard_flag == 1) {
                totalCompleteApplication++;
            }
        });

        res.render('dashboard/offboarding', { token: navbarviews, user: res.userDetail, notification: res.notification, offboardData, totalActiveApplication,
            totalDraftsApplication,
            totalCompleteApplication });
    }
    catch (error) {
        console.log("error:- ", error);
        res.redirect("/");
    }
}

module.exports = {
    dashboardBackView,
    dashboardOnboardView,
    dashboardOffboardView
}