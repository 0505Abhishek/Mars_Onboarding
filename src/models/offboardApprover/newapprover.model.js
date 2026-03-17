const connection = require("../../config/db");
const dbconn = require("../../config/db");

const getDistributorList = async (role_id, region_id) => {
  const regionArray = Array.isArray(region_id)
    ? region_id
    : region_id
      ? region_id.split(",").map((r) => r.trim())
      : [];

  let query = `
    SELECT 
        prospective_info.id AS applicationId,
        prospective_info.*,
        odist.noc_certificate,
        odist.offboard_type,
        odist.regination_letter,
        odist.status AS offboard_status,
        odist.reason_text AS offboarding_reason,
        ord.gsv_average,
        ord.low_turnover,
        ord.low_roi,
        ord.limitation_in_investment,
        ord.db_going_out_of_business,
        ord.increasing_cost,
        ord.not_ready_for_additional_infrastructure,
        ord.resignation_letter AS resignation_letter,
        ord.noc_file_path AS noc_file_path,
        odist.flag,
        odist.dt_team_flag,
        odist.db_replace_status,
        odist.replacementstatus,
        odist.confirm_asset_status,
        odist.exit_interview_completed,
        odist.rsm_action_btn,
        odist.gst_reversal,
        odist.created_at,
        odist.total_complete_approval_level,
        odist.db_response_status,
        odist.db_deadline,
        odist.ap_action_status,
        odist.ap_assigned_at,
        odist.ap_deadline,
        fnf.signed_fnf_path,
        fnf.status AS fnf_status,
        dbr.is_replacement,
        dbr.type AS claim_type,
        dbr.amount AS claim_amount

    FROM prospective_info
    LEFT JOIN offboardingdistributors odist
        ON odist.application_id = prospective_info.id
        LEFT JOIN offboarding_resignation_details ord
    ON ord.application_id = prospective_info.id
      LEFT JOIN fnf_submissions fnf
    ON fnf.application_id = prospective_info.id
      LEFT JOIN db_replacements dbr
      ON dbr.application_id = prospective_info.id
    WHERE prospective_info.final_flag = ?`;

  const params = [1];

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

const checkOffboardingInitiated = async (application_id) => {
  try {
    let query = `
      SELECT * 
      FROM offboardingdistributors
      WHERE application_id = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results);
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

// const insertOffboardInitiation = async (
//   application_id,
//   offboard_type,
//   initiated_by,
//   initiated_role,
//   reasons = [],
// ) => {
//   try {
//     const reasonText =
//       reasons && reasons.length > 0 ? JSON.stringify(reasons) : null;

//     const query = `
//       INSERT INTO offboardingdistributors
//       (application_id, offboard_type, initiator_id, initiator_role, reason_text)
//       VALUES (?, ?, ?, ?, ?)
//     `;

//     return new Promise((resolve, reject) => {
//       dbconn.query(
//         query,
//         [
//           application_id,
//           offboard_type,
//           initiated_by,
//           initiated_role,
//           reasonText,
//         ],
//         (error, results) => {
//           if (error) return reject(error);
//           resolve(results);
//         },
//       );
//     });
//   } catch (error) {
//     console.error("Error in insertOffboardInitiation:", error);
//     throw error;
//   }
// };

const insertOffboardInitiation = async (
  application_id,
  offboard_type,
  initiated_by,
  initiated_role,
  reasons = [],
) => {
  try {
    const reasonText =
      reasons && reasons.length > 0 ? JSON.stringify(reasons) : null;

    const query = `
      INSERT INTO offboardingdistributors
      (
        application_id,
        offboard_type,
        initiator_id,
        initiator_role,
        reason_text,
        last_approval_action_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
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
          initiated_by,
        ],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
  } catch (error) {
    console.error("Error in insertOffboardInitiation:", error);
    throw error;
  }
};

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

const getDistributorDetailsrole = async (application_id) => {
  const query = `
    SELECT 
      firmName,
      mars_code, 
      distributorName, 
      email,
      territory_id
    FROM prospective_info 
    WHERE id = ?
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, rows) => {
      if (err) return reject(err);
      if (rows.length === 0) {
        resolve(null);
      } else {
        resolve(rows[0]);
      }
    });
  });
};

