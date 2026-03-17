const approveIndox = require("../../models/approver_indox/approver_indox.model");
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory, insertApplicationHistory1} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');

const approveIndoxView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await approveIndox.getDistributorList(req.cookies.user_id, req.cookies.role_id);
    
          allDistributor.forEach((app) => {
            app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
        });
        
          let notification = req.session.notification || null;
          req.session.notification = null;
        
              return res.render('approver_indox', { 
                  token: navbarviews, 
                  user: res.userDetail, 
                  notification: notification, 
                  distributors: allDistributor 
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
  
  let Distributor = await approveIndox.getDistributorByApplication(req.cookies.role_id, application_id);
  let applicationHistory = await approveIndox.getApplicationHistory(application_id); 


  if(Distributor[0].is_final_approver === 1 || Distributor[0].flag === 3 ||  Distributor[0].flag === 2  || Distributor[0].lower_pending == 1)
    {
      if (Distributor[0].is_final_approver == 1) {
        req.session.notification = { type: 'warning', message: 'Application has already been approved.' };
        } else if (Distributor[0].flag === 3) {
            req.session.notification = { type: 'warning', message: 'Application is already under correction.' };
        }
        else if(Distributor[0].lower_pending == 1)
        {
          req.session.notification = { type: 'warning', message: 'You Can not Approve the application .' };
        }else if (Distributor[0].flag === 2) {
          req.session.notification = { type: 'warning', message: 'Application has been rejected you can not take any action' };
        }
        
        return res.redirect("/approver_indox");      
    }

  let notification = req.session.notification || null;
  req.session.notification = null;

  return res.render("approver_indox/approverIdView",{notification, token: navbarviews, 
    user: res.userDetail, token: navbarviews, applicationID: application_id, distributor:Distributor[0], applicationHistory});
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
      const user_id = req.cookies.user_id;
      const role_name = req.cookies.role_name;
      const UserName = req.cookies.UserName;
      const roleId = req.cookies.role_id;

      let allDistributor = await approveIndox.getDistributorByApplication(user_id, applicationId);
      let userdata = await approveIndox.getUserById(user_id);
      let asmUserdata = await approveIndox.getUserById(allDistributor[0].user_id);


      if(allDistributor[0].is_final_approver == 1 || allDistributor[0].flag === 3)
        {
          if (allDistributor[0].is_final_approver == 1){
          notification = 'Applicationn has already approved.';
          }
          else if(allDistributor[0].flag === 3){
          notification = 'Applicationn has already on correction.';
          }else if(allDistributor[0].flag === 2){
            notification = 'Application has already rejected.';
          }
          return res.status(400).json({ message: notification });
        }

      if(data.status ==='correction')
      {
        await approveIndox.mainCorrection(req.params.id, req.body);
        await approveIndox.updateProspectiveInfo('Correction', 3, user_id, applicationId, data.overallremark);

        let emailObj= {sendToEmail: allDistributor[0].aseemail, sendToName: asmUserdata[0].employee_name, firmName: allDistributor[0].firmName};
        await mailer.sendEmail(emailObj, "correction");

        await insertApplicationHistory(applicationId, user_id, role_name, 0, asmUserdata[0].id, asmUserdata[0].role, asmUserdata[0].employee_name, data.overallremark, "Correction", `Ask For Correction by ${role_name}`);

      }
      else if(data.status ==='approve')
      {
        await approveIndox.updateApproval('Approved',user_id, applicationId, data.overallremark, data, roleId);

        if(allDistributor[0].final_approver == user_id)
        {
          await approveIndox.updateProspectiveFinal(user_id, applicationId);
          let userdata = await approveIndox.getUserById(user_id);

          let allEmails= await getAllEmails(allDistributor[0].total_approval_action_user_ids, allDistributor[0].user_id, user_id);

          let emailObj= {sendToEmail: asmUserdata[0].email_id, sendCcEmail: allEmails, sendToName: asmUserdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName};

          await mailer.sendEmail(emailObj, "Finalapproval");

          await insertApplicationHistory(applicationId, user_id, role_name, 0, userdata[0].id, userdata[0].role, userdata[0].employee_name, data.overallremark, "Approved", `${role_name} has approved the application`);

          return res.status(200).json({ message: "Approval processed successfully." });
        }

        let nextAprover = await approveIndox.getNextApprover(applicationId);
        let userdata = await approveIndox.getUserById(nextAprover);

        let emailObj= {sendToEmail: userdata[0].email_id, sendToName: userdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName};

        await mailer.sendEmail(emailObj, "approval");
        await insertApplicationHistory(applicationId, user_id, role_name, 0, userdata[0].id, userdata[0].role, userdata[0].employee_name, data.overallremark, "Approved", `${role_name} has approved the application`);

      }
      else if (data?.status === 'reject')
      {
        await approveIndox.updateProspectiveInfoForRejection('Rejected', 2, user_id, data.overallremark, applicationId);
        await approveIndox.updateApprovalReject('Rejected', user_id, applicationId, data.overallremark);

        let emailObj= {sendToEmail: allDistributor[0].aseemail, sendToName: asmUserdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName};

        await mailer.sendEmail(emailObj,"rejected");
        
        await insertApplicationHistory(applicationId, user_id, role_name, 0, asmUserdata[0].id, asmUserdata[0].role, asmUserdata[0].employee_name, data.overallremark, "Rejection", `${role_name} has reject the applicatiobn`);

      }  
      return res.status(200).json({ message: "Approval processed successfully." });
  } catch (error) {
      console.error("Error in submitApproveById:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};



const getByHierarchyRole = async (req, res, next) => {
  try {
    const userId = req.cookies.user_id;
    const forwardedTo = req.query.forwardedTo; 

    let allDistributor = await approveIndox.getListByHierarchyRole(userId,forwardedTo);

    if(allDistributor.length==0)
    {
      allDistributor=[];
    }
    res.json({ data: allDistributor });
  } catch (error) {
    console.error("DistributorListView Error:", error);
    next(error);
  }
};



const getAllEmails = async (allIds, asm_id, user_id) => {
  const allEmail = [];

  if (typeof allIds === "string") {
    try {
      allIds = JSON.parse(allIds);
    } catch (err) {
      console.error("Invalid JSON string for allIds:", err);
      return;
    }
  }

  for (let i = 0; i < allIds.length; i++) {
    const currentId = allIds[i];
    if (String(currentId) !== String(asm_id) && String(currentId) !== String(user_id)) {
      let userdata = await approveIndox.getUserById(currentId);
      if (userdata?.[0]?.email_id) {
        allEmail.push(userdata[0].email_id);
      }
    }
  }

  return allEmail;
};



module.exports = {approveIndoxView, approveViewById, submitApproveById, getByHierarchyRole};