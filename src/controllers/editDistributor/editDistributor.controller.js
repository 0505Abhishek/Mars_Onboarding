const editDistributor = require('../../models/editDistributor/editDistributor.model');
const dashboard = require('../../models/dashboard.model');


const editDistributorView = async (req, res) => {
    try{   
    let data = await dashboard.selectQuery(req.cookies.email);
    let navbarviews = await dashboard.navbarviewesult(data);
    let distributor = await editDistributor.getDistributorById(req.query.id, req.cookies.email);


    if(distributor.length==0 || distributor[0]?.invite_send_flag=="1")
    {
        req.session.notification = { type: 'warning', message: 'Golu Beta Msti Nhi !' };
        return res.redirect("/distributor_draft_list");
    }
    res.render('editDistributor', { token: navbarviews, notification: res.notification, distributorData: distributor[0] });
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
    const user_id = req.cookies.user_id;


    let hierarchy = [];
    let currentUserId = user_id;
    let sequence = 1;

    let applicationASM = null; 
    let asmInserted = false; 

    
    for (let i = 0; currentUserId; i++) {
        const user = await editDistributor.getUserById(currentUserId);

        if (!user) break;
    
        if (user.role === "ASM" && !applicationASM) {
            applicationASM = user;
            previousUserId = user;
            currentUserId = user.parent_id;
            continue;  
            
        }
    
        user.approval_sequence = sequence++;
        await editDistributor.insertApprovalWorkflow(req.query.id, user.id, user.role_id, user);

        if (user.role === "RSEM" && applicationASM && !asmInserted) {

            applicationASM.approval_sequence = sequence++;
            await editDistributor.insertApprovalWorkflow(req.query.id, applicationASM.id, applicationASM.role_id, applicationASM);
            asmInserted = true; 
        }

        previousUserId = user;
        currentUserId = user.parent_id;
    }
    

    applicationASM = null;
    asmInserted = false;

    

    if(distributor.length>0)
   {
        const data = req.body;
        const aseemail = req.cookies.email;
        const user_id = req.cookies.user_id;
        data.aseemail=aseemail;
        data.user_id=user_id;
        data.invitesend="";
        data.invite_send_flag=1;
        data.invitecheckstatus="send";
        const result = await editDistributor.updateDistributor(data,req.query.id, "Invite sent to RSEM");
        // const result1 = await editDistributor.updateDistributorHierarchy(req.cookies.user_id, req.query.id, 1, "approved");

        req.session.notification = { type: 'success', message: 'Invite sent to RSEM Successfully!' };
        return res.redirect('/distributor_draft_list');
   }

   return res.redirect('/distributor_draft_list');

}


const deleteDistributor = async(req,res)=>{
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
    
        res.redirect('/Add_distributor/distributor_draft_list'); 
    
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
        reqBody.aseemail=aseemail;
        reqBody.user_id=user_id;

        await editDistributor.updateDistributor(reqBody, id, "draft");

        return res.status(200).send("Draft saved successfully!");
    } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).send("Error saving draft");
    }
};

module.exports = { saveDraft };


module.exports = {
    editDistributorView,
    updateDistributor,
    deleteDistributor,
    saveDraft
}