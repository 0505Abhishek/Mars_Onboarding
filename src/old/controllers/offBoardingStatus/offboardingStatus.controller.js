const offboardStatus = require('../../models/offboardingStatus/offboardingStatus.model');
const dashboard = require('../../models/dashboard.model');

const offboardList = async (req, res) => {
  try {
    const role_id = req.cookies.role_id;
    const user_id = req.cookies.user_id;
    let data = await dashboard.selectQuery(req.cookies.email);
    let allData = await offboardStatus.getStatus(user_id, role_id);
    let navbarviews = await dashboard.navbarviewesult(data);

    const roleSet = new Set();
    const appMap = {};

    allData.forEach(row => {
      roleSet.add(row.role_name);

      if (!appMap[row.application_id]) {
        appMap[row.application_id] = {};
      }

      // Add real role data
      appMap[row.application_id][row.role_name] = {
        status: row.status,
        firmName: row.firmName,
        aseemail: row.aseemail,
        mars_code: row.mars_code,
        distributorName: row.distributorName,
        offboardStartDate: new Date(row?.offboardStartDate).toISOString().slice(0, 10),
        date: row.update_at === '0000-00-00 00:00:00' ? null : new Date(row.update_at).toDateString()
      };

      appMap[row.application_id]["asm"] = {
        status: "APPROVED",
        firmName: row.firmName,
        aseemail: row.aseemail,
        mars_code: row.mars_code,
        distributorName: row.distributorName,
        offboardStartDate: new Date(row?.offboardStartDate).toISOString().slice(0, 10),
        date: row?.offboardStartDate === '0000-00-00 00:00:00' ? null : new Date(row?.offboardStartDate).toDateString()
      };
      roleSet.add("asm");

      const isValidDisDate = row.offboard_dis_date && row.offboard_dis_date !== '0000-00-00 00:00:00';

      appMap[row.application_id]["DB"] = {
        status: isValidDisDate ? "APPROVED" : "PENDING",
        firmName: row.firmName,
        aseemail: row.aseemail,
        mars_code: row.mars_code,
        distributorName: row.distributorName,
        offboardStartDate: new Date(row?.offboardStartDate).toISOString().slice(0, 10),
        date: isValidDisDate ? new Date(row.offboard_dis_date).toDateString() : null
      };
      roleSet.add("DB");
    });


    const roles = ["asm", "DB", ...Array.from(roleSet).filter(role => role !== "asm" && role !== "DB" )];

    const finalData = Object.entries(appMap).map(([appId, roleData]) => {
      const firstRole = Object.values(roleData)[0];
      return {
        application_id: appId,
        roles: roleData,
        firmName: firstRole?.firmName || '',
        aseemail: firstRole?.aseemail || '',
        mars_code: firstRole?.mars_code,
        distributorName: firstRole?.distributorName,
        offboardStartDate: firstRole?.offboardStartDate
      };
    });

    res.render('offboardingStatus', { token: navbarviews, finalData, roles });
  } catch (error) {
    console.error("Error in offboardList:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = { offboardList };
