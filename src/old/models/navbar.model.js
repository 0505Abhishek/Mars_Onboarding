const dbconn = require("../config/db");


const navbarviewesult = async (data) => {
  try {
    
      let role_id = data.role_id;
      let userEmail = data.id;
      let query = `
      SELECT s_tbl_role_permission.*, users.email_id, users.role, users.role_id, 
      users.employee_name as employeename, tbl_role.role,tbl_role.display_name
      FROM s_tbl_role_permission
      JOIN s_tbl_user as users ON FIND_IN_SET(s_tbl_role_permission.role_id, users.role_id)
      JOIN tbl_role ON tbl_role.id = s_tbl_role_permission.role_id
      WHERE FIND_IN_SET(s_tbl_role_permission.role_id, ?) AND users.id = ?
      GROUP BY s_tbl_role_permission.module_name
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
      throw error; 
      //res.redirect("/");
  }
};
const selectQuery = async (email) => {
    try {
      let query = `SELECT * FROM s_tbl_user WHERE email_id = ?`;
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

module.exports = { navbarviewesult,selectQuery };