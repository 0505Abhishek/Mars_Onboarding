const dbconn = require("../../config/db");

const getDistributorList = async (role_id, region_id) => {
  const regionArray = Array.isArray(region_id)
    ? region_id
    : region_id
    ? region_id.split(",").map((r) => r.trim())
    : [];

  let query = `
    SELECT 
        offboardingDistributor.*, 
        offboardingDistributor.created_at AS offboardCreateDate,

        prospective_info.id AS applicationId,
        prospective_info.*,

        curr.*, 

        odist.reason_text,
        odist.noc_certificate,
        odist.regination_letter	,

        NOT EXISTS (
            SELECT 1 
            FROM offboardHierarchy prev
            WHERE prev.application_id = curr.application_id
              AND prev.sequence < curr.sequence
            GROUP BY prev.sequence, prev.application_id
            HAVING COUNT(*) != SUM(CASE WHEN prev.is_final_approval = 1 THEN 1 ELSE 0 END)
        ) AS can_approve

    FROM offboardingDistributor
    INNER JOIN prospective_info 
        ON prospective_info.id = offboardingDistributor.application_id
    INNER JOIN offboardHierarchy curr 
        ON curr.application_id = prospective_info.id  

    LEFT JOIN offboardingdistributors odist
        ON odist.application_id = offboardingDistributor.application_id

    WHERE distributor_flag = ? 
      AND curr.role_id = ?`;

  const params = [1, role_id];

  if (regionArray.length > 0) {
    const placeholders = regionArray.map(() => "?").join(",");
    query += ` AND prospective_info.region_id IN (${placeholders})`;
    params.push(...regionArray);
  }

  return new Promise((resolve, reject) => {
    dbconn.query(query, params, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      resolve(results);
    });
  });
};

const getDistributorById = async (application_id) => {
  try {
    let query = `select * from prospective_info 
                 inner join documenttable on documenttable.application_id = prospective_info.id
                 where prospective_info.id = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(query, application_id, (error, results) => {
        if (error) {
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

const getDistributorData = async (application_id) => {
  try {
    let query = `select *,  offboardingDistributor.Asset_Reconciliation as Asset_Reco from offboard_distributor_information 
                 inner join offboardingDistributor on offboardingDistributor.application_id = offboard_distributor_information.applicationId
                 inner join offboarding_Application_detail on offboarding_Application_detail.application_id = offboard_distributor_information.applicationId
                 where offboard_distributor_information.applicationId = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(query, application_id, (error, results) => {
        if (error) {
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

// const getAction = async(application_id)=>{
//     try{
//     let query = `select * from offboardHierarchy
//                  where application_id = ? and approver_id = ? and is_final_approval`;

//     return new Promise((resolve, reject)=>{
//       dbconn.query(query,application_id,(error,results)=>{
//          if(error)
//          {
//           return reject(error);
//          }
//          return resolve(results);
//       })
//     })
//    }
//    catch(error){
//     console.error("Error in selectQuery:", error);
//     throw error;
//    }
// }

// const insertOffboardInitiation = async (
//   application_id,
//   offboard_type,
//   reason,
//   initiated_by,
//   initiated_role
// ) => {
//   try {
//     let query = `
//       INSERT INTO db_offboard
//       (application_id, offboard_type, reason, initiated_by, initiated_role, asm_status, created_at)
//       VALUES (?, ?, ?, ?, ?, '1', NOW())
//     `;

//     return new Promise((resolve, reject) => {
//       dbconn.query(
//         query,
//         [application_id, offboard_type, reason, initiated_by, initiated_role],
//         (error, results) => {
//           if (error) {
//             return reject(error);
//           }
//           return resolve(results);
//         }
//       );
//     });
//   } catch (error) {
//     console.error("Error in insertOffboardInitiation:", error);
//     throw error;
//   }
// };

// const insertResignation = async (
//   applicationId,
//   firmName,
//   distributorName,
//   email,
//   contactNo,
//   nocFile,
//   gsvAverage,
//   reason,
//   userId,
//   initiatedRole
// ) => {
//   try {
//     const query = `
//       INSERT INTO db_offboard
//       (application_id, firm_name, distributor_name, email, contact_no, noc_file, gsv_average, reason, initiated_by, initiated_role, offboard_type, asm_status, created_at)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'resignation', '1', NOW())
//     `;

//     return new Promise((resolve, reject) => {
//       dbconn.query(
//         query,
//         [
//           applicationId,
//           firmName,
//           distributorName,
//           email,
//           contactNo,
//           nocFile,
//           gsvAverage,
//           JSON.stringify(reason),
//           userId,
//           initiatedRole, // ✅ added here
//         ],
//         (err, results) => {
//           if (err) {
//             console.error("DB Error insertResignation:", err);
//             return reject(err);
//           }
//           resolve(results);
//         }
//       );
//     });
//   } catch (err) {
//     console.error("Error insertResignation:", err);
//     throw err;
//   }
// };

// approverModel.js में ये replace कर दो

const checkOffboardingInitiated = async (application_id) => {
  try {
    let query = `
      SELECT 1 
      FROM offboardingdistributors
      WHERE application_id = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0); // true अगर already initiated है
      });
    });
  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};

const checkResignationSubmitted = async (application_id) => {
  try {
    let query = `
      SELECT 1 
      FROM offboarding_resignation_details 
      WHERE application_id = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });
  } catch (error) {
    console.error("Error in checkResignationSubmitted:", error);
    throw error;
  }
};

const insertOffboardInitiation = async (
  application_id,
  offboard_type,
  initiated_by,
  initiated_role,
  reasons = []
) => {
  try {
    const reasonText =
      reasons && reasons.length > 0 ? JSON.stringify(reasons) : null;

    const query = `
      INSERT INTO offboardingdistributors
      (application_id, offboard_type, initiator_id, initiator_role, reason_text)
      VALUES (?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [
          application_id,
          offboard_type,
          initiated_by,
          initiated_role,
          reasonText,
        ],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });
  } catch (error) {
    console.error("Error in insertOffboardInitiation:", error);
    throw error;
  }
};

// ================================
// Resignation Details
// ================================
const insertResignationDetails = async ({
  application_id,
  firm_name,
  distributor_name,
  email,
  contact_no,
  noc_file_path,
  resignation_letter,
  gsv_average,
  low_turnover = 0,
  low_roi = 0,
  limitation_in_investment = 0,
  db_going_out_of_business = 0,
  increasing_cost = 0,
  not_ready_for_additional_infrastructure = 0,
}) => {
  const query = `
    INSERT INTO offboarding_resignation_details
    (application_id, firm_name, distributor_name, email, contact_no, 
     noc_file_path, resignation_letter, gsv_average,
     low_turnover, low_roi, limitation_in_investment, db_going_out_of_business,
     increasing_cost, not_ready_for_additional_infrastructure, submitted_by_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      firm_name = VALUES(firm_name),
      distributor_name = VALUES(distributor_name),
      email = VALUES(email),
      contact_no = VALUES(contact_no),
      noc_file_path = VALUES(noc_file_path),
      resignation_letter = VALUES(resignation_letter),
      gsv_average = VALUES(gsv_average),
      low_turnover = VALUES(low_turnover),
      low_roi = VALUES(low_roi),
      limitation_in_investment = VALUES(limitation_in_investment),
      db_going_out_of_business = VALUES(db_going_out_of_business),
      increasing_cost = VALUES(increasing_cost),
      not_ready_for_additional_infrastructure = VALUES(not_ready_for_additional_infrastructure),
      submitted_by_role = VALUES(submitted_by_role)
  `;

  const values = [
    application_id,
    firm_name,
    distributor_name,
    email,
    contact_no,
    noc_file_path || null,
    resignation_letter || null,
    gsv_average,
    low_turnover,
    low_roi,
    limitation_in_investment,
    db_going_out_of_business,
    increasing_cost,
    not_ready_for_additional_infrastructure,
    "Distributor",
  ];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updateOffboardStatus = async (application_id, status = "rsem_review") => {
  try {
    const query = `
      UPDATE offboardingdistributors
      SET status = ?
      WHERE application_id = ?
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [status, application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in updateOffboardStatus:", error);
    throw error;
  }
};

const saveDbLinkToken = async (application_id, token, expiry_date) => {
  const query = `
    INSERT INTO offboard_db_links 
    (application_id, token, expiry_date, created_at) 
    VALUES (?, ?, ?, NOW())
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, token, expiry_date], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

const getDistributorDetails = async (application_id) => {
  const query = `
    SELECT firmName, distributorName, email 
    FROM prospective_info 
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || {});
    });
  });
};

