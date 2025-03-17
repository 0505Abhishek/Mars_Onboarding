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
      res.redirect("/page404/page505");
  }
};


const selectQuery = async (email) => {
  try {
    let query = `SELECT * FROM users WHERE email_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [email], (error, results) => { 5
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        if (results.length === 0) {
          return reject(new Error("User not found"));
        }
        return resolve(results[0]); 
      });
    });
  } catch (error) {
    console.error("Error in selectQuery:", error);
    throw error; 
  }
};


module.exports = { navbarviewesult, selectQuery };