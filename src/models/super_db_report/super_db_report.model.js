const dbconn = require("../../config/db");


const getdata = async () => {
  try {
    let query = `SELECT users.employee_name, s_tbl_territory_master.territory_name, tbl_approval_workflow.cdCode, prospective_info.*, prospective_info.id as pid FROM prospective_info
                 left join tbl_approval_workflow on tbl_approval_workflow.application_id = prospective_info.id
                 left join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id
                 left join users on users.id = prospective_info.user_id
                 WHERE  1=1 and prospective_info.final_flag = 1 and tbl_approval_workflow.approver_role_id = 8`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }

        return resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in selectQuery:", error);
    throw error;
  }
};

module.exports = {getdata};
 
