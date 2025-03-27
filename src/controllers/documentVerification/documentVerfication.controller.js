const dashboard = require('../../models/dashboard.model');
const distributorListModel = require("../../models/documentVerification/documentVerification.model");
const mailer = require('../../util/sent_mail');

const DocumentVerificationView = async (req, res, next) => {
  try {
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);
      
      let allDistributor = await distributorListModel.getDistributorList(req.cookies.user_id);
      
      allDistributor.forEach((app) => {
        app.canApprove = app.lower_pending === 0 && app.is_final_approver !== 1;
     });

      let notification = req.session.notification || null;
      req.session.notification = null;

      req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          res.render('distributorList', { 
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


const DocumentVerificationApplication = async(req,res)=>{
    try{
       let a = req.params.id;
       let data = await dashboard.selectQuery(req.cookies.email);
       let navbarviews = await dashboard.navbarviewesult(data);
       let notification = req.session.notification || null;
       req.session.notification = null;
       let distributorList = await distributorListModel.distributorDetail(a);

       if(distributorList.length==0)
        {
            req.session.notification = { type: 'warning', message: 'Can Not Access This Id !' };
            return res.redirect('/distributorList');
        }

       if (distributorList[0].flag === 3 || distributorList[0].flag === 2 || distributorList[0].applicationPhase_Flag == 0) {
        let message = distributorList[0].flag === 3 
            ? 'This lead requires correction.'  
            : distributorList[0].flag === 2 
            ? 'This lead has already been rejected.'  
            : 'You can not access this application.';
        req.session.notification = { type: 'warning', message };
        return res.redirect('/distributorList');
    }

       return res.render('distributorList/documentVerificationApplication',{ token: navbarviews, user: res.userDetail, notification: notification, application_id: a, distributor:distributorList[0]})
    }
    catch(error){
      console.log(error);
      return res.redirect('/distributorList');

    }
}

const SubmitDocumentVerification = async (req, res) => {
    try {
        let data = req.body;
        let applicationId = req.params.id;

        let distributorList = await distributorListModel.distributorDetail(applicationId);
        let aseDetail = await distributorListModel.getAseDetail(distributorList[0].user_id);

        if (distributorList[0].flag === 3 || 
            distributorList[0].flag === 2 || 
            distributorList[0].applicationPhase_Flag == 0 || 
            distributorList[0].applicationPhase_Flag == 2) {
        
            let message = distributorList[0].flag === 3 
                ? 'This lead requires correction.'  
                : distributorList[0].flag === 2 
                ? 'This lead has already been rejected.'  
                : distributorList[0].applicationPhase_Flag == 2 
                ? 'You are the final approver and cannot proceed further.'
                : 'You can not access this application.';
        
            req.session.notification = { type: 'warning', message };
            return res.redirect('/distributorList');
        }
        

        console.log()
        if(data.action=='correction')
        {
            await distributorListModel.insertCorrectionRecord(applicationId, JSON.stringify(data.documents), req.cookies.user_id);
            await distributorListModel.updateProspectiveInfo(applicationId,req.cookies.user_id);
            await mailer.sendEmail(distributorList[0].aseemail, distributorList[0].firmName, aseDetail[0].employee_name, aseDetail[0].role, "correction");
            return res.status(200).json({
                success: true,
                message: "Document Correction submitted successfully."
            });

        }
        else if(data.action=='approve')
        {
            await distributorListModel.approvedByMis(applicationId, req.cookies.user_id);
            await distributorListModel.updateProspectiveInfoMis(applicationId,req.cookies.user_id);
            let nextAprover = await distributorListModel.getNextApprover(applicationId);
            let userdata = await distributorListModel.getUserById(nextAprover);
            await mailer.sendEmail(userdata[0].email_id, distributorList[0].firmName, userdata[0].employee_name, userdata[0].role, "approval");
        }

        return res.status(200).json({
            success: true,
            message: "Document verification submitted successfully."
        });
    } catch (error) {
        console.error("Error submitting document verification:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while submitting document verification."
        });
    }
};


const getUserById = async(application_id)=>{
    try{
    let query = `select * from users 
                 where users.id = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,application_id,(error,results)=>{
         if(error)
         {
          return reject(error);
         }
         return resolve(results);
      })
    })
   }
   catch(error){
    console.error("Error in selectQuery:", error);
    throw error; 
   }
  }
module.exports = {
    DocumentVerificationView,
    DocumentVerificationApplication,
    SubmitDocumentVerification,
    getUserById
}