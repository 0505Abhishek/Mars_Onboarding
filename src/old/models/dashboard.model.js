const dbconn = require("../config/db");


const navbarviewesult = async (data) => {
  try {
      let role_id = data.role_id;

      let userEmail = data.id;


      let query = `
      SELECT tbl_role_permission.*, users.email_id, users.role, users.role_id, 
      users.employee_name as employeename, tbl_role.role,tbl_role.display_name
      FROM tbl_role_permission
      JOIN users ON FIND_IN_SET(tbl_role_permission.role_id, users.role_id)
      JOIN tbl_role ON tbl_role.id = tbl_role_permission.role_id
      WHERE FIND_IN_SET(tbl_role_permission.role_id, ?) AND users.id = ?
      GROUP BY tbl_role_permission.module_name
      `;

      return new Promise((resolve, reject) => {
          dbconn.query(query, [role_id, userEmail], (error, result) => {
              if (error) {
                  return reject(error);
              }
              return resolve(result);
          });
      });
  } catch (error) {
      console.error("Error in navbarviewesult:", error);
      res.redirect("/");
  }
};

const selectQuery = async (email) => {
  try {
    let query = `SELECT * FROM users WHERE email_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [email], (error, results) => { 
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results[0]); 
      });
    });
  } catch (error) {
    console.error("Error in selectQuery:", error);
    throw error; 
  }
};


const getOnboardData = async (regionIds) => {
  try {

    const placeholders = regionIds.map(() => '?').join(','); 

    const query = `SELECT * FROM prospective_info WHERE region_id IN (${placeholders})`;

    return new Promise((resolve, reject) => {
      dbconn.query(query, regionIds, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        resolve(results);
      });
    });

  } catch (error) {
    console.error("Error in dashboardQuery:", error);
    throw error;
  }
};


const getOffboardData = async (regionIdString) => {
  try {

    const regionIds = regionIdString.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));

    const placeholders = regionIds.map(() => '?').join(','); 

    const query = `SELECT offboardingDistributor.offboard_flag, offboardingDistributor.distributor_flag, prospective_info.* FROM prospective_info 
                   Inner Join offboardingDistributor on offboardingDistributor.application_id =  prospective_info.id
                    WHERE type = 'ONBOARDING' and offboarding_flag = 1 and region_id IN (${placeholders})`;

    return new Promise((resolve, reject) => {
      dbconn.query(query, regionIds, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        resolve(results);
      });
    });

  } catch (error) {
    console.error("Error in dashboardQuery:", error);
    throw error;
  }
};
module.exports = { navbarviewesult, selectQuery, getOnboardData, getOffboardData };