const offboardStatus = require('../../models/offboardingStatus/offboardingStatus.model');
const dashboard = require('../../models/dashboard.model');

const offboardList = async (req, res) => {
  try {
    const role_id = req.cookies.role_id;
    const user_id = req.cookies.user_id;

    let data = await dashboard.selectQuery(req.cookies.email);
    let allData = await offboardStatus.getStatus(user_id, role_id);
    let navbarviews = await dashboard.navbarviewesult(data);

    const masterRoles = [
      "RSEM",
      "DT Team",
      "SNF",
      "distributor",
      "TAX GST",
      "distributor",
      "O2C",
      "distributor",
      "SNF",
      "O2C",
      "MDM",
      "RSM",
      "NSM",
      "AP TEAM"
    ];

    const appMap = {};

    allData.forEach(row => {

      if (!appMap[row.application_id]) {
        appMap[row.application_id] = {
          firmName: row.firmName || '',
          aseemail: row.aseemail || '',
          mars_code: row.mars_code || '',
          distributorName: row.distributorName || '',
          offboardStartDate: row?.offboardStartDate
            ? new Date(row.offboardStartDate).toISOString().slice(0, 10)
            : '',
          roleData: []
        };
      }

      appMap[row.application_id].roleData.push({
        role: row.role_name,
        status: row.status,
        date:
          row.update_at && row.update_at !== '0000-00-00 00:00:00'
            ? new Date(row.update_at).toDateString()
            : null
      });
    });

    
    const finalData = Object.entries(appMap).map(([appId, data]) => {

      const orderedRoles = masterRoles.map(roleName => {
        const matchIndex = data.roleData.findIndex(r => r.role === roleName);

        if (matchIndex !== -1) {
          const roleInfo = data.roleData[matchIndex];
          data.roleData.splice(matchIndex, 1);

          return roleInfo;
        }

        return {
          role: roleName,
          status: null,
          date: null
        };
      });
      

      return {
        application_id: appId,
        firmName: data.firmName,
        aseemail: data.aseemail,
        mars_code: data.mars_code,
        distributorName: data.distributorName,
        offboardStartDate: data.offboardStartDate,
        roles: orderedRoles,
        masterRoles
      };
    });


    res.render('offboardingStatus', {
      token: navbarviews,
      finalData:finalData,
      masterRoles:masterRoles
    });
    

  } catch (error) {
    console.error("Error in offboardList:", error);
    res.status(500).send("Internal Server Error");
  }
};



module.exports = { offboardList };
