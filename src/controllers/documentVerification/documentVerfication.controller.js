const dashboard = require('../../models/dashboard.model');
const distributorListModel = require("../../models/documentVerification/documentVerification.model");

const DocumentVerificationView = async (req, res, next) => {
  try {
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);
      
      let allDistributor = await distributorListModel.getDistributorList(req.cookies.user_id);

      allDistributor.forEach((app) => {
        app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
    });

      let notification = req.session.notification || null;
      req.session.notification = null;

      req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          res.render('distributorList', { 
              token: navbarviews, 
              user: res.userDetail, 
              notification: notification, 
              distributors: allDistributor 
          });
      });

  } catch (error) {
      console.error("DistributorListView Error:", error);
      next(error);  
  }
};



const getApplications = async (req, res) => {
    try {
        const userId = req.cookies.user_id;
        const applications = await approvalModel.getApplicationsForUser(userId);

        applications.forEach((app) => {
            app.canApprove = app.lower_pending === 0; 
        });

        res.json({ applications });
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const DocumentVerificationApplication = async(req,res)=>{
       let a = req.param.id;
       let data = await dashboard.selectQuery(req.cookies.email);
       let navbarviews = await dashboard.navbarviewesult(data);
       let notification = req.session.notification || null;
       req.session.notification = null;
       return res.render('distributorList/documentVerificationApplication',{ token: navbarviews, user: res.userDetail, notification: notification, distributors:[]})
}

module.exports = {
    DocumentVerificationView,
    DocumentVerificationApplication
}