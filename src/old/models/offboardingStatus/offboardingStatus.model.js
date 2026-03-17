const dbconn = require("../../config/db");

const getStatus = async (user_id, role_id) => {
  try {
    let query = '';
    let values = [];


     if (role_id === '7' || role_id === '9') {
      query = `
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
          offboardingDistributor.created_at AS offboardStartDate,
          offboard_distributor_information.insertAt AS offboard_dis_date
        FROM offboardHierarchy oh
        INNER JOIN prospective_info pi ON pi.id = oh.application_id
        LEFT JOIN offboardingDistributor ON offboardingDistributor.application_id = pi.id
        LEFT JOIN offboard_distributor_information ON offboard_distributor_information.applicationId = pi.id
        WHERE oh.application_id IN (
          SELECT application_id FROM offboardHierarchy WHERE role_id = ?
        )
        ORDER BY oh.sequence asc;
      `;
      values = [role_id];
    } else {
      query = `
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
          offboardingDistributor.created_at AS offboardStartDate,
          offboard_distributor_information.insertAt AS offboard_dis_date
        FROM offboardHierarchy oh
        INNER JOIN prospective_info pi ON pi.id = oh.application_id
        LEFT JOIN offboardingDistributor ON offboardingDistributor.application_id = pi.id
        LEFT JOIN offboard_distributor_information ON offboard_distributor_information.applicationId = pi.id
        WHERE oh.application_id IN (
          SELECT application_id FROM offboardHierarchy WHERE approver_id = ?
          UNION
          SELECT id AS application_id FROM prospective_info WHERE user_id = ?
        )
        ORDER BY oh.sequence ASC;
      `;
      values = [user_id, user_id];
    }

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



module.exports={getStatus}