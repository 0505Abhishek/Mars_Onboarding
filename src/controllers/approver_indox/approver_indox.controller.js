const approveIndox = require("../../models/approver_indox/approver_indox.model");
const dashboard = require('../../models/dashboard.model');

const approveIndoxView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await approveIndox.getDistributorList(req.cookies.user_id);
    
          allDistributor.forEach((app) => {
            app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
        });
    
          let notification = req.session.notification || null;
          req.session.notification = null;
    
          console.log(allDistributor);

          req.session.save((err) => {
              if (err) console.error('Session save error:', err);
              res.render('approver_Indox', { 
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


const approveViewById = async(req,res)=>{
  const id = req.params.id;
  console.log(id);
  let data = await dashboard.selectQuery(req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);
  
  let allDistributor = await approveIndox.getDistributorList(req.cookies.user_id);

  allDistributor.forEach((app) => {
    app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
});

  let notification = req.session.notification || null;
  req.session.notification = null;
  return res.render("approver_indox/approverIdView",{notification, token: navbarviews, 
    user: res.userDetail});
}

module.exports = {approveIndoxView, approveViewById};