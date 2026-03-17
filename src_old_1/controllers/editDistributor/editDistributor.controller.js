const editDistributor = require('../../models/editDistributor/editDistributor.model');
const dashboard = require('../../models/dashboard.model');
const mailer = require('../../util/sent_mail');
const {insertApplicationHistory} = require('../../models/SaveApplicationHistory/SaveApplicationHistory.model');


const editDistributorView = async (req, res) => {
    try{   
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    let distributor = await editDistributor.getDistributorById(req.query.id, req.cookies.email);
    let replacementOptions = await editDistributor.getAllDistributor();
    let territories = await editDistributor.getTerritory(req.cookies.user_id);

    if(distributor.length==0 || distributor[0]?.applicationPhase_Flag !== 0)
    {
        req.session.notification = { type: 'warning', message: 'You can not take action !' };
        return res.redirect("/distributor_draft_list");
    }
    res.render('editDistributor', { token: navbarviews, notification: res.notification, distributorData: distributor[0], replacementOptions, territories });
    req.session.notification = null;
  }catch(error)
  {
    console.log(error,"error");
    req.session.notification = { type: 'warning', message: 'Sorry You Can not Access this user Id !' };
    return res.redirect("/Add_distributor/distributor_draft_list");
  }

}

const updateDistributor = async(req,res)=>{

    let distributor = await editDistributor.getDistributorById(req.query.id, req.cookies.email);
    const territory_id = req.body.territory_id;
    const user_id = req.cookies.user_id;
    const role_name = req.cookies.role_name;
    const applicationId = req.query.id;


    if(distributor[0].invite_send_flag !== 1)
    {

        let hierarchyPersons = await editDistributor.getAllhierarchyPersons(territory_id);
        let approvalHierarchy = ['RSEM', 'ASM', 'MIS', 'RSM', 'CE', 'O2C', 'SNF', 'MDM', 'DT Team'];

        let hierarchy = [];
        let sequence = 1;
        
        
        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        let distributor1 = await editDistributor.getDistributorById(req.query.id, req.cookies.email);

        // Step 1: Check for missing roles first
        let missingRoles = approvalHierarchy.filter(role => {
            const found = hierarchyPersons.find(p => p.role === role);
            // Also check for duplicate ASM case
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
                
        for (let role of approvalHierarchy) {
            let person = hierarchyPersons.find(p => p.role === role);
        
            if (!person) {
                console.warn(`No person found for role: ${role}`);
                continue;
            }
        
            if (role === 'ASM' && hierarchy.find(h => h.role === 'ASM' && h.user_id === person.user_id)) {
                continue;
            }
        
            person.approval_sequence = sequence++;
            person.role = role; 
        
            hierarchy.push(person.user_id);
        
            await editDistributor.insertApprovalWorkflow(
                distributor1[0].id,
                person.user_id,
                person.user_role_id,
                territory_id,         
                person                
            );
        }
        
      await editDistributor.insertProspectiveLog(distributor1[0]);
      await editDistributor.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover, req.body.email);

        if(distributor.length>0)
        {
            const data = req.body;
            const aseemail = req.cookies.email;
            const user_id = req.cookies.user_id;
            const UserName = req.cookies.UserName;
            data.aseemail=aseemail;
            data.user_id=user_id;
            data.invitesend="";
            data.invite_send_flag=1;
            data.invitecheckstatus="send";


            let distributor = await editDistributor.getDistributorById(req.query.id, req.cookies.email);

            await editDistributor.insertProspectiveLog(distributor[0]);
            
            const result = await editDistributor.updateDistributor(data,req.query.id,'Pending');


            let RegionName = await editDistributor.getTerritoryName(data.territory_id);
    
            let MarsId = await generateMarsId(RegionName.region_name, req.query.id);
    
            await editDistributor.addMarsIdForDistributor(req.query.id, MarsId);

            let hierarchyData = await editDistributor.getUserById(hierarchy[0]);

            let distributorDetail =  await editDistributor.getDistributorById(req.query.id, req.cookies.email);

            let emailObj= {sendToEmail: hierarchyData?.email_id, sendToName: hierarchyData.employee_name, sendByName: UserName, firmName: distributorDetail[0].firmName, SendToRole: hierarchyData.role};
            
            await mailer.sendEmail(emailObj, "Rsemapproval");
            await insertApplicationHistory(applicationId, user_id, role_name, 1, hierarchyData.id, hierarchyData.role, hierarchyData.employee_name, "", "Submitted", "Distributor onboarding process initiated.");

            req.session.notification = { type: 'success', message: 'Invite sent to RSEM Successfully!' };
            return res.redirect('/distributor_draft_list');
        }
    }else if(distributor[0].invite_send_flag == 1){
        const data = req.body;
        
        const result = await editDistributor.updateDistributorAfterRsem(data,req.query.id);
    }

   return res.redirect('/distributor_draft_list');

}


const deleteDistributor = async(req,res)=>{
    try{
        let distributorId = req.query.id;
        
        if (!distributorId) {
            return res.status(400).send("Invalid request");
        }
    
        try {
            await editDistributor.deleteDistributor(distributorId);
            req.session.notification = { type: "success", message: "Distributor deleted successfully!" };
        } catch (error) {
            console.error("Error deleting distributor:", error);
            req.session.notification = { type: "error", message: "Error deleting distributor!" };
        }
    
        res.redirect('/distributor_draft_list'); 
    }
    catch(error){
        res.redirect('/distributor_draft_list'); 
    }
    
}



const saveDraft = async (req, res) => {
    try {
        let { id } = req.body;
        let reqBody = req.body;

        if (!id) {
            return res.status(400).send("Distributor ID is required");
        }

        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;
        const role_name = req.cookies.role_name;
        reqBody.aseemail=aseemail;
        reqBody.user_id=user_id;

        let distributor = await editDistributor.getDistributorById(id, req.cookies.email);
        
        await editDistributor.insertProspectiveLog(distributor[0]);

        if(distributor[0].invite_send_flag == 1){
            const data = req.body;
            const result = await editDistributor.updateDistributorAfterRsem(data, id);
        }else{
            let RegionName = await editDistributor.getTerritoryName(reqBody.territory_id);
            let MarsId = await generateMarsId(RegionName.region_name, id);

            await editDistributor.addMarsIdForDistributor(id, MarsId);
            await editDistributor.updateDistributor(reqBody, id, "draft");
        }

        return res.status(200).send("Draft saved successfully!");
    } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).send("Error saving draft");
    }
};


async function generateMarsId(regionName, insertId) {

    const regionInitial = regionName.trim().charAt(0).toUpperCase();
    const paddedId = String(insertId).padStart(6, '0');

    return `MW${regionInitial}${paddedId}`;
}

module.exports = {
    editDistributorView,
    updateDistributor,
    deleteDistributor,
    saveDraft
}