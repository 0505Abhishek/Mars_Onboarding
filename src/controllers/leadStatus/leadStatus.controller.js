const dashboard = require('../../models/dashboard.model');
const leadStatusModel = require("../../models/leadStatus/leadStatus.model");

const leadStatusView = async (req, res, next) => {
  try {
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);
      
      let allDistributor = await leadStatusModel.getDistributorList(req.cookies.user_id);

      allDistributor.forEach((app) => {
        app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
    });

      let notification = req.session.notification || null;
      req.session.notification = null;

      req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          res.render('LeadStatus', { 
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


const leadDistributroView = async(req,res)=>{
     let a = req.param.id;
     let data = await dashboard.selectQuery(req.cookies.email);
     let navbarviews = await dashboard.navbarviewesult(data);
     let notification = req.session.notification || null;
     req.session.notification = null;
     return res.render('LeadStatus/LeadDistributor',{ token: navbarviews, user: res.userDetail, notification: notification, distributors:[]})
}

module.exports = {
    leadStatusView,
    leadDistributroView
}