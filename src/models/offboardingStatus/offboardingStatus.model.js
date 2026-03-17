const dbconn = require("../../config/db");

const getStatus = async (user_id, role_id) => {
  try {
    const query = `
      SELECT
        pi.firmName,
        pi.aseemail,
        pi.mars_code,
        pi.distributorName,
        oh.application_id,
        oh.role_name,
        oh.status,
        oh.update_at,
        oh.sequence,
        oh.create_at AS offboardStartDate
      FROM offboardHierarchy oh
      INNER JOIN prospective_info pi 
        ON pi.id = oh.application_id
      WHERE oh.application_id IN (
        SELECT application_id 
        FROM offboardHierarchy 
        WHERE approver_id = ?
        
        UNION
        
        SELECT id AS application_id 
        FROM prospective_info 
        WHERE user_id = ?
      )
      ORDER BY oh.application_id, oh.sequence ASC;
    `;

    const values = [user_id, user_id];

    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });

  } catch (error) {
    console.error("Error in getStatus:", error);
    throw error;
  }
};


module.exports = { getStatus };



module.exports={getStatus}