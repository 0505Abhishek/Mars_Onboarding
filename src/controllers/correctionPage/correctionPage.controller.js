const atob = (str) => Buffer.from(str, 'base64').toString('utf-8');
const correctionPageModel = require('../../models/correctionModel/correction.model');
const correctionModel = require('../../models/correction/correction.model');
const {imageUpload} = require('../../util/imageUpload');

const dashboard = require('../../models/dashboard.model');

const basicPageView = async(req,res)=>{
    let applicationId = req.query.applicationId;
    try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification || null;
          req.session.notification = null;
        let applicationId = req.query.applicationId;

        let correction = await correctionModel.getCorrection(applicationId);        
        
        if (!correction || correction.length === 0) {
            return res.redirect('/correction/applicationId'); 
        }
        const correctionData = correction[0]; 
        
        
        let distributor = await correctionModel.getDistributorById(applicationId, req.cookies.email);

        if (!distributor || distributor.length === 0) {
            return res.redirect(`/correction/${applicationId}`); 
        }
        const pageNames = JSON.parse(correctionData.page_name || "[]");
        const fields = JSON.parse(correctionData.feilds || "[]");

        return res.render('correctionPages/basicAdditionalDetail',{
            token: navbarviews, 
            user: res.userDetail, 
            notification: notification, 
            distributorData: distributor[0],
            applicationId,
            pageNames,
            fields
        });
    }catch(error)
    {
        console.log(error,"error");
      return res.redirect(`/correction/${applicationId}`)
    }
}


const documentPageView = async(req,res)=>{
    let applicationId = req.query.applicationId;
    try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let applicationId = req.query.applicationId;
        let notification = req.session.notification || null;
          req.session.notification = null;

        let correction = await correctionModel.getCorrection(applicationId);
        let Distributor = await correctionModel.getDistributorById(applicationId);

        if (!correction || correction.length === 0) {
            return res.redirect(`/correction/${applicationId}`); 
        }
        const correctionData = correction[0]; 

        const pageNames = JSON.parse(correctionData.page_name || "[]");
        const fields = JSON.parse(correctionData.feilds || "[]");


        return res.render('correctionPages/document',{
            token: navbarviews, 
            user: res.userDetail, 
            notification: notification, 
            correction: correctionData,
            distributors: Distributor,
            applicationId,
            pageNames,
            fields, 
        });
    }catch(error)
    {
        console.log(error,"error");
      return res.redirect(`/correction/${applicationId}`)
    }
}


const updateBasicPage = async(req,res)=>{
    try{
        const { id, page_name } = req.query;

        const decodedAppId = atob(id);
        const decodedPageName = atob(page_name);

        let data = req.body;

        let correction = await correctionModel.getCorrection(decodedAppId);

        if(correction[0].basic_page_status == 1){
            req.session.notification = { type: 'warning', message: 'This Page already has been approved.' };
            return res.redirect(`/correction/${decodedAppId}`);
        }

        await correctionPageModel.updateDistributor(data, decodedAppId);
        await correctionPageModel.updateCorrectionBasic(decodedAppId);
        return res.redirect(`/correction/${decodedAppId}`)
    }catch(error){
        const { id, page_name } = req.query;
        const decodedAppId = atob(id);
        const decodedPageName = atob(page_name);
        console.log(error,"error");
      return res.redirect(`/correction/${decodedAppId}`)
    }
}



const updateDocumentPage = async(req,res)=>{
    try{
        const { id, page_name } = req.query;

        const decodedAppId = atob(id);
        const decodedPageName = atob(page_name);

        let correction = await correctionModel.getCorrection(decodedAppId);

        if(correction[0].document_page_status == 1){
            req.session.notification = { type: 'warning', message: 'This Page already has been approved.' };
            return res.redirect(`/correction/${decodedAppId}`);
        }

        const files = req.files;
      
        const filePaths = await imageUpload(files);
        const remarkData = req.body;
        
        await correctionPageModel.updateDocument(decodedAppId, filePaths);
        await correctionPageModel.updateCorrectionDoc(decodedAppId);
        return res.redirect(`/correction/${decodedAppId}`)
    }catch(error){
        const { id, page_name } = req.query;

        const decodedAppId = atob(id);
        const decodedPageName = atob(page_name);
        console.log(error,"error");
      return res.redirect(`/correction/${decodedAppId}`)
    }
}

module.exports={
    basicPageView,
    documentPageView,
    updateBasicPage,
    updateDocumentPage
}