let dbconn = require("../../config/db");


const 
getDistributorList = async (user_id) => {
    try{
        const query = `
            SELECT taw.*, pi.*, 
                (SELECT COUNT(*) 
                    FROM tbl_approval_workflow t 
                    WHERE t.application_id = taw.application_id 
                    AND t.approval_sequence < taw.approval_sequence 
                    AND t.status = 'Pending') AS lower_pending
            FROM tbl_approval_workflow taw
            JOIN prospective_info pi ON pi.id = taw.application_id  
            WHERE taw.approver_id = ? 
            ORDER BY taw.approval_sequence ASC
        `;


        return new Promise((resolve, reject) => {
            dbconn.query(query, [user_id], (error, results) => { 5
              if (error) {
                console.error("Database error:", error);
                return reject(error);
              }
              if (results.length === 0) {
                return reject(new Error("User not found"));
              }
              return resolve(results); 
            });
          });
        } catch (error) {
          console.error("Error in selectQuery:", error);
          throw error; 
        }
};



module.exports={getDistributorList};