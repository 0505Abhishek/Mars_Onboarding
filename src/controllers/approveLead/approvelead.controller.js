const approveLead = require("../../models/approveLead/approveLead.model");
const dashboard = require('../../models/dashboard.model');
const editDistributor = require('../../models/editDistributor/editDistributor.model');
const mailer = require('../../util/sent_mail');

const approveLeadView = async(req,res)=>{
      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await approveLead.getDistributorList(req.cookies.user_id);
     
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
        res.redirect('/approve_lead');
     }
}



const approveLeadViewById = async(req,res)=>{
    try{
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    let distributor = await approveLead.getDistributorById(req.params.id);

    if(distributor.length==0)
    {
        req.session.notification = { type: 'warning', message: 'Can Not Access This Id !' };
        return res.redirect('/approve_lead');
    }
    if (distributor[0].flag === 3 || distributor[0].flag === 2) {
        let message = distributor[0].flag === 3 
            ? 'This lead requires correction.'  
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
   let distributor = await approveLead.getDistributorById(id);


   if(approvalData[0].status == 'Approved' &&  approvalData[0].is_final_approver == 1)
   {
    return res.json({ success: false, message: `Already Approved` });
   }
   if(distributor[0].flag===3)
   {
    return res.json({ success: false, message: `Already is on Correction` });
   }

    
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);

    let distributorDetail = await editDistributor.getDistributorById(id);
    let userDetail = await approveLead.getUserById(distributorDetail[0].user_id);

    if(action==="Approved")
    {
        
        await editDistributor.insertProspectiveLog(distributor[0]);
        await editDistributor.updateDistributorById(1,action, 1, id, req.cookies.user_id, 1, remark);
        await approveLead.updateProspectiveForRsem(1,id,remark);
        await mailer.sendEmail(distributorDetail[0].aseemail, distributorDetail[0].firmName, userDetail.employee_name, userDetail.role, "approval");
    }
    
    else if(action==="Reject"){
        await editDistributor.insertProspectiveLog(distributor[0]);
        let distributor = await editDistributor.updateDistributorById(0,action, 2, id, req.cookies.user_id, 1, remark);
        await approveLead.updateProspectiveInfoForRejection(action, 2, req.cookies.user_id,'RSEM', id, remark);
        await mailer.sendEmail(distributorDetail[0].aseemail, distributorDetail[0].firmName, userDetail.employee_name, userDetail.role, "rejection");

    }
    
    else if(action==="Correction"){
        await editDistributor.insertProspectiveLog(distributor[0]);
        await approveLead.updateProspectiveInfo(action, 3,req.cookies.user_id,'RSEM', id, remark);
        await mailer.sendEmail(distributorDetail[0].aseemail, distributorDetail[0].firmName, userDetail.employee_name, userDetail.role, "correction");

    }   

    if (distributorDetail.length === 0) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    
    return res.json({ success: true, message: `Lead ${action} successfully!` });
}


module.exports = {approveLeadView,approveLeadViewById, Rsem_approval};