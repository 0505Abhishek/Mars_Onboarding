const dashboard = require('../../models/dashboard.model');
const applicationModel = require("../../models/offboardingApplication/application.model");
const {imageUpload} = require('../../util/imageUpload');
const mailer = require('../../util/offboarding_mail');


const offboardList = async (req, res) => {
  try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let allDistributor = await applicationModel.getDistributorList(req.cookies.user_id, req.cookies.role_id);
        let navbarviews = await dashboard.navbarviewesult(data);
        let notification = req.session.notification;

        delete req.session.notification; 
        
        res.render('offboardingApplication', { token: navbarviews, notification, data: allDistributor });
  }catch(error){
        req.session.notification = { type: 'Error', message: 'Sorry There is Some Problem !' };
        console.log(error);
        return res.redirect('/dashboard');
  }
};



const offboardApplicationViewById = async(req,res)=>{
  try{
  const application_id = req.params.id;
  const role_name = req.cookies.role_name;
  let data = await dashboard.selectQuery(req.cookies.email);
  const user_id = req.cookies.user_id;
  const role_id = req.cookies.role_id;
  let navbarviews = await dashboard.navbarviewesult(data);
  
  let userData = await applicationModel.getUserById(application_id, req.cookies.role_id, req.cookies.region_id);

  if(!userData)
  {
    req.session.notification = {
      type: 'error',
      message: 'You do not have access for this user!'
    };
    return res.redirect('/offboardApplication');
  }

  if(userData?.is_final_approval == 1)
  {
   req.session.notification = {
     type: 'error',
     message: ' action!'
   };
   return res.redirect('/offboardApplication');
  }

  return res.render("offboardingApplication/application",{token: navbarviews, token: navbarviews, roleName:role_name, application_id});
  }
  catch(error)
  {
    console.log(error,"........error........");
    return res.redirect("/dashboard");
  }
}


const offboardApplicationSubmit = async(req,res)=>{
  try{
    
  let formData = req.body;
  const application_id = req.params.id;
  const role_name = req.cookies.role_name;
  const role_id = req.cookies.role_id;
  const user_id = req.cookies.user_id;
  let data = await dashboard.selectQuery(req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);

  const files = req.files;
  let filePaths;
  if(files)
  {
    filePaths = await imageUpload(files);
    formData.noc_file = filePaths.noc_file;
  }

  let applicationData = await applicationModel.getApplicationDetail(application_id);
  let userData = await applicationModel.getUserById(user_id, application_id, role_id);

  if(userData?.is_final_approval == 1)
    {
     req.session.notification = {
       type: 'error',
       message: 'You have already take action!'
     };
     return res.redirect('/offboardApplication');
    }

  if(applicationData.length==0)
  {
    formData.approval_count = 1;
    await applicationModel.insertApplicationDetail(application_id,formData);
    await applicationModel.updateoffboardHierarchy(user_id, application_id, 1, role_id);
  }
  else if(applicationData[0].approval_count == 1)
  { 
    formData.approval_count = applicationData[0].approval_count+1;
   await applicationModel.updateApplicationDetail(application_id,formData);
   await applicationModel.updateoffboardHierarchy(user_id, application_id, 1, role_id);
   let distributorData = await  applicationModel.getdistributorData(application_id);
   let nextApprover = await applicationModel.getNextApprover(application_id);
   let obj = {};
   obj.firmName = distributorData[0].firmName;
   obj.sendToEmail = nextApprover[0].email_id;
   obj.sendToName = nextApprover[0]?.employee_name;

   await mailer.sentEmailForOffboarding(obj, 'APPROVAL')
  }
  else
  { 
    formData.approval_count = applicationData[0].approval_count+1;
    await applicationModel.updateApplicationDetail(application_id,req.body, formData);
    await applicationModel.updateoffboardHierarchy(user_id, application_id, 1, role_id);
  }
 
  await applicationModel.updateApplicationDetail(application_id, formData);

  req.session.notification = {
    type: 'success',
    message: 'Submitted successfully'
  };
  
  return res.redirect('/offboardApplication');
}
  catch(error)
  {
    console.log(error,"........error........");
    return res.redirect("/dashboard");
  }
}

module.exports = {
    offboardList,offboardApplicationViewById,offboardApplicationSubmit  
}