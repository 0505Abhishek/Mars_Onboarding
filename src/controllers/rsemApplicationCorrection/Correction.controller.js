const correctionctrl = require("../../models/rsemApplicationCorrection/Correction.model");
const dashboard = require('../../models/dashboard.model');

const CorrectionView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await correctionctrl.getDistributorList(req.cookies.user_id);
    
          allDistributor.forEach((app) => {
            app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
        });
    
          let notification = req.session.notification || null;
          req.session.notification = null;
    
          req.session.save((err) => {
              if (err) console.error('Session save error:', err);
              res.render('rsemApplicationCorrection', { 
                  token: navbarviews, 
                  user: res.userDetail, 
                  notification: notification, 
                  distributors: allDistributor 
              });
          });
     }catch(error){
        console.error("DistributorListView Error:", error);
        next(error);  
     }


}

module.exports = {CorrectionView};