const getAllhierarchyPersons = async (id) => {
  try {
    return new Promise((resolve, reject) => {
      const query = `SELECT s_tbl_user_territories.user_id, s_tbl_user_territories.user_role_id, users.email_id, tbl_role.role FROM s_tbl_user_territories
            INNER JOIN users ON users.id = s_tbl_user_territories.user_id
            INNER JOIN tbl_role ON tbl_role.role_id = s_tbl_user_territories.user_role_id
            where s_tbl_user_territories.territory_id = ?
            group by s_tbl_user_territories.user_role_id`;

      dbconn.query(query, [id], (error, results) => {
        if (error) {
          console.error("Database error:", error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const deleteExistingWorkflow = async (application_id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM offboardHierarchy WHERE application_id = ?`;
    dbconn.query(query, [application_id], (err, result) => {
      if (err) {
        console.error("Error deleting old workflow:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const insertOffboardApprovalWorkflow = async (data) => {
  const query = `
    INSERT INTO offboardHierarchy 
    (application_id, territory_id, role_id, role_name, approver_id, status, remark, sequence, is_final_approval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.application_id,
    data.territory_id,
    data.role_id,
    data.role_name,
    data.approver_id,
    data.status || "PENDING",
    data.remark,
    data.sequence,
    data.is_final_approval || 0,
  ];

  return await dbconn.query(query, values);
};

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
      pi.email,
      pi.contactNumber,
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

const activateRsemPending = async (application_id) => {
  const query = `
    UPDATE offboardHierarchy 
    SET status = 'PENDING'
    WHERE application_id = ? 
      AND role_name = 'RSEM' 
      AND sequence = 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) {
        console.error("Error activating RSEM:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};

const getRsemPendingRow = async (application_id, approver_id) => {
  if (!application_id) {
    throw new Error("application_id is required");
  }

  const query = `
    SELECT * FROM offboardingdistributors 
    join offboardHierarchy on offboardingdistributors.application_id = offboardHierarchy.application_id
    WHERE offboardingdistributors.application_id = ? 
      AND offboardingdistributors.applicationStatus IN ('PENDING', 'NOT_STARTED', 'REJECTED')
      AND offboardHierarchy.approver_id = ?
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, approver_id], (err, rows) => {
      if (err) {
        console.error("SQL Error in getRsemPendingRow:", err);
        return reject(err);
      }
      resolve(rows[0] || null);
    });
  });
};


const getRsemPendingRowRSM = async (application_id, approver_id) => {
  if (!application_id) {
    throw new Error("application_id is required");
  }

  const query = `
    SELECT *
    FROM offboardHierarchy
    WHERE application_id = ?
      AND approver_id = ?
      AND status = 'PENDING'
    ORDER BY sequence ASC
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, approver_id], (err, rows) => {
      if (err) {
        console.error("SQL Error in getRsemPendingRow:", err);
        return reject(err);
      }
      resolve(rows[0] || null);
    });
  });
};

const getNextSequenceRow = async (application_id, sequence) => {
  const query = `
    SELECT * FROM offboardHierarchy 
    WHERE application_id = ? AND sequence = ?
    order by id asc
    LIMIT 1
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, sequence], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
};

const updateWorkflowRow = async (row_id, updates) => {
  let fields = [];
  let values = [];
  if (updates.status) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.remark) {
    fields.push("remark = ?");
    values.push(updates.remark);
  }
  if (updates.is_final_approval) {
    fields.push("is_final_approval = ?");
    values.push(updates.is_final_approval);
  }
  if (updates.total_level) {
    fields.push("sequence = ?");
    values.push(updates.total_level);
  }
  if (updates.fnf_flag) {
    fields.push("fnf_flag = ?");
    values.push(updates.fnf_flag);
  }

  const query = `UPDATE offboardHierarchy SET ${fields.join(
    ", ",
  )} WHERE id = ? LIMIT 1`;
  values.push(row_id);

  console.log("Update Workflow Query:", query);
  console.log("Update Values:", values);

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const insertWorkflowHistory = async (data) => {
  const query = `
    INSERT INTO offboardhierarchy_history 
    (application_id, approver_id, approver_role, action, remarks)
    VALUES (?, ?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(
      query,
      [
        data.application_id,
        data.approver_id,
        data.approver_role,
        data.action,
        data.remarks,
      ],
      (err, result) => {
        if (err) {
          console.error("History Insert Error:", err);
          return reject(err);
        }
        resolve(result);
      },
    );
  });
};

const updateMainOffboardStatus = async (application_id, rsem_status) => {
  const query = `UPDATE offboardingdistributors SET rsem_status = ?,status = ? WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [rsem_status, "1", application_id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const getTerminationReasons = async () => {
  try {
    const query = `
      SELECT id, reason_text 
      FROM termination_reasons 
      WHERE is_active = 1 
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, (error, results) => {
        if (error) {
          console.error("Database error in getTerminationReasons:", error);
          return reject(error);
        }
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in getTerminationReasons:", error);
    throw error;
  }
};
const getDistributorListdata = async (applicationId) => {
  const query = `
    SELECT 
      p.id AS applicationId,
      p.mars_code,
      p.firmName,
      p.email,

      h.approver_role,
      h.remarks,
      h.action,
      h.create_date AS action_date

    FROM prospective_info p

    LEFT JOIN offboardhierarchy_history h
      ON h.application_id = p.id

    WHERE p.id = ? 
      AND p.final_flag = 1

    ORDER BY h.id ASC
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [applicationId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const replacementModel = async (data) => {
  return new Promise((resolve, reject) => {
    const checkQuery = `
      SELECT replace_status 
      FROM db_replacements
      WHERE application_id = ?
    `;

    dbconn.query(checkQuery, [data.application_id], (err, rows) => {
      if (err) return reject(err);

      if (rows.length > 0) {

        const updateQuery = `
          UPDATE db_replacements
          SET is_replacement = ?,
              replacement_db_name = ?,
              replacement_db_code = ?,
              replace_status = 1,
              action_date = ?
          WHERE application_id = ?
        `;

        const params = [
          data.is_replacement,
          data.replacement_db_name || null,
          data.replacement_db_code || null,
          data.action_date,
          data.application_id,
        ];

        dbconn.query(updateQuery, params, (err2, result) => {
          if (err2) return reject(err2);
          resolve({ updated: true });
        });

      } else {

        const insertQuery = `
          INSERT INTO db_replacements
          (
            application_id,
            is_replacement,
            replacement_db_name,
            replacement_db_code,
            replace_status,
            action_date
          )
          VALUES (?, ?, ?, ?, 1, ?)
        `;

        const params = [
          data.application_id,
          data.is_replacement,
          data.replacement_db_name || null,
          data.replacement_db_code || null,
          data.action_date,
        ];

        dbconn.query(insertQuery, params, (err3, result) => {
          if (err3) return reject(err3);
          resolve({ inserted: true });
        });
      }
    });
  });
};

const saveAssetReconciliationModel = async (data) => {
  return new Promise((resolve, reject) => {
    const checkQuery = `
      SELECT asset_recon_status 
      FROM db_replacements
      WHERE application_id = ?
    `;

    dbconn.query(checkQuery, [data.application_id], (err, rows) => {
      if (err) return reject(err);

      if (rows.length > 0) {
        if (rows[0].asset_recon_status === 1) {
          return resolve({ alreadyUpdated: true });
        } else {
          const updateQuery = `
            UPDATE db_replacements
            SET asset_reconciliation = ?,
                asset_transfer_done = ?,
                asset_remarks = ?,
                asset_recon_status = 1,
                action_date = ?
            WHERE application_id = ?
          `;
          const params = [
            data.asset_reconciliation,
            data.asset_transfer_done,
            data.asset_remarks,
            data.action_date,
            data.application_id,
          ];

          dbconn.query(updateQuery, params, (err2, result) => {
            if (err2) return reject(err2);
            resolve({ updated: true });
          });
        }
      } else {
        const insertQuery = `
          INSERT INTO db_replacements
            (application_id, asset_reconciliation, asset_transfer_done, asset_remarks, asset_recon_status, action_date)
          VALUES (?, ?, ?, ?, 1, ?)
        `;
        const params = [
          data.application_id,
          data.asset_reconciliation,
          data.asset_transfer_done,
          data.asset_remarks,
          data.action_date,
        ];

        dbconn.query(insertQuery, params, (err3, result) => {
          if (err3) return reject(err3);
          resolve({ inserted: true });
        });
      }
    });
  });
};

const updateProspectiveInfo = async (
  her,
  len,
  first,
  lastApprover,
  application_id,
) => {
  try {
    let userIdsString = JSON.stringify(her);

    let query = `UPDATE offboardingdistributors 
                     SET total_approval_action_user_ids = ?, 
                         total_approval_level = ?, 
                         total_complete_approval_level = ?, 
                         approval_action_user_id = ?, 
                         final_approver = ? 
                     WHERE application_id = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [userIdsString, len, 1, first, lastApprover, application_id],
        (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results);
        },
      );
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};


const getActionButtons = async (
  id,
  user_id,
  role_name = null,
  sequence = null,
) => {
  try {
    let query;
    let params;

    if (role_name == "NSM" || role_name == "RSM") {
      query = `
        SELECT 
          taw.*,
          pi.*
        FROM offboardHierarchy taw
        JOIN offboardingdistributors pi ON pi.application_id = taw.application_id
        WHERE taw.application_id IN (?) AND pi.total_complete_approval_level = ? AND taw.role_name = ? AND taw.is_final_approval = 0
        ORDER BY taw.sequence ASC
        
      `;
      params = [id, sequence, role_name];
      console.log(params, "params");
    } else {
      query = `
        SELECT 
          taw.*,
          pi.*
        FROM offboardHierarchy taw
        JOIN offboardingdistributors pi ON pi.application_id = taw.application_id
        WHERE taw.application_id IN (?) AND taw.approver_id = ? AND pi.approval_action_user_id = ? AND taw.is_final_approval = 0
        ORDER BY taw.sequence ASC
      `;
      params = [id, user_id, user_id];
    }

    return new Promise((resolve, reject) => {
      dbconn.query(query, params, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }

        return resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in getDistributorList:", error);
    throw error;
  }
};

const nextapproval_action_user_id_SNF = async (application_id, flag = 1, applicationStatus = "Approved") => {
  try {
    const query = `
      UPDATE offboardingdistributors
      SET flag = ?, applicationStatus = ?
      WHERE application_id = ?
    `;
    const values = [flag, applicationStatus, application_id];

    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (err, result) => {
        if (err) {
          console.error("Error updating offboardingdistributors for SNF:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  } catch (err) {
    console.error("Exception in nextapproval_action_user_id_SNF:", err);
    throw err;
  }
};

const nextapproval_action_user_id = async (
  data,
  user_id,
  application_id,
  fnf_flag,
  flag,
) => {
  try {
    let query = `UPDATE offboardingdistributors SET `;
    let updateFields = [];
    let values = [];
    if (data.approver_id || data.approver_id == "0") {
      updateFields.push("approval_action_user_id = ?");
      values.push(data.approver_id);
    }

    if (data.sequence) {
      updateFields.push("total_complete_approval_level = ?");
      values.push(data.sequence);
    }

    if (user_id) {
      updateFields.push("last_approval_action_user_id = ?");
      values.push(user_id);
    }

    if (fnf_flag === 1) {
      updateFields.push("fnf_flag = ?");
      values.push(1);
    }

    if (flag === 2) {
      updateFields.push("flag = ?");
      values.push(2);
      updateFields.push("applicationStatus = ?");
      values.push("Rejected");
    }
    if (flag === 1) {
      updateFields.push("flag = ?");
      values.push(1);
      updateFields.push("applicationStatus = ?");
      values.push("Approved");
    }
    if (updateFields.length === 0) {
      return { message: "No fields to update" };
    }

    query += updateFields.join(", ") + " WHERE application_id = ?";
    values.push(application_id);

    console.log("Dynamic update query:", query);
    console.log("Update values:", values);

    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in nextapproval_action_user_id:", error);
    throw error;
  }
};


const nextapproval_action_user_idN = async (
  data,
  user_id,
  application_id,
  fnf_flag,
  flag,
) => {
  try {
    let query = `UPDATE offboardingdistributors SET `;
    let updateFields = [];
    let values = [];
    if (data.approver_id || data.approver_id == "0") {
      updateFields.push("approval_action_user_id = ?");
      values.push(data.approver_id);
    }

    if (data.sequence) {
      updateFields.push("total_complete_approval_level = ?");
      values.push(data.sequence);
    }

    if (user_id) {
      updateFields.push("last_approval_action_user_id = ?");
      values.push(user_id);
    }

    if (fnf_flag === 1) {
      updateFields.push("fnf_flag = ?");
      values.push(1);
    }

    if (flag === 1) {
      updateFields.push("flag = ?");
      values.push(1);
      updateFields.push("applicationStatus = ?");
      values.push("Approved");
    }
    if (updateFields.length === 0) {
      return { message: "No fields to update" };
    }

    query += updateFields.join(", ") + " WHERE application_id = ?";
    values.push(application_id);

    console.log("Dynamic update query:", query);
    console.log("Update values:", values);

    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in nextapproval_action_user_id:", error);
    throw error;
  }
};

const deleteMainOffboardStatus = async (application_id) => {
  try {

    const insertQuery = `
      INSERT INTO offboardingdistributors_history (
        application_id,
        offboard_type,
        reason_text,
        initiator_role,
        initiator_id,
        current_step,
        initiated_at,
        resignation_date,
        noc_certificate,
        regination_letter,
        status,
        rsem_status,
        last_approval_start_date,
        last_approval_action_user_id,
        total_approval_action_user_ids,
        approval_action_user_id,
        total_approval_level,
        total_complete_approval_level,
        flag,
        applicationStatus,
        approver_id,
        approval_role,
        final_approver,
        fnf_flag,
        dt_team_flag,
        confirm_asset_status,
        db_replace_status,
        replacementstatus,
        rsm_action_btn,
        exit_interview_remarks,
        gst_reversal,
        created_at,
        updated_at,
        db_response_status,
        db_deadline,
        db_action_taken_at,
        db_override_by,
        db_override_at,
        ap_assigned_at,
        ap_deadline,
        ap_action_status,
        ap_action_taken_at,
        snf_takeover_allowed,
        exit_interview_completed
      )
      SELECT
        application_id,
        offboard_type,
        reason_text,
        initiator_role,
        initiator_id,
        current_step,
        initiated_at,
        resignation_date,
        noc_certificate,
        regination_letter,
        status,
        rsem_status,
        last_approval_start_date,
        last_approval_action_user_id,
        total_approval_action_user_ids,
        approval_action_user_id,
        total_approval_level,
        total_complete_approval_level,
        flag,
        applicationStatus,
        approver_id,
        approval_role,
        final_approver,
        fnf_flag,
        dt_team_flag,
        confirm_asset_status,
        db_replace_status,
        replacementstatus,
        rsm_action_btn,
        exit_interview_remarks,
        gst_reversal,
        created_at,
        updated_at,
        db_response_status,
        db_deadline,
        db_action_taken_at,
        db_override_by,
        db_override_at,
        ap_assigned_at,
        ap_deadline,
        ap_action_status,
        ap_action_taken_at,
        snf_takeover_allowed,
        exit_interview_completed
      FROM offboardingdistributors
      WHERE application_id = ?
    `;

    await new Promise((resolve, reject) => {
      dbconn.query(insertQuery, [application_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const deleteQuery = `DELETE FROM offboardingdistributors WHERE application_id = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(deleteQuery, [application_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (error) {
    console.error("Error in deleteMainOffboardStatus:", error);
    throw error;
  }
};

const deleteMainOffboardStatusresign = async (application_id) => {
  try {

    const insertQuery = `
      INSERT INTO offboarding_resignation_details_history (
        application_id,
        firm_name,
        distributor_name,
        email,
        contact_no,
        noc_file_path,
        resignation_letter,
        resignation_reasons,
        gsv_average,
        low_turnover,
        low_roi,
        limitation_in_investment,
        db_going_out_of_business,
        increasing_cost,
        not_ready_for_additional_infrastructure,
        submitted_at,
        submitted_by_role
      )
      SELECT
        application_id,
        firm_name,
        distributor_name,
        email,
        contact_no,
        noc_file_path,
        resignation_letter,
        resignation_reasons,
        gsv_average,
        low_turnover,
        low_roi,
        limitation_in_investment,
        db_going_out_of_business,
        increasing_cost,
        not_ready_for_additional_infrastructure,
        submitted_at,
        submitted_by_role
      FROM offboarding_resignation_details
      WHERE application_id = ?
    `;

    await new Promise((resolve, reject) => {
      dbconn.query(insertQuery, [application_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const deleteQuery = `
      DELETE FROM offboarding_resignation_details
      WHERE application_id = ?
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(deleteQuery, [application_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (error) {
    console.error("Error in deleteMainOffboardStatusresign:", error);
    throw error;
  }
};

const checkOffboardingapproved = async (application_id, user_id, role_id) => {
  try {
    let query = `
      SELECT * 
      FROM offboardHierarchy
      WHERE application_id = ? AND approver_id = ? AND role_id = ? AND is_final_approval = 1 
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [application_id, user_id, role_id],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};
const updateOffboardapproved = async (application_id, transfer_assets) => {
  try {
    const checkQuery = `
      SELECT application_id 
      FROM db_replacements
      WHERE application_id = ?
    `;

    const exists = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });

    if (exists) {
      const updateQuery = `
        UPDATE db_replacements
        SET datatransfer = ?
        WHERE application_id = ?
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          updateQuery,
          [transfer_assets, application_id],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "updated", ...results });
          },
        );
      });
    } else {
      const insertQuery = `
        INSERT INTO db_replacements (application_id, datatransfer)
        VALUES (?, ?)
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          insertQuery,
          [application_id, transfer_assets],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "inserted", ...results });
          },
        );
      });
    }
  } catch (error) {
    console.error("Error in updateOffboardapproved:", error);
    throw error;
  }
};
const updateOffboardapprovedunit = async (
  application_id,
  type,
  amount,
) => {
  try {
    const checkQuery = `
      SELECT application_id 
      FROM db_replacements
      WHERE application_id = ?
    `;

    const exists = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });

    if (exists) {
      const updateQuery = `
        UPDATE db_replacements
        SET type = ?,amount = ?
        WHERE application_id = ?
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          updateQuery,
          [type, amount, application_id],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "updated", ...results });
          },
        );
      });
    } else {
      const insertQuery = `
        INSERT INTO db_replacements (application_id,type,amount)
        VALUES (?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          insertQuery,
          [application_id, type, amount],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "inserted", ...results });
          },
        );
      });
    }
  } catch (error) {
    console.error("Error in updateOffboardapproved:", error);
    throw error;
  }
};

const updateOffboardapprovedgst = async (
  application_id,
  gstYes,
  gstNumber,
  gstRemark,
) => {
  try {
    const checkQuery = `
      SELECT application_id 
      FROM db_replacements
      WHERE application_id = ?
    `;

    const exists = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });

    if (exists) {
      const updateQuery = `
        UPDATE db_replacements
        SET gstYes = ?,
      gstNumber = ?,
      gstRemark = ?
        WHERE application_id = ?
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          updateQuery,
          [gstYes, gstNumber, gstRemark, application_id],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "updated", ...results });
          },
        );
      });
    } else {
      const insertQuery = `
        INSERT INTO db_replacements (application_id, gstYes,
      gstNumber,
      gstRemark)
        VALUES (?, ?, ? ,?)
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          insertQuery,
          [application_id, gstYes, gstNumber, gstRemark],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "inserted", ...results });
          },
        );
      });
    }
  } catch (error) {
    console.error("Error in updateOffboardapproved:", error);
    throw error;
  }
};

