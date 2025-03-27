const correctionModel = require('../../models/correction/correction.model');
const dashboard = require('../../models/dashboard.model');


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

const submitCorrection = async(req,res)=>{
  try{
      let applicationId = req.params.id;
      let data = await dashboard.selectQuery(req.cookies.email);
      let navbarviews = await dashboard.navbarviewesult(data);
      let notification = req.session.notification || null;
        req.session.notification = null;

      await correctionModel.updateCorrection(applicationId);
      await correctionModel.updateProspectiveInfo(applicationId);
      return res.redirect('/correction');

   }catch(error){
     let applicationId = req.params.id;
     console.log("error....",error);
     return res.redirect('/correction');
    }
}

module.exports={
    distributorView,
    CorrectionView,
    submitCorrection
}