const approveIndox = require("../../models/approver_indox/approver_indox.model");
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');

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
        

          req.session.save((err) => {
              if (err) console.error('Session save error:', err);
              return res.render('approver_Indox', { 
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
  try{
  const application_id = req.params.id;

  let data = await dashboard.selectQuery(req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);
  
  let Distributor = await approveIndox.getDistributorByApplication(req.cookies.user_id, application_id);

  if(Distributor[0].is_final_approver === 1 || Distributor[0].flag === 3 || Distributor[0].lower_pending == 1)
    {
      if (Distributor[0].is_final_approver == 1) {
        req.session.notification = { type: 'warning', message: 'Application has already been approved.' };
        } else if (Distributor[0].flag === 3) {
            req.session.notification = { type: 'warning', message: 'Application is already under correction.' };
        }
        else if(Distributor[0].lower_pending == 1)
        {
          req.session.notification = { type: 'warning', message: 'You Can not Approve the application .' };
        }
        
        return res.redirect("/approver_indox");      
    }

  let notification = req.session.notification || null;
  req.session.notification = null;
  return res.render("approver_indox/approverIdView",{notification, token: navbarviews, 
    user: res.userDetail, applicationID: application_id, distributor:Distributor[0]});
  }
  catch(error)
  {
    console.log(error,"........error........");
    return res.redirect("/approver_indox");
  }
}
const submitApproveById = async (req, res) => {
  try {
      let data = req.body;
      let applicationId = req.params.id;
      let user_id = req.cookies.user_id;

      let allDistributor = await approveIndox.getDistributorByApplication(user_id, applicationId);
      let userdata = await approveIndox.getUserById(user_id);

      if(allDistributor[0].is_final_approver == 1 || allDistributor[0].flag === 3)
        {
          if (allDistributor[0].is_final_approver == 1){
          notification = 'Applicationn has already approved.';
          }
          else if(allDistributor[0].flag === 3){
          notification = 'Applicationn has already on correction.';
          }
          return res.status(400).json({ message: notification });
        }

      if(data.status ==='correction')
      {
        await approveIndox.mainCorrection(req.params.id, req.body);
        await approveIndox.updateProspectiveInfo('Correction', 3, user_id, applicationId, data.overallremark);
        await mailer.sendEmail(allDistributor[0].aseemail, allDistributor[0].firmName, userdata[0].employee_name, userdata[0].role, "correction");
      }
      else if(data.status ==='approve')
      {
        await approveIndox.updateApproval('Approved',user_id, applicationId, data.overallremark);

        if(allDistributor[0].final_approver === user_id)
        {
          await approveIndox.updateProspectiveFinal(user_id, applicationId);
          await mailer.sendEmail(userdata[0].email_id, allDistributor[0].firmName, userdata[0].employee_name, userdata[0].role, "approval");
        }

        let nextAprover = await approveIndox.getNextApprover(applicationId);
        let userdata = await approveIndox.getUserById(nextAprover);

        await mailer.sendEmail(userdata[0].email_id, allDistributor[0].firmName, userdata[0].employee_name, userdata[0].role, "approval");
      }
      else if (data?.status === 'reject')
      {
        await approveIndox.updateProspectiveInfoForRejection('Rejected', 2, user_id, data.overallremark, applicationId);
        await approveIndox.updateApprovalReject('Rejected', user_id, applicationId, data.overallremark);

        await mailer.sendEmail(allDistributor[0].aseemail, allDistributor[0].firmName, userdata[0].employee_name, userdata[0].role, "rejected");
      }  
      return res.status(200).json({ message: "Approval processed successfully." });
  } catch (error) {
      console.error("Error in submitApproveById:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {approveIndoxView, approveViewById, submitApproveById};