const updateOffboardExitInterview = async (
  application_id,
  exitInterviewRemarks
) => {
  try {
    const checkQuery = `
      SELECT application_id 
      FROM db_replacements
      WHERE application_id = ?
    `;

    const exists = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });

    if (exists) {
      const updateQuery = `
        UPDATE db_replacements
        SET exitInterviewRemarks = ?
        WHERE application_id = ?
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(updateQuery, [exitInterviewRemarks, application_id], (error, results) => {
          if (error) return reject(error);
          resolve({ action: "updated", ...results });
        });
      });
    } else {
      const insertQuery = `
        INSERT INTO db_replacements (application_id, exitInterviewRemarks)
        VALUES (?, ?)
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(insertQuery, [application_id, exitInterviewRemarks], (error, results) => {
          if (error) return reject(error);
          resolve({ action: "inserted", ...results });
        });
      });
    }
  } catch (error) {
    console.error("Error in updateOffboardExitInterview:", error);
    throw error;
  }
};

const updateOffboardapprovedfnf = async (application_id, fnf_file_path) => {
  try {
    const checkQuery = `
      SELECT application_id 
      FROM db_replacements
      WHERE application_id = ?
    `;

    const exists = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });

    if (exists) {
      const updateQuery = `
        UPDATE db_replacements
        SET fnf_file_path = ?
        WHERE application_id = ?
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          updateQuery,
          [fnf_file_path, application_id],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "updated", ...results });
          },
        );
      });
    } else {
      const insertQuery = `
        INSERT INTO db_replacements (application_id, fnf_file_path)
        VALUES (?, ?)
      `;

      return new Promise((resolve, reject) => {
        dbconn.query(
          insertQuery,
          [application_id, fnf_file_path],
          (error, results) => {
            if (error) return reject(error);
            resolve({ action: "inserted", ...results });
          },
        );
      });
    }
  } catch (error) {
    console.error("Error in updateOffboardapproved:", error);
    throw error;
  }
};
const checkOffboardingapprovedfnf_flag = async (
  application_id,
  user_id,
  role_id,
) => {
  try {
    let query = `
      SELECT * 
      FROM offboardHierarchy
      WHERE application_id = ? AND approver_id = ? AND role_id = ? AND is_final_approval = 1 AND fnf_flag = 1
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [application_id, user_id, role_id],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};

