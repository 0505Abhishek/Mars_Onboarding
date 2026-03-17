const approveLead = require("../../models/approveLead/approveLead.model");
const dashboard = require('../../models/dashboard.model');
const editDistributor = require('../../models/editDistributor/editDistributor.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');

const approveLeadView = async(req,res)=>{
      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await approveLead.getDistributorList(req.cookies.user_id);
     
          let notification = req.session.notification || null;
          req.session.notification = null;
    
              res.render('approveLead', { 
                  token: navbarviews, 
                  user: res.userDetail, 
                  notification: notification, 
                  distributors: allDistributor 
              });
     }catch(error){
        console.error("DistributorListView Error:", error);
        res.redirect('/approve_lead');
     }
}



const approveLeadViewById = async(req,res)=>{
    try{
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    let distributor = await approveLead.getDistributorById(req.params.id, req.cookies.user_id);

    if(distributor.length==0)
    {
        req.session.notification = { type: 'warning', message: 'Can Not Access This Id !' };
        return res.redirect('/approve_lead');
    }
    if (distributor[0].flag === 3 || distributor[0].flag === 2) {
        let message = distributor[0].flag === 3 
            ? 'This lead requires need more information.'  
            : 'This lead has already been rejected.';  
    
        req.session.notification = { type: 'warning', message };
        return res.redirect('/approve_lead');
    }
    
    return res.render('approveLead/approveLeadApplication', { token: navbarviews, notification: res.notification, distributorData: distributor[0] });
    }catch(error){
        console.error("DistributorListView Error1:", error);
        res.redirect('/approve_lead');
    }
}


const Rsem_approval = async(req,res)=>{

   const { id, remark, action } = req.body; 

   let approvalData = await approveLead.approveLeadByRsem(id,req.cookies.user_id);
   let distributor = await approveLead.getDistributorById(id, req.cookies.user_id);
   console.log(distributor,"..............................................", id)
   const user_id = req.cookies.user_id;
   const role_name = req.cookies.role_name;
   const UserName = req.cookies.UserName;

   if (approvalData[0]?.status === 'Approved' && approvalData[0]?.is_final_approver === 1) {
       return res.json({ success: false, message: "Approval has already been granted." });
   }

   if ([2, 3].includes(distributor[0]?.flag)) {
        return res.json({ 
            success: false, 
            message: distributor[0]?.flag === 2 ? "The request has been already rejected." : "The request is already under Need more information." 
        });
   }

    
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);

    let distributorDetail = await editDistributor.getDistributorById(id);
    let userDetail = await approveLead.getUserById(distributorDetail[0].user_id);

    await editDistributor.insertProspectiveLog(distributor[0]);

    if(action==="Approved")
    { 
        await editDistributor.updateDistributorById(1,action, 1, id, req.cookies.user_id, 1, remark);
        await approveLead.updateProspectiveForRsem(1,id,remark);

        let emailObj= {sendToEmail: distributorDetail[0].aseemail, sendToName: userDetail.employee_name, sendByName: UserName, firmName: distributorDetail[0].firmName, SendToRole: userDetail.role};

        await mailer.sendEmail(emailObj, "approveLeadApproved");
        await insertApplicationHistory(id, user_id, role_name, 2, userDetail.id, userDetail.role, userDetail.employee_name, remark, "Approved", "Application Approved by the Rsem.");
    }
    
    else if(action==="Reject"){
        let distributor = await editDistributor.updateDistributorById(0,action, 2, id, req.cookies.user_id, 1, remark);
        await approveLead.updateProspectiveInfoForRejection('Rejected', 2,'RSEM', req.cookies.user_id, id, remark);

        let emailObj= {sendToEmail: distributorDetail[0].aseemail, sendToName: userDetail.employee_name, sendByName: UserName, firmName: distributorDetail[0].firmName, SendToRole: userDetail.role};

        await mailer.sendEmail(emailObj, "rejected");
        
        await insertApplicationHistory(id, user_id, role_name, 2, userDetail.id, userDetail.role, userDetail.employee_name, remark, "Rejected", "Application Rejected by the Rsem.");
    }
    
    else if(action==="Correction"){
        await approveLead.updateProspectiveInfo(action, 3,req.cookies.user_id,'RSEM', id, remark);

        let emailObj= {sendToEmail: distributorDetail[0].aseemail, sendToName: userDetail.employee_name, sendByName: UserName, firmName: distributorDetail[0].firmName, SendToRole: userDetail.role};

        await mailer.sendEmail(emailObj, "rsemCorrection");

        await insertApplicationHistory(id, user_id, role_name, 2, userDetail.id, userDetail.role, userDetail.employee_name, remark, "Correction", "Rsem ask for more information.");
        return res.json({ success: true, message: `Sent for Need More Information successfully` });
    }   

    if (distributorDetail.length === 0) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    
    return res.json({ success: true, message: `Lead ${action} successfully!` });
}


module.exports = {approveLeadView,approveLeadViewById, Rsem_approval};