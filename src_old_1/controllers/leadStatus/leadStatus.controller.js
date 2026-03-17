const dashboard = require('../../models/dashboard.model');
const leadStatusModel = require("../../models/leadStatus/leadStatus.model");
const mailer = require('../../util/sent_mail');
const {imageUpload} = require('../../util/imageUpload');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');

const leadStatusView = async (req, res, next) => {
    try {
        // Fetch required data
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let allDistributor = await leadStatusModel.getDistributorList(req.cookies.user_id, req.cookies.email);
        // let getPendingData = await leadStatusModel.getPending(req.cookies.user_id, req.cookies.email);

        // Retrieve notification from session
        let notification = req.session.notification || null;

        // Clear notification from session after use
        req.session.notification = null;

        // Save session and render the page
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
            }

            res.render('LeadStatus', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification, 
                distributors: allDistributor 
            });
        });

    } catch (error) {
        console.error("leadStatusView Error:", error);
        res.redirect('/dashboard');
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
        let distributorDocument = await leadStatusModel.getDistributorDocument(a);

        if(documentData.length==0 || distributorDocument.length>0)
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
        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        const UserName = req.cookies.UserName;

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

        const documents = await leadStatusModel.insertDocument(a, req.cookies?.user_id, filePaths, remarkData);
        await leadStatusModel.updateApprovalWorkflow(a, req.cookies?.user_id, remarkData);
        let distributor = await leadStatusModel.getDistributorDocument(a);
        const hierarchy = distributor[0]?.total_approval_action_user_ids;
        const array = JSON.parse(hierarchy);
        let hierarchyData = await leadStatusModel.getUserById(array[2]);

        let emailObj= {sendToEmail: hierarchyData?.email_id, sendToName: hierarchyData?.employee_name, sendByName: UserName, firmName: distributor[0]?.firmName};

        await mailer.sendEmail(emailObj, "documentapprovalToMis");
        
        await insertApplicationHistory(a, user_id, role_name, 4, hierarchyData?.id, hierarchyData?.role, hierarchyData?.employee_name, remarkData?.overallRemarks, "Submitted", "Asm Submit the document.");

        req.session.notification = "Document Submitted Successfully";

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
        const user_email = req.cookies.email;
        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        const UserName = req.cookies.UserName;

        const files = req.files;
      
        const filePaths = await imageUpload(files);

        let documentData = await leadStatusModel.getDistributorDocument(a, req.cookies.user_id);
        const hierarchy = documentData[0]?.total_approval_action_user_ids;
        const array = JSON.parse(hierarchy);
        let hierarchyData = await leadStatusModel.getUserById(array[2]);

        if (documentData[0]?.flag === 0 || documentData[0]?.flag === 2) {
            let message = distributorData?.flag === 0 
                ? 'This lead requires on approval stage.'  
                : 'This lead has already been rejected.'  
            req.session.notification = { type: 'warning', message };
            return res.redirect('/lead_status');
        }


        await leadStatusModel.insertDocumentLog(documentData[0]);

        await leadStatusModel.updateDocument(a, filePaths);
        await leadStatusModel.updateCorrection(a, filePaths);
        await leadStatusModel.updateProspectiveInfo(a);

        let emailObj= {sendToEmail: hierarchyData?.email_id, sendToName: hierarchyData?.employee_name, sendByName: UserName, firmName: documentData[0]?.firmName};

        await mailer.sendEmail(emailObj, "DocumentCorrectionSubmit");

        await insertApplicationHistory(a, user_id, role_name, 4, hierarchyData?.id, hierarchyData?.role, hierarchyData?.employee_name, "","Submitted", `${role_name} Submit the Correction on document.`);

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