const checkOffboardingapprovedfnf_flagzero = async (
  application_id,
  user_id,
  role_id,
  total_complete_approval_level,
) => {
  try {
    let query = `
      SELECT * 
      FROM offboardHierarchy
      WHERE application_id = ? AND approver_id = ? AND role_id = ? AND is_final_approval = 1 AND sequence = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [application_id, user_id, role_id, total_complete_approval_level],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};


const checkOffboardingapprovedfnf_flagzeroSNF = async (
  application_id,
  role_id,
  total_complete_approval_level
) => {
  try {

    let query = `
      SELECT *
      FROM offboardHierarchy
      WHERE application_id = ?
      AND role_id = ?
      AND is_final_approval = 1
      AND sequence = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {

      dbconn.query(
        query,
        [application_id, role_id, total_complete_approval_level],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );

    });

  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};

const updatedt_team_flag = async (application_id) => {
  const query = `UPDATE offboardingdistributors SET dt_team_flag = '1' WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updatedate_dbreplace_flag = async (application_id) => {
  const query = `UPDATE offboardingdistributors SET db_replace_status = '1' WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updatedate_assest_flag = async (application_id) => {
  const query = `UPDATE offboardingdistributors SET confirm_asset_status = '1' WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getdisById_ = async (application_id) => {
  const query = `select * from prospective_info  WHERE id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const get_dis_credit_data = async (application_id) => {
  const query = `select * from db_replacements  WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const insertDbResponse = async (data) => {
  const query = `
  INSERT INTO db_responses 
  (application_id, claim_type, counter_reason, status) 
  VALUES (?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(
      query,
      [
        data.application_id,
        data.claim_type,
        data.counter_reason,
        data.status,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const updateDbResponseStatus = async (application_id, status) => {
  const query = `UPDATE db_responses SET status = ? WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [status, application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updateDbResponseCounterOffer = async (application_id, data) => {
  const query = `INSERT INTO db_responses SET counter_amount = ?, counter_reason = ?, status = ? WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(
      query,
      [
        data.counter_amount,
        data.counter_reason,
        data.status,
        application_id,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
  });
};
const get_application_status = async (application_id) => {
  const query = `select * from db_responses  WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const saveFnfSubmission = async (data) => {
  const { application_id, signed_fnf_path, cheque_path, submission_date } =
    data;

  const query = `INSERT INTO fnf_submissions 
    (application_id, signed_fnf_path, cheque_path, submission_date,status, created_at) 
    VALUES (?, ?, ?, ?, 'Approved', NOW())
    ON DUPLICATE KEY UPDATE 
    signed_fnf_path = VALUES(signed_fnf_path),
    cheque_path = VALUES(cheque_path),
    submission_date = VALUES(submission_date),
    status = 'Approved',
    updated_at = NOW()`;

  return new Promise((resolve, reject) => {
    dbconn.query(
      query,
      [application_id, signed_fnf_path, cheque_path, submission_date],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
  });
};
const checkOffboardingapprovedPDF = async (
  application_id,
  user_id,
  role_id,
  total_complete_approval_level,
) => {
  try {
    let query = `
      SELECT * 
      FROM offboardHierarchy
      WHERE application_id = ? AND approver_id = ? AND role_id = ? AND sequence = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [application_id, user_id, role_id, total_complete_approval_level],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
  } catch (error) {
    console.error("Error in checkOffboardingInitiated:", error);
    throw error;
  }
};

const checkOffboardingapprovedPDFSNF = async (
  application_id,
  role_id,
  total_complete_approval_level
) => {
  try {

    let query = `
      SELECT *
      FROM offboardHierarchy
      WHERE application_id = ?
      AND role_id = ?
      AND sequence = ?
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {

      dbconn.query(
        query,
        [application_id, role_id, total_complete_approval_level],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );

    });

  } catch (error) {
    console.error("Error in checkOffboardingapprovedPDF:", error);
    throw error;
  }
};

const updateOffboardapprovedfnf_flag = async (application_id, fnf_flag) => {
  try {
    const updateQuery = `
        UPDATE offboardingdistributors
        SET fnf_flag = ?
        WHERE application_id = ?
      `;

    return new Promise((resolve, reject) => {
      dbconn.query(
        updateQuery,
        [fnf_flag, application_id],
        (error, results) => {
          if (error) return reject(error);
          resolve({ action: "updated", ...results });
        },
      );
    });
  } catch (error) {
    console.error("Error in updateOffboardapproved:", error);
    throw error;
  }
};

const saveGstReversalDecision = async (data) => {
  try {
    const checkQuery = `
      SELECT id 
      FROM db_replacements 
      WHERE application_id = ?
    `;

    const rows = await new Promise((resolve, reject) => {
      dbconn.query(checkQuery, [data.application_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const replaceStatus = data.decision === "accept" ? 1 : 2;

    // 👇 yaha role fix
    const gstRoleName = data.role_name && data.role_name.trim() !== ""
      ? data.role_name
      : "distributor";

    if (rows.length > 0) {
      const updateQuery = `
        UPDATE db_replacements
        SET 
          dblinkstatus = ?,
          replacement_status = ?,
          remarks_replace = ?,
          gst_role_name = ?, 
          replaceaction_date = NOW()
        WHERE application_id = ?
      `;

      return await new Promise((resolve, reject) => {
        dbconn.query(
          updateQuery,
          [
            replaceStatus,
            replaceStatus,
            data.remarks,
            gstRoleName,
            data.application_id,
          ],
          (err, result) => {
            if (err) return reject(err);
            resolve({ updated: true, result });
          }
        );
      });
    }

    const insertQuery = `
      INSERT INTO db_replacements
      (application_id, dblinkstatus, replacement_status, remarks_replace, gst_role_name, replaceaction_date)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    return await new Promise((resolve, reject) => {
      dbconn.query(
        insertQuery,
        [
          data.application_id,
          replaceStatus,
          replaceStatus,
          data.remarks,
          gstRoleName,
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve({ inserted: true, result });
        }
      );
    });

  } catch (error) {
    console.error("saveGstReversalDecision error:", error);
    throw error;
  }
};

const checkPendingRow = async (application_id, sequence) => {
  const query = `
    SELECT * FROM offboardHierarchy 
    WHERE application_id = ? AND sequence = ?
    order by id asc
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, sequence], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || null);
    });
  });
};

const getGstReversalStatus = async (application_id) => {
  const query = `
    SELECT dblinkstatus, remarks_replace
    FROM db_replacements
    WHERE application_id = ?
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result.length ? result[0] : null);
    });
  });
};

