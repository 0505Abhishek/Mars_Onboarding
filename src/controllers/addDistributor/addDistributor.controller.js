const addDistributor = require('../../models/addDistributor/addDistributor.model');
const dashboard = require('../../models/dashboard.model');

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
  
          const result = await addDistributor.addDistributor(data, "Invite sent to RSEM");
  
          // await addDistributor.insertApprovalWorkflow(result.insertId, hierarchy);
  
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
        let { id } = req.body;
        let reqBody = req.body;
        if (!id) {
            return res.status(400).send("Distributor ID is required");
        }

        let distributor = await addDistributor.getDistributorByEmail(req.body.email);

        if(distributor.length>0)
          {
          req.session.notification = { type: 'error', message: 'Distributor already exists!' };
          return res.redirect('/Add_distributor');
          }  

          const aseemail = req.cookies.email;
          const user_id = req.cookies.user_id;
          reqBody.aseemail=aseemail;
          reqBody.user_id=user_id;

        await addDistributor.addDistributor(reqBody,"draft");
        let distributorId = await addDistributor.getDistributorByEmail(req.body.email);

        return res.status(200).json({ message: "Draft saved successfully!", distributorId: distributorId[0].id });
        } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).send("Error saving draft");
    }
};

module.exports = {
    addDistributorView,
    createDistributor,
    distributorDraftList,
    saveDraft
}