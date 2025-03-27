const addDistributor = require('../../models/addDistributor/addDistributor.model');
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');

const addDistributorView = async (req, res, next) => {
  
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    
    let notification = req.session.notification || null;
    
    req.session.notification = null;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      
      res.render('addDistributor', {
        token: navbarviews,
        user: res.userDetail,
        notification: notification
      });
    });
  
  };
  

  const createDistributor = async (req, res) => {
    try {
        const data = req.body;
        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;

        data.aseemail = aseemail;
        data.user_id = user_id;

        let distributor = await addDistributor.getDistributorByEmail(req.body.email);

        if (distributor.length > 0) {
            req.session.notification = { type: 'error', message: 'Distributor already exists!' };
            return res.redirect('/Add_distributor');
        }

        data.invite_send_flag = 1;
        data.invitecheckstatus = "send To RSEM";
        await addDistributor.addDistributor(data);


        let distributor1 = await addDistributor.getDistributorByEmail(req.body.email);

        let hierarchy = [];
        let currentUserId = user_id;
        let sequence = 1;
        let previousUserId = null;

        let applicationASM = null; 
        let asmInserted = false; 

        const maxIterations = 50;
        for (let i = 0; currentUserId && i < maxIterations; i++) {
            const user = await addDistributor.getUserById(currentUserId);

            if (!user) {
                console.warn(`Warning: User with ID ${currentUserId} not found. Breaking loop.`);
                break;
            }

            if (user.role === "ASM" && !applicationASM) {
                applicationASM = user;
                previousUserId = user;
                currentUserId = user.parent_id;
                continue;  
            }

            user.approval_sequence = sequence++;

            await addDistributor.insertApprovalWorkflow(distributor1[0].id, user.id, user.role_id, user);

            hierarchy.push(user.id);
            if (user.role === "RSEM" && applicationASM && !asmInserted) {
                applicationASM.approval_sequence = sequence++;
                await addDistributor.insertApprovalWorkflow(distributor1[0].id, applicationASM.id, applicationASM.role_id, applicationASM);
                hierarchy.push(applicationASM.id);
                asmInserted = true; 
            }

            previousUserId = user;
            currentUserId = user.parent_id;
        }
        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        await addDistributor.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover, req.body.email);

        applicationASM = null;
        asmInserted = false;

        let hierarchyData = await addDistributor.getUserById(hierarchy[0]);
        let distributorDetail = await addDistributor.getDistributorByEmail(req.body.email);

        await mailer.sendEmail(hierarchyData.email_id, distributorDetail[0].firmName, hierarchyData.employee_name, hierarchyData.role, "Rsemapproval");

        req.session.notification = { type: 'success', message: 'Invite sent to RSEM Successfully!' };
        return res.redirect('/Add_distributor');
    } catch (error) {
        console.error("Error in createDistributor:", error);
        req.session.notification = { type: 'error', message: 'Something went wrong!' };
        return res.redirect('/Add_distributor');
    }
};

  
  
const distributorDraftList = async (req, res) => {
  try{
  let data = await dashboard.selectQuery(req.cookies.email);
  let allDistributor = await addDistributor.getDistributorDraftList(req.cookies.user_id, req,cookies.email);
  let navbarviews = await dashboard.navbarviewesult(data);

  let notification = req.session.notification; 

  delete req.session.notification; 

  res.render('distributor_draft_list', { token: navbarviews, notification, data: allDistributor });
  }
  catch(error){
    req.session.notification = { type: 'Error', message: 'Sorry There is Some Problem !' };
    console.log(error);
    return res.redirect('/dashboard');
  }
};

const saveDraft = async (req, res) => {
  try {
      const { id, email } = req.body;

      if (!email) {
          return res.status(400).json({ message: "Distributor email is required" });
      }

      // Check if distributor already exists
      let existingDistributor = await addDistributor.getDistributorByEmail(email);

      if (existingDistributor.length > 0) {
          req.session.notification = { type: 'error', message: 'Distributor already exists!' };
          return res.status(400).json({ message: "Distributor already exists!" });
      }

      // Attach user details from cookies
      req.body.aseemail = req.cookies.email;
      req.body.user_id = req.cookies.user_id;

      // Save draft
      await addDistributor.addDistributor(req.body, "draft");

      // Retrieve saved distributor ID
      let distributor = await addDistributor.getDistributorByEmail(email);

      if (!distributor.length) {
          return res.status(500).json({ message: "Failed to retrieve distributor ID" });
      }

      return res.status(200).json({ message: "Draft saved successfully!", distributorId: distributor[0].id });

  } catch (error) {
      console.error("Error saving draft:", error);
      return res.status(500).json({ message: "Error saving draft" });
  }
};

module.exports = {
    addDistributorView,
    createDistributor,
    distributorDraftList,
    saveDraft
}