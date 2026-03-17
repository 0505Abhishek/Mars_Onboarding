const dashboard = require('../../models/dashboard.model');
const leadStatusModel = require("../../models/leadStatus/leadStatus.model");
const mailer = require('../../util/sent_mail');
const {imageUpload} = require('../../util/imageUpload');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');

const leadStatusView = async (req, res, next) => {
    try {
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let allDistributor = await leadStatusModel.getDistributorList(req.cookies.user_id, req.cookies.email);
        // let getPendingData = await leadStatusModel.getPending(req.cookies.user_id, req.cookies.email);
        let regions = await leadStatusModel.getRegion(req.cookies.user_id);
        let territory = await leadStatusModel.getTerritory(req.cookies.user_id);
        let notification = req.session.notification || null;


        req.session.notification = null;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
            }

            res.render('LeadStatus', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification, 
                distributors: allDistributor,
                regions,
                territory
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
        const region_id = req.cookies.region_id;

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

        const OriginalNames = {};

        for (const key in files) {
            const file = files[key];
            OriginalNames[key] = file?.originalFilename || null;
        }

        

        const documents = await leadStatusModel.insertDocument(a, req.cookies?.user_id, filePaths, remarkData);
        await leadStatusModel.insertOriginalNames(a, OriginalNames);

        await leadStatusModel.updateApprovalWorkflow(a, req.cookies?.user_id, remarkData);
        let distributor = await leadStatusModel.getDistributorDocument(a);
        const hierarchy = distributor[0]?.total_approval_action_user_ids;
        const array = JSON.parse(hierarchy);
        let hierarchyData = await leadStatusModel.getUserById(array[2]);

        let AllEmailsToSend = await leadStatusModel.getAllEmailsToSend(hierarchyData.role_id, region_id);

        let emailList = AllEmailsToSend.map(row => row.email_id);

        let emailObj= {sendToEmail: emailList, sendToName: hierarchyData?.employee_name, sendByName: UserName, firmName: distributor[0]?.firmName, remark: remarkData?.overallRemarks, SendToRole: hierarchyData.role};

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
        let uploadDocumentData = await leadStatusModel.getUploadDocumentData(application_id);
        let OriginalFileNames = await leadStatusModel.getOriginalFileNames(application_id);


        if(!allDistributor || allDistributor.length===0)
        {  
            req.session.notification = { type: 'warning', message:'Nothing for correction' };
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
                application_id: application_id,
                originalFileName: OriginalFileNames[0],
                uploadDocumentData
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
        const region_id = req.cookies.region_id;

        const files = req.files;
      
        const filePaths = await imageUpload(files);

        const OriginalNames = {};

        for (const key in files) {
            const file = files[key];
            OriginalNames[key] = file?.originalFilename || null;
        }

        const remarkData = req.body;

        await leadStatusModel.updateOriginalNames(a, OriginalNames);

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

        let AllEmailsToSend = await leadStatusModel.getAllEmailsToSend(hierarchyData.role_id, region_id);

        let emailList = AllEmailsToSend.map(row => row.email_id);


        let emailObj= {sendToEmail: emailList, sendToName: hierarchyData?.employee_name, sendByName: UserName, firmName: documentData[0]?.firmName, remark:remarkData?.overallRemarks, SendToRole: hierarchyData.role};

        await mailer.sendEmail(emailObj, "DocumentCorrectionSubmit");

        await insertApplicationHistory(a, user_id, role_name, 4, hierarchyData?.id, hierarchyData?.role, hierarchyData?.employee_name, "","Submitted", `${role_name} Submit the Correction on document.`);

        return res.redirect('/lead_status');

    } catch (error) {
        console.error("InsertLeadDistributor Error:", error);
        req.session.notification = "Error inserting lead distributor.";
        return res.redirect('/lead_status');
    }
}  

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
    leadStatusView,
    leadDistributorView,
    InsertleadDistributor,
    leadCorrectionView,
    InsertleadCorrection,
    TerritoryByRegion
}