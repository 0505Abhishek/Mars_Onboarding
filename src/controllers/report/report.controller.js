const dashboard = require('../../models/dashboard.model');

const reportView = async(req,res)=>{

      try {
          let data = await dashboard.selectQuery(req.cookies.email);
          let navbarviews = await dashboard.navbarviewesult(data);
          
           res.render('report', { token: navbarviews });
     }catch(error){
        console.error("DistributorListView Error:", error);
     }


}

module.exports = {reportView};