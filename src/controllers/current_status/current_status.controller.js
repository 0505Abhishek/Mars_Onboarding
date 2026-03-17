const dashboard = require('../../models/dashboard.model');
const currentStatusCtrlModel = require("../../models/current_status/current_status.model");

const currentStatusCtrlView = async (req, res, next) => {
    try {

        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let allDistributor = await currentStatusCtrlModel.getDistributorList(req.cookies.user_id, req.cookies.region_id, req.cookies.role_id);
        
        let notification = req.session.notification || null;

        req.session.notification = null;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
            }

            res.render('currentStatus', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification, 
                distributors: allDistributor 
            });
        });

    } catch (error) {
        console.error("leadStatusView Error:", error);
        res.redirect('/dashboard');
    }
};


const currentStatusCtrlById = async (req, res, next) => {
    try {

        const distributorId = req.params.id;

        let data = await dashboard.selectQuery(req.cookies.email);
        let navbarviews = await dashboard.navbarviewesult(data);
        let allDistributor = await currentStatusCtrlModel.getDistributorRemarkHistory(distributorId);


        let notification = req.session.notification || null;

        req.session.notification = null;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
            }

            res.render('currentStatus/currentStatusById', { 
                token: navbarviews, 
                user: res.userDetail, 
                notification, 
                distributors: allDistributor 
            });
        });

    } catch (error) {
        console.error("leadStatusView Error:", error);
        res.redirect('/dashboard');
    }
};


const getByHierarchyRole = async (req, res, next) => {
  try {
    const userId = req.cookies.user_id;
    const roleId = req.cookies.role_id;

    const forwardedTo = req.query.forwardedTo; 

    let allDistributor = await approveIndox.getListByHierarchyRole(forwardedTo);

    if(allDistributor.length==0)
    {
      allDistributor=[];
    }
    res.json({ data: allDistributor });
  } catch (error) {
    console.error("DistributorListView Error:", error);
    next(error);
  }
};

module.exports={currentStatusCtrlView, getByHierarchyRole, currentStatusCtrlById}