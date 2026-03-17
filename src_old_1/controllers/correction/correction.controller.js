const correctionModel = require('../../models/correction/correction.model');
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory, insertApplicationHistory1} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');


const distributorView = async(req,res)=>{
    try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
          req.session.notification = null;

        let distributors = await correctionModel.getDistributorList(req.cookies.user_id);
        
        return res.render('correction/distributorList',{
            token: navbarviews, 
            user: res.userDetail, 
            notification: notification, 
            distributors: distributors 
        });

     }catch(error){
       console.log('Error:',error);
       return res.redirect('/dashboard')
     }
}

const CorrectionView = async(req,res)=>{
    try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
          req.session.notification = null;
        let applicationId = req.params.id;   
        let correction = await correctionModel.getCorrection(applicationId);
        const correctionData = correction[0]; 

        const pageNames = JSON.parse(correctionData?.page_name || "[]");
        const fields = JSON.parse(correctionData?.feilds || "[]");

        return res.render('correction/correction',{
            token: navbarviews, 
            user: res.userDetail, 
            notification: notification, 
            correction : correctionData,
            applicationId,
            pageNames,
            fields, 
        });
    }catch(error)
    {
      console.log('Error:',error)
      return res.redirect('/correction')
    }
}

const submitCorrection = async (req, res) => {
  try {
      const applicationId = req.params.id;
      const email = req.cookies.email;
      const userId = req.cookies.user_id;
      const roleName = req.cookies.role_name;

      if (!applicationId || !email || !userId || !roleName) {
          return res.status(400).json({ message: "Missing required parameters" });
      }

      const data = await dashboard.selectQuery(email);
      const navbarViews = await dashboard.navbarviewesult(data);

      req.session.notification = null; 

      const applicationData = await correctionModel.GetApplicationDetail(applicationId);
      let userdata = await correctionModel.getUserById(applicationData[0]?.approver_id);
      
      await Promise.all([
          correctionModel.updateCorrection(applicationId),
          correctionModel.updateProspectiveInfo(applicationId)
      ]);

      if (userdata?.email_id) {
        let emailObj= {sendToEmail: userdata.email_id, sendToName: userdata.employee_name, firmName: applicationData[0].firmName};
        await mailer.sendEmail(emailObj,"CorrectionDone");

      } else {
          console.warn("Email not sent due to missing data.");
      }

      const CORRECTION_SUBMITTED_STATUS = 6; 

      await insertApplicationHistory(
          applicationId,
          userId,
          roleName,
          CORRECTION_SUBMITTED_STATUS,
          userdata.id,
          userdata.role,
          userdata.employee_name,
          "",
          "Correction Submitted",
          "Asm Submit the Correction."
      );

      return res.redirect('/correction');
  } catch (error) {
      console.error("Error in submitCorrection:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports={
    distributorView,
    CorrectionView,
    submitCorrection
}