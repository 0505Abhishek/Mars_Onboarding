
const dashboard = require('../../models/dashboard.model');

const dashboardBackView = async (req, res, next) => {
   try{
    let userId = req.cookies.user_id;
    let email = req.cookies.email;
    let data = await dashboard.selectQuery(email);
    let navbarviews = await dashboard.navbarviewesult(data);

    res.render('dashboard',{ token: navbarviews, user: res.userDetail, notification: res.notification});
   }
   catch(error){
    console.log("error:- ",error);
    res.redirect("/");
   }
}



module.exports = {
    // dashboardView,
    dashboardBackView
}