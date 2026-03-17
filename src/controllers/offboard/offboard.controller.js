const offboardModel = require('../../models/offboard/offboard.model');
const dashboard = require('../../models/dashboard.model');
const mail = require("../../util/offboarding_mail");
const tokenWebPage = require("../../util/jwt");

const offboardList = async (req, res) => {
  try{
  let data = await dashboard.selectQuery(req.cookies.email);
  let allDistributor = await offboardModel.getDistributorList(req.cookies.user_id, req.cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);

  let notification = req.session.notification;

  delete req.session.notification; 

  res.render('offboard', { token: navbarviews, notification, data: allDistributor });
  }catch(error){
    req.session.notification = { type: 'Error', message: 'Sorry There is Some Problem !' };
    console.log(error);
    return res.redirect('/dashboard');
  }
};

      
const offboardDistributor = async (req, res) => {
  try {
    let data = req.body;

    const aseemail = req.cookies.email;
    const user_id = req.cookies.user_id;
    const user_Name = req.cookies.UserName;
    const role_Name = req.cookies.role_name;

    data.aseemail = aseemail;
    data.user_id = user_id;

    const roleSequenceMap = {
      'RSEM': 1,
      'DT TEAM': 2,
      'SNF': 2,
      'RSM': 3,
      'SALES DIRECTOR': 4
    };

    const prevSubmission = await offboardModel.getDistributorSubmission(data.application_id);
    const prevHierarchy = await offboardModel.getoffboardHierarchy(data.application_id);

    if (prevSubmission && prevSubmission.length > 0) {
      await offboardModel.insertLog({
        application_id: data.application_id,
        log_type: 'reinitiated',
        user_id,
        user_name: user_Name,
        role_name: role_Name,
        old_data: {
          submission: prevSubmission  
        },
        created_at: new Date()
      });
    }


    await offboardModel.deleteDistributorSubmission(data.application_id);
    await offboardModel.deleteOffboard(data.application_id);
    await offboardModel.deleteApprovalWorkflow(data.application_id);

    if(prevSubmission.length>0){
      data.status = 'reinitiated'
      await offboardModel.setDistributor(data); 
    }else{
      await offboardModel.setDistributor(data); 
    }

    await offboardModel.updateProspectInfo(data.application_id); 

    const offboardHierarchy = await offboardModel.getoffboardHierarchy(data.application_id);

    if (Array.isArray(offboardHierarchy)) {
      for (let i = 0; i < offboardHierarchy.length; i++) {
        const role = offboardHierarchy[i].role_name?.toUpperCase();

        if (roleSequenceMap.hasOwnProperty(role)) {
          offboardHierarchy[i].sequence = roleSequenceMap[role];

          await offboardModel.insertApprovalWorkflow(
            offboardHierarchy[i].application_id,
            offboardHierarchy[i].approver_id,
            offboardHierarchy[i].approver_role_id,
            offboardHierarchy[i]
          );
        }
      }
    }

    if (data?.avg_sale === 'no') {
      const user = await offboardModel.getSalesDirector();

      user.territory_id = offboardHierarchy[0]?.territory_id;
      data.territory_id = offboardHierarchy[0]?.territory_id;
      user.sequence = 4;
      user.role_name = 'SALES DIRECTOR';

      await offboardModel.insertApprovalWorkflow(
        offboardHierarchy[0].application_id,
        user.id,
        user.role_id,
        user
      );
    }

    const DbDetail = await offboardModel.getProspectiveById(data?.application_id);
    const token = await tokenWebPage.tokenForWebPage(data?.application_id);

    const mailObj = {
      sendToName: DbDetail[0].distributorName,
      firmName: DbDetail[0].firmName,
      sendToEmail: DbDetail[0].email,
      sendByName: user_Name,
      senByrole: role_Name,
      token
    };

    await mail.sentEmailForOffboarding(mailObj, "DISTRIBUTOR");

    req.session.notification = { type: 'Success', message: 'Application Initiated successfully!' };
    return res.redirect('/offboardPage');

  } catch (error) {
    console.error("Offboard Error:", error);
    req.session.notification = { type: 'Error', message: 'Sorry, there was a problem!' };
    return res.redirect('/dashboard');
  }
};

module.exports = {
  offboardList,
  offboardDistributor
}