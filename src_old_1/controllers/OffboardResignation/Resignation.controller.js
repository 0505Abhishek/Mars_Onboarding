const dashboard = require('../../models/dashboard.model');
const ResignationModel = require("../../models/OffboardResignation/Resignation.model");
const mailer = require('../../util/offboarding_mail');


const offboardList = async (req, res) => {
  try{
        let data = await dashboard.selectQuery(req.cookies.email);
        let allDistributor = await ResignationModel.getDistributorList(req.cookies.user_id);

        let navbarviews = await dashboard.navbarviewesult(data);

        let notification = req.session.notification;

        delete req.session.notification; 

        res.render('offboardResignation', { token: navbarviews, notification, data: allDistributor });
  }catch(error){
        req.session.notification = { type: 'Error', message: 'Sorry There is Some Problem !' };
        console.log(error);
        return res.redirect('/dashboard');
  }
};



const offboardResignationViewById = async(req,res)=>{
  try{
  const encodedId = req.params.id;
  const application_id = Buffer.from(encodedId, 'base64').toString('utf8');
  
  let data = await dashboard.selectQuery(req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);
  
  if(!application_id)
  {
    req.session.notification = {
      type: 'error',
      message: 'You can not take Action for this application!'
    };
    return res.redirect('/offboardResignation');
  }

  let Distributor = await ResignationModel.getDistributorByID(application_id,req.cookies.user_id);


  if (Distributor.length === 0) {
    req.session.notification = {
      type: 'error',
      message: 'You do not have access for this user!'
    };
    return res.redirect('/offboardResignation');
  }
  
  if (Distributor[0].is_final_approval === 1) {
    req.session.notification = {
      type: 'error',
      message: 'You have already take action!'
    };
    return res.redirect('/offboardResignation');
  }

  return res.render("offboardResignation/distributorView",{token: navbarviews, token: navbarviews, distributor:Distributor[0]});
  }
  catch(error)
  {
    console.log(error,"........error........");
    return res.redirect("/dashboard");
  }
}

const SubmitResignation = async (req, res) => {
  try {
    const actionData = req.body;
    const user_id = req.cookies.user_id;
    const userName = req.cookies.UserName;
    const Distributor = await ResignationModel.getDistributorByID(actionData.applicationId, user_id);

    if (Distributor[0].is_final_approval === 1 || Distributor[0].offboard_flag === 2) {
      return res.status(400).json({
        type: 'error',
        message: 'You have already take action!'
      });
    }

    if (actionData.action === 'Approve') {
      await ResignationModel.updateoffboardHierarchy(user_id, actionData.applicationId, 1, actionData.remarkMsg);
      await ResignationModel.updateoOffboardingDistributorApproved(actionData.applicationId);
      const OffboardHierarchyData = await ResignationModel.getOffboardHierarchy(user_id, actionData.applicationId);
      const NextApprover =  await ResignationModel.getNextApprover(actionData.applicationId, OffboardHierarchyData.sequence+1);
      let email = [];

      for(let i = 0; i < NextApprover.length;i++)
      {
        const userData = await ResignationModel.getUserById(NextApprover[i].approver_id);
        email.push(userData.email_id)  
      }
      let obj = {};
      obj.sendToEmail = email;
      obj.firmName = Distributor[0]?.firmName;
      obj.userName = userName;
      mailer.sentEmailForOffboarding(obj,'SENDTOTHREE');
    }

    if (actionData.action === 'Reject') {
      await ResignationModel.updateRejectOffboardHierarchy(user_id, actionData.applicationId, actionData.remarkMsg);
      await ResignationModel.updateoOffboardingDistributor(actionData.applicationId);
      const asmData = await ResignationModel.getUserById(Distributor[0]?.initiator_id);

      let obj = {};
      obj.sendToEmail=Distributor[0]?.initiator_email;
      obj.firmName = Distributor[0]?.firmName;
      obj.userName = userName;
      obj.asmName = asmData.employee_name;

      mailer.sentEmailForOffboarding(obj,'REJECTED');

    }

    return res.status(200).json({
      type: 'success',
      message: `${actionData.action} successful!`
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      type: 'error',
      message: 'An error occurred. Please try again later.'
    });
  }
};


module.exports = {
    offboardList,offboardResignationViewById, SubmitResignation  
}