// Bonus: link check karne ke liye (jab DB click karega)
const validateDbLink = async (token) => {
  const query = `
    SELECT application_id 
    FROM offboard_db_links 
    WHERE token = ? 
    AND expiry_date > NOW()
    AND used = 0
    LIMIT 1
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [token], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]?.application_id || null);
    });
  });
};

const getDistributorByToken = async (token) => {
  const query = `
    SELECT 
      odl.application_id,
      odl.token,
      odl.expiry_date,
      odl.used,
      pi.firmName,
      pi.distributorName,
      od.offboard_type,
      od.reason_text
    FROM offboard_db_links odl
    INNER JOIN offboardingdistributors od 
      ON od.application_id = odl.application_id
    INNER JOIN prospective_info pi 
      ON pi.id = odl.application_id
    WHERE odl.token = ?
      AND odl.expiry_date > NOW()
      AND odl.used = 0
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [token], (err, rows) => {
      if (err) {
        console.error("DB Error in getDistributorByToken:", err);
        return reject(err);
      }

      const row = rows[0] || null;

      if (row) {
        if (row.reason_text) {
          try {
            row.termination_reasons = JSON.parse(row.reason_text);
          } catch (e) {
            console.warn("Invalid JSON in reason_text:", row.reason_text);
            row.termination_reasons = [];
          }
        } else {
          row.termination_reasons = [];
        }
        delete row.reason_text;
      }

      resolve(row);
    });
  });
};

const updateNocCertificate = async (application_id, filePath) => {
  const query = `
    UPDATE offboardingdistributors
    SET noc_certificate = ?
    WHERE application_id = ?
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [filePath, application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getNocCertificate = async (application_id) => {
  const query = `
    SELECT noc_certificate 
    FROM offboardingdistributors 
    WHERE application_id = ?
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};



module.exports = {
  getDistributorList,
  getDistributorById,
  getDistributorData,
  checkOffboardingInitiated,
  checkResignationSubmitted,
  insertOffboardInitiation,
  insertResignationDetails,
  updateOffboardStatus,
  saveDbLinkToken,
  getDistributorDetails,
  validateDbLink,
  getDistributorByToken,
  updateNocCertificate,
  getNocCertificate,
};
