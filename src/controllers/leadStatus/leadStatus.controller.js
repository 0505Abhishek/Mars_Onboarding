const dashboard = require('../../models/dashboard.model');
const leadStatusModel = require("../../models/leadStatus/leadStatus.model");
const {imageUpload} = require('../../util/imageUpload');

const leadStatusView = async (req, res, next) => {
  try {
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);
      
      let allDistributor = await leadStatusModel.getDistributorList(req.cookies.user_id, req.cookies.email);

      let notification = req.session.notification || null;
      req.session.notification = null;

      req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          res.render('LeadStatus', { 
              token: navbarviews, 
              user: res.userDetail, 
              notification: notification, 
              distributors: allDistributor 
          });
      });

  } catch (error) {
      console.error("DistributorListView Error:", error);
      return res.redirect('/dashboard');
  }
};


const leadDistributorView = async (req, res) => {
    try {

        let a = req.params.id;

        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
        req.session.notification = null;
    
        let documentData = await leadStatusModel.getDistributorDetails(a, req.cookies.user_id);

        if(documentData.length==0)
        {
            req.session.notification = { type: 'warning', message: 'Can Not Access This Id !' };
            return res.redirect('/lead_status');
        }

        if (documentData[0]?.flag === 3 || documentData[0]?.flag === 2 || documentData[0]?.applicationPhase_Flag == 0) {
            let message = documentData[0]?.flag === 3 
                ? 'This lead requires correction.'  
                : documentData[0]?.flag === 2 
                ? 'This lead has already been rejected.'  
                : 'You can not access this application.';
            req.session.notification = { type: 'warning', message };
            return res.redirect('/lead_status');
        }
        
        
        return res.render('LeadStatus/LeadDistributor', {
            token: navbarviews,
            user: res.userDetail,
            notification: notification,
            application_id: a,
            distributor: documentData[0],
        });
    } catch (error) {
        console.error("DistributorListView Error:", error);
        req.session.notification = "Error fetching lead distributor details.";
        return res.redirect('/lead_status');
    }
}

const InsertleadDistributor = async (req, res) => {
    try {
        let a = req.params.id;
        let distributorDocument = await leadStatusModel.getDistributorDocument(a);

        if (distributorDocument.length > 0) {

            req.session.notification = {
                type: "error",
                message: "Document already uploaded for this distributor."
            };
            return res.redirect('/lead_status');
        }
        const files = req.files;
      
        const filePaths = await imageUpload(files);
        const remarkData = req.body;

        const documents = await leadStatusModel.insertDocument(a, req.cookies.user_id, filePaths, remarkData);
        await leadStatusModel.updateApprovalWorkflow(a, req.cookies.user_id, remarkData);

        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
        req.session.notification = null;

        return res.redirect('/lead_status');

    } catch (error) {
        console.error("InsertLeadDistributor Error:", error);
        req.session.notification = "Error inserting lead distributor.";
        return res.redirect('/lead_status');
    }
}


const leadCorrectionView = async (req, res, next) => {
    try {
        const application_id = req.params.id;
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        
        let allDistributor = await leadStatusModel.getCorrectionData(req.params.id);
        let documentData = await leadStatusModel.getDistributorDetails(application_id, req.cookies.user_id);

        if(!allDistributor || allDistributor.length===0)
        {
            
            req.session.notification = { type: 'warning', message:'Noting for correction' };
            return res.redirect('/lead_status');
        }

        
        if (documentData[0]?.flag === 0 || documentData[0]?.flag === 2) {
            let message = documentData[0]?.flag === 0 
                ? 'This lead requires on approval stage.'  
                : 'This lead has already been rejected.'  
            req.session.notification = { type: 'warning', message };
            return res.redirect('/lead_status');
        }

        let notification = req.session.notification || null;
        req.session.notification = null;
  
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.render('LeadStatus/Leadcorrection', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification: notification, 
                distributors: allDistributor,
                application_id: application_id
            });
        });
  
    } catch (error) {
        console.error("DistributorListView Error:", error);
        req.session.notification = { type: 'warning', message:'Noting for correction' };
        return res.redirect('/lead_status');
    }
  };

  

const InsertleadCorrection = async(req,res, next) =>{
    try {
        let a = req.params.id;
        let distributorDocument = await leadStatusModel.getDistributorDocument(a);

        
        const files = req.files;
      
        const filePaths = await imageUpload(files);

        let documentData = await leadStatusModel.getDistributorDetails(a, req.cookies.user_id);

        if (documentData[0]?.flag === 0 || documentData[0]?.flag === 2) {
            let message = distributorData?.flag === 0 
                ? 'This lead requires on approval stage.'  
                : 'This lead has already been rejected.'  
            req.session.notification = { type: 'warning', message };
            return res.redirect('/lead_status');
        }


        await leadStatusModel.insertDocumentLog(distributorDocument[0]);

        await leadStatusModel.updateDocument(a, filePaths);
        await leadStatusModel.updateCorrection(a, filePaths);
        await leadStatusModel.updateProspectiveInfo(a);

        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
        req.session.notification = null;

        return res.redirect('/lead_status');

    } catch (error) {
        console.error("InsertLeadDistributor Error:", error);
        req.session.notification = "Error inserting lead distributor.";
        return res.redirect('/lead_status');
    }
}  

module.exports = {
    leadStatusView,
    leadDistributorView,
    InsertleadDistributor,
    leadCorrectionView,
    InsertleadCorrection
}