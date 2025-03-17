
const dashboard = require('../../models/dashboard.model');

const dashboardBackView = async (req, res, next) => {
   
  let data = await dashboard.selectQuery(req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);

    res.render('dashboard',{ token: navbarviews, user: res.userDetail, notification: res.notification});

}



module.exports = {
    // dashboardView,
    dashboardBackView
}