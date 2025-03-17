const approveLead = require("../../models/approveLead/approveLead.model");
const dashboard = require('../../models/dashboard.model');
const editDistributor = require('../../models/editDistributor/editDistributor.model');

const approveLeadView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await approveLead.getDistributorList(req.cookies.user_id);
    
          allDistributor.forEach((app) => {
            app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
        });
    
          let notification = req.session.notification || null;
          req.session.notification = null;
    
          req.session.save((err) => {
              if (err) console.error('Session save error:', err);
              res.render('approveLead', { 
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



const approveLeadViewById = async(req,res)=>{
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    console.log(req.params.id,"req.params.id");
    let distributor = await editDistributor.getDistributorById(req.params.id, req.cookies.email);
    return res.render('approveLead/approveLeadApplication', { token: navbarviews, notification: res.notification, distributorData: distributor[0] });
}

module.exports = {approveLeadView,approveLeadViewById};