const addDistributor = require('../../models/addDistributor/addDistributor.model');
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');


const territory = async (req, res) => {
  const regionId = req.body.regionId;
  try {
    const territories = await addDistributor.getTerritory(req.cookies.user_id, regionId); 
    res.json(territories); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
};

const soTerritory = async (req, res) => {
  const regionId = req.body.regionId;
  const territoryId = req.body.territoryId;

  try {
    const territories = await addDistributor.getSoTerritory(req.cookies.user_id, regionId, territoryId);
    res.json(territories); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
};

const addDistributorView = async (req, res, next) => {

    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    let regions = await addDistributor.getRegion(req.cookies.user_id);

    let notification = req.session.notification || null;
    let hierarchyPersons = await addDistributor.getAllhierarchyPersons(req.cookies.user_id);

    let replacementOptions = await addDistributor.getAllDistributor(req.cookies.user_id);

    req.session.notification = null;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      
      res.render('addDistributor', {
        token: navbarviews,
        user: res.userDetail,
        notification: notification,
        replacementOptions,
        regions
      });
    });
  
  };
  
  const createDistributor = async (req, res) => {
    try {
        const data = req.body;
        const territory_id = req.body.territory_id;
        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        const UserName = req.cookies.UserName;
        const region_id = req.cookies.region_id;
        data.aseemail = aseemail;
        data.user_id = user_id;


        let hierarchyPersons = await addDistributor.getAllhierarchyPersons(territory_id);


        let approvalHierarchy = ['RSEM', 'ASM', 'MIS', 'RSM', 'SUPPLY', 'CE', 'SNF', 'O2C', 'MDM', 'DT Team'];

        let hierarchy = [];
        let sequence = 1;
        
        let missingRoles = approvalHierarchy.filter(role => {
            const found = hierarchyPersons.find(p => p.role === role);
            if (role === 'ASM') {
                return !hierarchyPersons.some(p => p.role === 'ASM');
            }
            return !found;
        });
        
        if (missingRoles.length > 0) {
            req.session.notification = {
                type: 'error',
                message: `Missing users for roles: ${missingRoles.join(', ')}`
            };
            return res.redirect('/distributor_draft_list');
        }

        data.invite_send_flag = 1;
        data.invitecheckstatus = "send To RSEM";
        let resultNewDistributor = await addDistributor.addDistributor(data);
        let RegionName = await addDistributor.getTerritoryName(data.territory_id);

        let MarsId = await generateMarsId(RegionName.region_name, resultNewDistributor.insertId);

        await addDistributor.addMarsIdForDistributor(resultNewDistributor.insertId, MarsId);

        let distributor1 = await addDistributor.getDistributorByEmail(resultNewDistributor.insertId);
        
        for (let role of approvalHierarchy) {
            let person = hierarchyPersons.find(p => p.role === role);
        
            if (role === 'ASM' && hierarchy.find(h => h.role === 'ASM' && h.user_id === person.user_id)) {
                continue;
            }
        
            person.approval_sequence = sequence++;
        
            hierarchy.push(person.user_id);
        
            await addDistributor.insertApprovalWorkflow(
                distributor1[0].id,
                person.user_id,
                person.user_role_id,
                person
            );
        }
         
        if (missingRoles.length > 0) {
          req.session.notification = {
              type: 'error', 
              message: `Missing users for roles: ${missingRoles.join(', ')}`
          };
          return res.redirect('/Add_distributor');
      }
      
        
        

        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        await addDistributor.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover, req.body.email);

        applicationASM = null;
        asmInserted = false;


        let hierarchyData = await addDistributor.getUserById(hierarchy[0]);
        let distributorDetail = await addDistributor.getDistributorByEmail(resultNewDistributor.insertId);

        let AllEmailsToSend = await addDistributor.getAllEmailsToSend(hierarchyData.role_id, region_id);

        let emailList = AllEmailsToSend.map(row => row.email_id);

        let emailObj= {sendToEmail: emailList, sendToName: hierarchyData.employee_name, sendByName: UserName, firmName: distributorDetail[0].firmName, SendToRole: hierarchyData.role};

        await mailer.sendEmail(emailObj, "Rsemapproval");

        await insertApplicationHistory(distributor1[0].id, user_id, role_name, 1, hierarchyData.id, hierarchyData.role, hierarchyData.employee_name, "", "Submitted", "Distributor onboarding process initiated.");
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
      // let existingDistributor = await addDistributor.getDistributorByEmail(email);

      // if (existingDistributor.length > 0) {
      //     req.session.notification = { type: 'error', message: 'Distributor already exists!' };
      //     return res.status(400).json({ message: "Distributor already exists!" });
      // }

      // Attach user details from cookies
      req.body.aseemail = req.cookies.email;
      req.body.user_id = req.cookies.user_id;
      const userId = req.cookies.user_id;
      const role_name = req.cookies.role_name;

      // Save draft
      let resultNewDistributor = await addDistributor.addDistributor(req.body, "draft");

      let RegionName = await addDistributor.getTerritoryName(req.body.territory_id);

      let MarsId = await generateMarsId(RegionName.region_name, resultNewDistributor.insertId);

      await addDistributor.addMarsIdForDistributor(resultNewDistributor.insertId, MarsId);

      // Retrieve saved distributor ID
      let distributor = await addDistributor.getDistributorByEmail(resultNewDistributor.insertId);

      if (!distributor.length) {
          return res.status(500).json({ message: "Failed to retrieve distributor ID" });
      }

      await insertApplicationHistory(distributor[0].id, userId, role_name, 0, "", "", "", "", "Submitted", "Application created.");

      return res.status(200).json({ message: "Draft saved successfully!", distributorId: distributor[0].id });

  } catch (error) {
      console.error("Error saving draft:", error);
      return res.status(500).json({ message: "Error saving draft" });
  }
};




async function generateMarsId(regionName, insertId) {

    const regionInitial = regionName.trim().charAt(0).toUpperCase();
    const paddedId = String(insertId).padStart(6, '0');

    return `MW${regionInitial}${paddedId}`;
}


module.exports = {
    addDistributorView,
    createDistributor,
    distributorDraftList,
    saveDraft,
    territory,
    soTerritory
}