const get_file = async (application_id) => {
  const query = `select * from db_replacements  WHERE application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const get_fnf_submission = async (application_id) => {
  const query = `
    SELECT *
    FROM fnf_submissions
    WHERE application_id = ?
  `;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const updateReplacementStatusToNo = (application_id) => {
  return new Promise((resolve, reject) => {
    const updateQuery = `
      UPDATE offboardingdistributors
      SET replacementstatus = 1
      WHERE application_id = ?
    `;
    dbconn.query(updateQuery, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve({ updated: true });
    });
  });
};

const deleteDbResponseByApplicationId = (application_id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM db_responses WHERE application_id = ?`;
    dbconn.query(query, [application_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const updateDbLinkStatus = (application_id, status) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE db_replacements 
      SET dblinkstatus = ? 
      WHERE application_id = ?
    `;
    dbconn.query(query, [status, application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
const getCorrectRSMRow = async (application_id, approver_id) => {
  const query = `
    SELECT *
    FROM offboardHierarchy
    WHERE application_id = ?
      AND approver_id = ?
      AND role_name = 'RSM'
      AND status = 'PENDING'
      AND is_final_approval = 0
    ORDER BY sequence ASC
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, approver_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
};


const updateParallelNSM = async (application_id, sequence) => {
  const query = `
    UPDATE offboardHierarchy
    SET status = 'PENDING'
    WHERE application_id = ?
      AND sequence = ?
      AND role_name = 'NSM'
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, sequence], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const markExitInterviewCompleted = (application_id) => {
  return new Promise((resolve, reject) => {
    dbconn.query(
      `UPDATE offboardingdistributors 
       SET exit_interview_completed = 1 
       WHERE application_id = ?`,
      [application_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const updateRsmActionBtn = async (application_id) => {
  const query = `
    UPDATE offboardingdistributors
    SET rsm_action_btn = 1
    WHERE application_id = ?
    LIMIT 1
  `;
  return dbconn.query(query, [application_id]);
};

const updateGstReversalStatus = (application_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE offboardingdistributors
      SET gst_reversal = 1
      WHERE application_id = ?
    `;

    dbconn.query(query, [application_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const updateGstReversalColumn = (application_id, value) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE offboardingdistributors
      SET gst_reversal = ?
      WHERE application_id = ?
    `;

    dbconn.query(query, [value, application_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const initializeDbTracking = async (application_id) => {
  const query = `
    UPDATE offboardingdistributors
    SET 
      db_response_status = 'PENDING',
      db_deadline = DATE_ADD(NOW(), INTERVAL 7 DAY),
      db_action_taken_at = NULL,
      db_override_by = NULL,
      db_override_at = NULL
    WHERE application_id = ?
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getDbTracking = async (application_id) => {
  const query = `
    SELECT db_response_status, db_deadline
    FROM offboardingdistributors
    WHERE application_id = ?
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

const updateDbTrackingStatus = async (application_id, status) => {
  const query = `
    UPDATE offboardingdistributors
    SET 
      db_response_status = ?,
      db_action_taken_at = NOW()
    WHERE application_id = ?
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [status, application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const shouldInitializeDbTracking = (application_id) => {
  const query = `
    SELECT offboard_type 
    FROM offboardingdistributors 
    WHERE application_id = ? 
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, rows) => {
      if (err) return reject(err);

      if (!rows || rows.length === 0) {
        return resolve(false);
      }

      resolve(rows[0].offboard_type === "termination");
    });
  });
};



const handleTerminationApFlow = async (application_id) => {
  const query = `
    UPDATE offboardingdistributors
    SET
      ap_assigned_at = NOW(),
      ap_deadline = DATE_ADD(NOW(), INTERVAL 15 DAY),
      ap_action_status = 'PENDING',
      ap_action_taken_at = NULL,
      snf_takeover_allowed = 0
    WHERE application_id = ?
      AND offboard_type = 'termination'
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};


const getApTracking = (application_id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ap_deadline, ap_action_status, offboard_type
      FROM offboardingdistributors
      WHERE application_id = ?
    `;

    dbconn.query(sql, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

const updateApAction = (application_id, data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE offboardingdistributors
      SET 
        ap_action_status = ?,
        ap_action_taken_at = ?
      WHERE application_id = ?
    `;

    dbconn.query(
      sql,
      [data.ap_action_status, data.ap_action_taken_at, application_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const updateApActionSNF = (application_id, data) => {

  return new Promise((resolve, reject) => {

    const sql = `
      UPDATE offboardingdistributors
      SET 
      ap_action_status = ?,
      ap_action_taken_at = ?,
      snf_takeover_allowed = ?
      WHERE application_id = ?
    `;

    connection.query(
      sql,
      [
        data.ap_action_status,
        data.ap_action_taken_at,
        data.snf_takeover_allowed,
        application_id
      ],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );

  });

};

const getWorkflowRowForSNF = async (application_id, total_level) => {
  try {
    const query = `
      SELECT *
      FROM offboardHierarchy
      WHERE application_id = ?
      AND sequence = ?
      LIMIT 1
    `;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id, total_level], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  } catch (err) {
    console.error("Error in getWorkflowRowForSNF:", err);
    throw err;
  }
};


const getDistributorByApprover = async (approver_id) => {
  const query = `
    SELECT 
      pi.id AS applicationId,
      pi.mars_code,
      pi.firmName
    FROM prospective_info pi
    LEFT JOIN offboardingdistributors odist
      ON odist.application_id = pi.id
    LEFT JOIN offboardHierarchy w
      ON w.application_id = pi.id
    WHERE w.approver_id = ?
      AND w.status = 'PENDING'
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [approver_id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const getOffboardEmailDetails = async (application_id) => {

  const query = `
  SELECT 
    d.created_at AS start_date,
    h.role_name AS last_action_by,
    h.update_at AS last_action_date
  FROM offboardingdistributors d
  LEFT JOIN offboardHierarchy h 
    ON h.application_id = d.application_id
  WHERE d.application_id = ?  
  AND h.status IN ('APPROVED','REJECTED')
  ORDER BY h.sequence DESC
  LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });

};


const getOffboardEmailDetailsDB = async (application_id) => {

  const query = `
  SELECT 
    d.created_at AS start_date,
    h.role_name AS last_action_by,
    h.update_at AS last_action_date
  FROM offboardingdistributors d
  LEFT JOIN offboardHierarchy h 
    ON h.application_id = d.application_id
  WHERE d.application_id = ?  
  AND h.status IN ('APPROVED','REJECTED', 'NOT_STARTED')
  ORDER BY h.sequence DESC
  LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });

};


const getDistributorSubmittedDate = async (application_id) => {

  const query = `
    SELECT submitted_at
    FROM offboarding_resignation_details
    WHERE application_id = ?
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });

};

const checkRoleInWorkflow = (application_id, role_name) => {
  const query = `
    SELECT id
    FROM offboardHierarchy
    WHERE application_id = ?
    AND role_name = ?
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [application_id, role_name], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.length > 0);
    });
  });
};



module.exports = {
  checkPendingRow,
  updateOffboardapprovedfnf_flag,
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
  getAllhierarchyPersons,
  insertOffboardApprovalWorkflow,
  getDistributorDetailsrole,
  activateRsemPending,
  getRsemPendingRow,
  getNextSequenceRow,
  updateWorkflowRow,
  insertWorkflowHistory,
  updateMainOffboardStatus,
  deleteExistingWorkflow,
  getTerminationReasons,
  updateProspectiveInfo,
  getActionButtons,
  nextapproval_action_user_id,
  deleteMainOffboardStatus,
  checkOffboardingapproved,
  updateOffboardapproved,
  updatedt_team_flag,
  updateOffboardapprovedunit,
  updateOffboardapprovedgst,
  getDistributorListdata,
  updateOffboardapprovedfnf,
  checkOffboardingapprovedfnf_flag,
  checkOffboardingapprovedfnf_flagzero,
  getdisById_,
  get_dis_credit_data,
  insertDbResponse,
  updateDbResponseStatus,
  updateDbResponseCounterOffer,
  get_application_status,
  get_file,
  saveFnfSubmission,
  checkOffboardingapprovedPDF,
  replacementModel,
  saveAssetReconciliationModel,
  saveGstReversalDecision,
  deleteMainOffboardStatusresign,
  updatedate_dbreplace_flag,
  updatedate_assest_flag,
  getGstReversalStatus,
  get_fnf_submission,
  updateReplacementStatusToNo,
  deleteDbResponseByApplicationId,
  updateDbLinkStatus,
  updateOffboardExitInterview,
  getCorrectRSMRow,
  getRsemPendingRowRSM,
  updateParallelNSM,
  markExitInterviewCompleted,
  nextapproval_action_user_idN,
  updateRsmActionBtn,
  updateGstReversalStatus,
  updateGstReversalColumn,
  initializeDbTracking,
  getDbTracking,
  updateDbTrackingStatus,
  shouldInitializeDbTracking,
  handleTerminationApFlow,
  getApTracking,
  updateApAction,
  updateApActionSNF,
  checkOffboardingapprovedPDFSNF,
  checkOffboardingapprovedfnf_flagzeroSNF,
  getWorkflowRowForSNF,
  nextapproval_action_user_id_SNF,
  getDistributorByApprover,
  getOffboardEmailDetails,
  checkRoleInWorkflow,
  getDistributorSubmittedDate,
  getOffboardEmailDetailsDB
};
