const correctionctrl = require("../../models/rsemApplicationCorrection/Correction.model");
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');

const CorrectionView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
          let allDistributor = await correctionctrl.getDistributorList(req.cookies.user_id);
    
          allDistributor.forEach((app) => {
            app.canApprove = app.lower_pending === 0 && app.is_final_approver === 0 && app.applicationStatus === 'Correction' && app.role_name === 'ASM';
        });
    
          let notification = req.session.notification || null;
          req.session.notification = null;
    
          req.session.save((err) => {
              if (err) console.error('Session save error:', err);
              res.render('rsemApplicationCorrection', { 
                  token: navbarviews, 
                  user: res.userDetail, 
                  notification: notification, 
                  distributors: allDistributor||[] 
              });
          });
     }catch(error){
        console.error("DistributorListView Error:", error);
        res.redirect('/Add_distributor'); 
     }
}

const updateDistributor = async(req,res)=>{

    let distributor = await correctionctrl.getDistributorById(req.query.id, req.cookies.email);
    let userDetail = await correctionctrl.getUserById(req.cookies.user_id);

    const user_id = req.cookies.user_id;

    if(distributor.length==0)
    {
        req.session.notification = { type: 'warning', message: 'Invite sent to RSEM UnSuccessfully !' };
        return res.redirect('/rsem_application_correction'); 
    }

    if (distributor[0].flag === 2 || distributor[0].flag === 0) {
        let message = distributor[0].flag === 0 
            ? 'This lead is on pending.'  
            : 'This lead has already been rejected.';  
    
        req.session.notification = { type: 'warning', message };
        return res.redirect('/rsem_application_correction');
    }

    if(distributor.length>0)
   {
        const data = req.body;
        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;
        data.aseemail=aseemail;
        data.user_id=user_id;
        data.flag='0';
        data.applicationStatus = 'Pending';
        data.approval_role = 'ASM';
        data.approver_id = userDetail[0].id;

        const result = await correctionctrl.updateDistributor(data,req.query.id);
        let distributor = await correctionctrl.updateApprovalWorkFlow('Pending', '0', req.query.id);

        let distributorData = await correctionctrl.getDistributorById(req.query.id, req.cookies.email);

        const hierarchy = distributorData[0]?.total_approval_action_user_ids;
        const array = JSON.parse(hierarchy);
        let hierarchyData = await correctionctrl?.getUserById(array[0]);

        await mailer.sendEmail(hierarchyData[0]?.email_id, distributorData[0]?.firmName, hierarchyData[0]?.employee_name, hierarchyData[0]?.role, "correction");
        
        req.session.notification = { type: 'success', message: 'Invite sent to RSEM Successfully!' };
        return res.redirect('/rsem_application_correction');
   }

   return res.redirect('/rsem_application_correction');

}

const  CorrectionDistributorView = async(req,res)=>{
        try{   
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let distributor = await correctionctrl.getDistributorById(req.params.id, req.cookies.email);

        res.render('rsemApplicationCorrection/rsemApplication', { token: navbarviews, notification: res.notification, distributorData: distributor[0] });
        req.session.notification = null;
      }catch(error)
      {
        console.log(error,"error");
        req.session.notification = { type: 'warning', message: 'Sorry You Can not Access this user Id !' };
        return res.redirect("/rsem_application_correction");
      }
}


const CorrectionDistributorUpdate = async(req,res)=>{
    try {
        let { id } = req.body;
        let reqBody = req.body;

        if (!id) {
            return res.status(400).send("Distributor ID is required");
        }

        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;
        reqBody.aseemail=aseemail;
        reqBody.user_id=user_id;

        await correctionctrl.updateDistributor(reqBody, id);

        return res.status(200).send("Draft saved successfully!");
    } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).send("Error saving draft");
    }
}

module.exports = {CorrectionView, CorrectionDistributorView, CorrectionDistributorUpdate, updateDistributor};
