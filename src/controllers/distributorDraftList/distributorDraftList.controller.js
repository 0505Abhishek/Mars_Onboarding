const addDistributor = require('../../models/addDistributor/addDistributor.model');
const dashboard = require('../../models/dashboard.model');

const distributorDraftList = async (req, res) => {
  try{
  let data = await dashboard.selectQuery(req.cookies.email);
  let allDistributor = await addDistributor.getDistributorDraftList(req.cookies.user_id, req.cookies.email);
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

module.exports = {
    distributorDraftList
}