const approveIndox = require("../../models/approver_indox/approver_indox.model");
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory, insertApplicationHistory1} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');
const leadStatusModel = require("../../models/leadStatus/leadStatus.model");

const approveIndoxView = async(req,res)=>{

    try {
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        
        let allDistributor = await approveIndox.getDistributorList(req.cookies.user_id, req.cookies.role_id, req.cookies.region_id);
        
        console.log(req.cookies.region_id);
        
        let regions = await approveIndox.getRegion(req.cookies.user_id);
        let territory = await approveIndox.getTerritory(req.cookies.user_id);
        allDistributor.forEach((app) => {
          app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
      });
      
        let notification = req.session.notification || null;
        req.session.notification = null;
      
            return res.render('approver_indox', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification: notification, 
                distributors: allDistributor ,
                regions,
                territory
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
      const cfaList = await approveIndox.getCfaList();

      let CdCodeAndMargin = await approveIndox.getCdCodeAndMargin(application_id);
      let submittedCfaList = await approveIndox.getsubmittedCfa(application_id);

      let notification = req.session.notification || null;
      req.session.notification = null;

      return res.render("approver_indox/approverIdView",{notification, token: navbarviews, 
        submittedCfaList, cfaList, user: res.userDetail, token: navbarviews, applicationID: application_id, distributor:Distributor[0], applicationHistory, CdCodeAndMargin});
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
      const region_id = req.cookies.region_id;

      let allDistributor = await approveIndox.getDistributorByApplication(roleId, applicationId);

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


    if (
      allDistributor[0].is_final_approver === 1 ||
      allDistributor[0].flag === 3 ||
      allDistributor[0].flag === 2 ||
      allDistributor[0].lower_pending == 1
    ) {
      let message = '';
      if (allDistributor[0].is_final_approver == 1) {
        message = 'Application has already been approved.';
      } else if (allDistributor[0].flag === 3) {
        message = 'Application is already under correction.';
      } else if (allDistributor[0].lower_pending == 1) {
        message = 'You cannot approve the application.';
      } else if (allDistributor[0].flag === 2) {
        message = 'Application has been rejected. You cannot take any action.';
      }

      return res.status(400).json({ status: "error", message });
    }



      if(data.status ==='correction')
      {
        let data = req.body;

        await approveIndox.mainCorrection(req.params.id, req.body);
        await approveIndox.updateProspectiveInfo('Correction', 3, user_id, applicationId, data.overallremark);

        let emailObj= {sendToEmail: allDistributor[0].aseemail, sendToName: asmUserdata[0].employee_name, firmName: allDistributor[0].firmName, remark: data?.overallremark};
        await mailer.sendEmail(emailObj, "correction");

        let fields = JSON.stringify(data.fields); 

        await insertApplicationHistory(applicationId, user_id, role_name, 0, asmUserdata[0].id, asmUserdata[0].role, asmUserdata[0].employee_name, data.overallremark, "Correction", `Ask For Correction by ${role_name}`, fields);

      }
      else if(data.status ==='approve')
      {

        await approveIndox.updateApproval('Approved',user_id, applicationId, data.overallremark, data, roleId);

        if(allDistributor[0].final_approver == user_id || roleId == 9)
        {
          await approveIndox.updateProspectiveFinal(user_id, applicationId);
          let userdata = await approveIndox.getUserById(user_id);

          let allEmails= await getAllEmails(allDistributor[0].total_approval_action_user_ids, allDistributor[0].user_id, user_id);

          let AllEmailsToSend = await approveIndox.getAllEmailsToSend(userdata[0].role_id, region_id);
  
          let emailList = AllEmailsToSend.map(row => row.email_id);

          let emailObj= {sendToEmail: emailList, sendCcEmail: allEmails, sendToName: asmUserdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName, remark:data?.overallremark, SendToRole: userdata.role};

          await mailer.sendEmail(emailObj, "Finalapproval");

          await insertApplicationHistory(applicationId, user_id, role_name, 0, userdata[0].id, userdata[0].role, userdata[0].employee_name, data.overallremark, "Approved", `${role_name} has approved the application`);

          return res.status(200).json({ status: "success", message: "Approval submitted successfully." });
        }

        let nextAprover = await approveIndox.getNextApprover(applicationId);
        let userdata = await approveIndox.getUserById(nextAprover);
        let AllEmailsToSend = await approveIndox.getAllEmailsToSend(userdata[0].role_id, region_id);

        let emailList = AllEmailsToSend.map(row => row.email_id);
        let emailObj= {sendToEmail: emailList, sendToName: userdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName, remark: data?.overallremark, SendToRole: userdata[0].role};


        await mailer.sendEmail(emailObj, "approval");
        await insertApplicationHistory(applicationId, user_id, role_name, 0, userdata[0]?.id, userdata[0]?.role, userdata[0]?.employee_name, data?.overallremark, "Approved", `${role_name} has approved the application`);

      }
      else if (data?.status === 'reject')
      {
        await approveIndox.updateProspectiveInfoForRejection('Rejected', 2, user_id, data.overallremark, applicationId);
        await approveIndox.updateApprovalReject('Rejected', user_id, applicationId, data.overallremark);

        let emailObj= {sendToEmail: allDistributor[0].aseemail, sendToName: asmUserdata[0].employee_name, sendByName:UserName, firmName: allDistributor[0].firmName, remark:data?.overallremark};

        await mailer.sendEmail(emailObj,"rejected");
        
        await insertApplicationHistory(applicationId, user_id, role_name, 0, asmUserdata[0].id, asmUserdata[0].role, asmUserdata[0].employee_name, data.overallremark, "Rejection", `${role_name} has reject the applicatiobn`);

      }  
      return res.status(200).json({ status: "success", message: "Submitted successfully." });
  } catch (error) {
      console.error("Error in submitApproveById:", error);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


const getByHierarchyRole = async (req, res, next) => {
  try {
    const userId = req.cookies.user_id;
    const roleId = req.cookies.role_id;

    const forwardedTo = req.query.forwardedTo;
    let allDistributor;

    if(forwardedTo == 0)
    {
        allDistributor = await approveIndox.getCorrectionData(forwardedTo, roleId, userId);
        return res.json({ data: allDistributor });
    }
    
     allDistributor = await approveIndox.getListByHierarchyRole(forwardedTo, roleId, userId);

    if(allDistributor.length==0)
    {
      allDistributor=[];
    }
    return res.json({ data: allDistributor });
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

const TerritoryByRegion = async (req, res) => {
  try {
    const region = req.query.region;
    const territory = await leadStatusModel.getTerritoryByRegion(req.cookies.user_id, region);
    const DistributorFilterList = await leadStatusModel.getDistributorFilterList(req.cookies.user_id, req.cookies.email, region);

    
    res.json({ territories: territory, distributors: DistributorFilterList});
  } catch (error) {
    console.error('Error fetching territories1:', error);
    res.json({ territories: [] });
  }
}


module.exports = {approveIndoxView, approveViewById, submitApproveById, getByHierarchyRole, TerritoryByRegion};