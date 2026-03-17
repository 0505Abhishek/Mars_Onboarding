const dashboard = require('../../models/dashboard.model');
const distributorListModel = require("../../models/documentVerification/documentVerification.model");
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');
const leadStatusModel = require('../../models/leadStatus/leadStatus.model');

const DocumentVerificationView = async (req, res, next) => {
  try {
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);

      let allDistributor = await distributorListModel.getDistributorList(req.cookies.role_id, req.cookies.region_id);
    let regions = await distributorListModel.getRegion(req.cookies.user_id);
    let territory = await distributorListModel.getTerritory(req.cookies.user_id);

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
              distributors: allDistributor ,
              regions,
              territory
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
       let distributorList = await distributorListModel.distributorDetail(a, req.cookies.region_id);
       
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
        let user_id = req.cookies.user_id;
        let role_id = req.cookies.role_id;
        let role_name = req.cookies.role_name;
        let distributorList = await distributorListModel.distributorDetail(applicationId, req.cookies.region_id);
        let applicationDetail = await  distributorListModel.getApplicationInfo(applicationId, role_id) 
        let aseDetail = await distributorListModel.getAseDetail(distributorList[0].user_id);
        const UserName = req.cookies.UserName;

        if (applicationDetail === 1) {

            return res.status(400).json({ success: false, type: 'warning', message: 'You have Already approved can not approved again'  });
        }

        if ([2, 3].includes(distributorList[0].flag)) {
            const messages = {
                3: 'This lead requires correction.',
                2: 'This lead has already been rejected.'
            };
            return res.status(400).json({ success: false ,type: 'warning', message: messages });
        }
        
        

        if(data.action=='correction')
        {
            await distributorListModel.insertCorrectionRecord(applicationId, JSON.stringify(data.documents), req.cookies.user_id);
            await distributorListModel.updateProspectiveInfo(applicationId,req.cookies.user_id);
            
            let emailObj= {sendToEmail: distributorList[0].aseemail, sendToName: aseDetail[0].employee_name, sendByName: UserName, firmName: distributorList[0].firmName, SendToRole: aseDetail[0].role};

            await mailer.sendEmail(emailObj, "docCorrection");
            await insertApplicationHistory(applicationId, user_id, role_name, 5, aseDetail[0].id, aseDetail[0].role, aseDetail[0].employee_name, "", "Correction", "MIS asking for correction", JSON.stringify(data.documents));

            return res.status(200).json({
                success: true,
                message: "Document Correction submitted successfully."
            });

        }
        else if(data.action=='approve')
        {
            await distributorListModel.approvedByMis(applicationId, req.cookies.user_id, req.cookies.role_id);
            await distributorListModel.updateProspectiveInfoMis(applicationId,req.cookies.role_id);
            let nextAprover = await distributorListModel.getNextApprover(applicationId);
            let userdata = await distributorListModel.getUserById(nextAprover);

            let emailObj= {sendToEmail: userdata[0].email_id, sendToName: userdata[0].employee_name, AseName: aseDetail[0].employee_name, sendByName: UserName, firmName: distributorList[0].firmName, SendToRole: userdata[0].role};

            await mailer.sendEmail(emailObj, "documentapproval");
            await insertApplicationHistory(applicationId, user_id, role_name, 5, userdata[0].id, userdata[0].role, userdata[0].employee_name, "","Approved", "MIS has Approved the Document Page");
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

module.exports = {
    DocumentVerificationView,
    DocumentVerificationApplication,
    SubmitDocumentVerification,
    TerritoryByRegion
}