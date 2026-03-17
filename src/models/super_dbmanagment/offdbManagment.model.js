const dbconn = require("../../config/db");

const getdata = async () => {
  try {
    let query = `SELECT offboardHierarchy.cdCode, prospective_info.*, prospective_info.id as pid FROM prospective_info
                 left join offboardHierarchy on offboardHierarchy.application_id = prospective_info.id
                 WHERE  1 = 1 and  offboardHierarchy.role_id = 8`;
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

const regionandterritory = async () => {
  try {
    let query = `SELECT *,s_tbl_territory_master.id as tid FROM s_tbl_territory_master
    left join s_tbl_region_master on s_tbl_territory_master.region_id = s_tbl_region_master.id
    WHERE  1 = 1 `;
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

const getdataById = async (id) => {
  try {
    let query = `SELECT * FROM prospective_info WHERE id = ${id}`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, (error, results) => {
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

const getdataByIdApproval = async (id) => {
  try {
    let query = `SELECT * FROM offboardHierarchy WHERE application_id = ${id}`;
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

const getdataByIdApprovalOffboarding = async (id) => {
  let query = `select * from offboardHierarchy where application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [id], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

const getuserdata = async () => {
  try {
    let query = `SELECT * FROM users WHERE  1 = 1 `;
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

const getUsersByParentId = async (parentId) => {
  try {
    let query = `SELECT * FROM users WHERE id = ${parentId}`;
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

const approverupdate = async (data) => {
  try {
    const promises = [];
    for (let i = 0; i < data.approver_id.length; i++) {
      const approverId = data.approver_id[i];
      const sequence = data.sequence[i];
      const query = `UPDATE offboardHierarchy SET approver_id = ?, territory_id = ? WHERE application_id = ? AND sequence = ?`;
      promises.push(
        new Promise((resolve, reject) => {
          dbconn.query(
            query,
            [approverId, data.territory, data.application_id, sequence],
            (error, results) => {
              if (error) return reject(error);
              resolve(results);
            }
          );
        })
      );
    }
    return Promise.all(promises);
  } catch (error) {
    console.error("Error in approverupdate:", error);
    throw error;
  }
};

const insertApprovalLog = async (log) => {
  try {
    const query = `INSERT INTO off_tbl_approval_workflow_log SET ? `;
    return new Promise((resolve, reject) => {
      dbconn.query(query, log, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in insertApprovalLog:", error);
    throw error;
  }
};
const offboardingdata = async () => {
  try {
    let query = `SELECT *, p.id as pid FROM offboardingDistributor
    inner join prospective_info as p on offboardingDistributor.application_id = p.id
    WHERE 1 = 1`;
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

const addUser = async (data) => {
  try {
    const query = `INSERT INTO prospective_info SET ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, data, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in addUser:", error);
    throw error;
  }
};

const checkDuplicateEmail = async (email) => {
  try {
    const query = `SELECT * FROM prospective_info WHERE email = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [email], (error, results) => {
        if (error) return reject(error);
        resolve(results.length > 0);
      });
    });
  } catch (error) {
    console.error("Error in checkDuplicateEmail:", error);
    throw error;
  }
};

const insertdb = async (data) => {
  try {
    const query = `INSERT INTO prospective_info (user_id,territory_id,applicationType,dbType,
    distributorName,firmName,email,contactNumber,applicationStatus,final_flag,type
    ,pan_number,gst_number,address1,city,state
    ,pin_code,distributor_status,distributor_createdOn,distributor_deactivatedOn,aseemail,distributor_code,region_id)
     VALUES (?, ?,?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    let value = [
      data.user_id,
      data.territory_id,
      data.applicationType,
      data.dbType,
      data.distributorName,
      data.firmName,
      data.email,
      data.contactNumber,
      "Approved",
      "1",
      "EXISTING",
      data.pan_number,
      data.gst_number,
      data.address1,
      data.city,
      data.state,
      data.pin_code,
      data.distributor_status,
      data.distributor_createdOn,
      data.distributor_deactivatedOn,
      data.aseemail,
      data.distributor_code,
      data.region_id,
    ];
    return new Promise((resolve, reject) => {
      dbconn.query(query, value, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in insertdb:", error);
    throw error;
  }
};

const insertdbdocument = async (application_id, data) => {
  try {
    const query = `INSERT INTO documenttable (application_id,asm_id, pdf_document) VALUES (?, ?, ?)`;
    let value = [application_id, data.user_id, data.pdf_document];
    return new Promise((resolve, reject) => {
      dbconn.query(query, value, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in insertdbdocument:", error);
    throw error;
  }
};
const saveUploadStats = async (data) => {
  try {
    const query = `
            INSERT INTO s_tbl_upload_statistics (
                total_records, 
                successful_records, 
                failed_records, 
                filename,
                file_path,
                upload_time
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
    const values = [
      data.total,
      data.success,
      data.failure,
      data.filename,
      data.file_path,
      new Date(),
    ];
    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in saveUploadStats:", error);
    throw error;
  }
};
const getUserById = async (userId) => {
  try {
    return new Promise((resolve, reject) => {
      dbconn.query(
        `SELECT * FROM users WHERE id = ?`,
        [userId],
        (error, results) => {
          if (error) {
            console.error("Database error in getUserById:", error);
            return reject(error);
          }

          resolve(results.length > 0 ? results[0] : null);
        }
      );
    });
  } catch (error) {
    console.error("Database error in getUserById:", error);
    throw error;
  }
};

const insertApprovalWorkflow = async (
  application_id,
  approver_id,
  approver_role_id,
  user
) => {
  try {
    const query = `
          INSERT INTO tbl_approval_workflow (application_id, approver_id, approver_role_id, role_name, approval_sequence,status)
          VALUES (?, ?, ?, ?, ?,'pending')
      `;

    const result = await dbconn.query(query, [
      application_id,
      approver_id,
      approver_role_id,
      user.role,
      user.approval_sequence,
    ]);

    return result;
  } catch (error) {
    console.log("Error inserting approval workflow:", error);
    throw error;
  }
};

const updateDistributorHierarchy = async (
  user_id,
  application_id,
  approval_sequence,
  status
) => {
  try {
    let query = `update tbl_approval_workflow set is_final_approver = ?,status = ? where application_id = ? and approver_id = ? and approval_sequence = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [1, status, application_id, user_id, approval_sequence],
        (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results);
        }
      );
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const updateProspectiveInfo = async (
  her,
  len,
  first,
  lastApprover,
  mars_id,
  email
) => {
  try {
    let userIdsString = JSON.stringify(her);

    let query = `UPDATE prospective_info 
                   SET total_approval_action_user_ids = ?, 
                       total_approval_level = ?, 
                       total_complete_approval_level = ?, 
                       approval_action_user_id = ?, 
                       final_approver = ?,
                       applicationPhase_Flag = ?,
                       invite_send_flag = ?,
                       mars_code = ?
                   WHERE email = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [userIdsString, len, 0, first, lastApprover, 2, 1, mars_id, email],
        (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results);
        }
      );
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const getDistributorByEmail = async (email) => {
  let query = `select * from prospective_info where email = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [email], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
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

const insertDocumentUpload = async (documentData) => {
  try {
    const query = `
          INSERT INTO s_tbl_document_uploads (
              original_filename, 
              unique_filename, 
              file_path, 
              file_size, 
              file_type, 
              upload_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?)
      `;

    const values = [
      documentData.originalName,
      documentData.uniqueFilename,
      documentData.filePath,
      documentData.fileSize,
      documentData.fileType,
      new Date(),
    ];

    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in insertDocumentUpload:", error);
    throw error;
  }
};

const getApprovalWorkflow = async (applicationIds) => {
  try {
    const query = `
          SELECT * FROM tbl_approval_workflow  
          WHERE application_id IN (?)
      `;
    const values = [applicationIds];
    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in getApprovalWorkflow:", error);
    throw error;
  }
};

const getduserById = async (id) => {
  try {
    const query = `
          SELECT * FROM users  
          WHERE id IN (?)
      `;
    const values = [id];
    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results[0]);
      });
    });
  } catch (error) {
    console.error("Error in getduserById:", error);
    throw error;
  }
};

const getdataByIdOffboarding = async (id) => {
  let query = `SELECT * FROM offboardingDistributor
    inner join prospective_info as p on offboardingDistributor.application_id = p.id where offboardingDistributor.application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [id], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results[0]);
    });
  });
};

const offboardingApproverupdate = async (data) => {
  try {
    const promises = [];
    for (let i = 0; i < data.approver_id.length; i++) {
      const approverId = data.approver_id[i];
      const sequence = data.role_id[i];
      const query = `UPDATE offboardHierarchy SET approver_id = ? WHERE application_id = ? AND role_id = ?`;
      promises.push(
        new Promise((resolve, reject) => {
          dbconn.query(
            query,
            [approverId, data.application_id, sequence],
            (error, results) => {
              if (error) return reject(error);
              resolve(results);
            }
          );
        })
      );
    }
    return Promise.all(promises);
  } catch (error) {
    console.error("Error in approverupdate:", error);
    throw error;
  }
};

const insertApprovalLogoffboard = async (log) => {
  try {
    const query = `INSERT INTO s_tbl_offboardHierarchy_log SET ? `;
    return new Promise((resolve, reject) => {
      dbconn.query(query, log, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in insertApprovalLog:", error);
    throw error;
  }
};
const getApprovalWorkflowoffboarding = async (ids) => {
  try {
    const query = `
          SELECT * FROM offboardHierarchy  
          WHERE application_id IN (?)
      `;
    const values = [ids];
    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in getApprovalWorkflow:", error);
    throw error;
  }
};
const getterritory = async () => {
  try {
    let query = `SELECT * FROM s_tbl_territory_master`;
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

const getApproversByTerritory = async (territoryId) => {
  try {
    const query = `
      SELECT u.id, u.employee_name, r.role_id
      FROM users u
      INNER JOIN tbl_role r ON u.role_id = r.id
      INNER JOIN s_tbl_user_territories t ON u.id = t.user_id
      WHERE t.territory_id = ?
      AND r.role_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13)
      ORDER BY FIELD(r.role_id, 1,2,3,4,5,6,7,8,9,10,11,12,13)`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [territoryId], (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in getApproversByTerritory:", error);
    throw error;
  }
};

const updateDBStatus = async (application_id, user_id, email_id, territory) => {
  try {
    const query = `UPDATE prospective_info SET user_id = ?, aseemail = ?, territory_id = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [user_id, email_id, territory, application_id],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });
  } catch (error) {
    console.error("Error in updateDBStatus:", error);
    throw error;
  }
};

const regionandterritorybyid = async (territoryId) => {
  try {
    const query = `SELECT *,s_tbl_territory_master.id as tid FROM s_tbl_territory_master
        left join s_tbl_region_master on s_tbl_territory_master.region_id = s_tbl_region_master.id
        WHERE s_tbl_territory_master.id in (?)`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [territoryId], (error, results) => {
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

const getterritory_id = async (territoryId) => {
  try {
    const query = `SELECT * FROM s_tbl_territory_master WHERE territory_name = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [territoryId], (error, results) => {
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

const deleteDB = async (application_id) => {
  try {
    const query = `DELETE FROM prospective_info WHERE id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in deleteDB:", error);
    throw error;
  }
};

const deletedocument = async (application_id) => {
  try {
    const query = `DELETE FROM documenttable WHERE application_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    console.error("Error in deletedocument:", error);
    throw error;
  }
};

const getroleInfo = async () => {
  try {
    const query = `SELECT * FROM tbl_role WHERE  1 = 1`;
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

const getregion_id = async (regionId) => {
  try {
    const query = `SELECT * FROM s_tbl_region_master WHERE id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [regionId], (error, results) => {
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

const getdbdataById = async (id) => {
  try {
    const query = `SELECT * FROM prospective_info WHERE mars_code = ? and offboarding_flag = 0`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [id], (error, results) => {
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

const updateApprovalWorkflow = async (
  application_id,
  user_id,
  user_role_id,
  person,
  role
) => {
  try {
    const query = `UPDATE tbl_approval_workflow SET approver_id = ?, approver_role_id = ?, approval_sequence = ? WHERE application_id = ? and role_name = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [user_id, user_role_id, person.approval_sequence, application_id, role],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });
  } catch (error) {
    console.error("Error in updateApprovalWorkflow:", error);
    throw error;
  }
};

const getuserdataById = async (id) => {
  try {
    const query = `SELECT users.id,users.email_id FROM users 
        inner join s_tbl_user_territories on users.id = s_tbl_user_territories.user_id 
        WHERE s_tbl_user_territories.territory_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [id], (error, results) => {
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
const updateProspectiveInfoasm = async (application_id, data) => {
  try {
    const query = `UPDATE prospective_info SET region_id = ?, territory_id = ? ,user_id = ?,aseemail = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [
          data.region_id,
          data.territory_id,
          data.user_id,
          data.email,
          application_id,
        ],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });
  } catch (error) {
    console.error("Error in updateProspectiveInfoasm:", error);
    throw error;
  }
};
module.exports = {
  regionandterritory,
  getdata,
  getdataById,
  getuserdata,
  getdataByIdApproval,
  getUsersByParentId,
  approverupdate,
  insertApprovalLog,
  offboardingdata,
  addUser,
  checkDuplicateEmail,
  insertdb,
  insertdbdocument,
  saveUploadStats,
  getUserById,
  insertApprovalWorkflow,
  updateDistributorHierarchy,
  updateProspectiveInfo,
  getDistributorByEmail,
  insertDocumentUpload,
  getApprovalWorkflow,
  getduserById,
  getdataByIdOffboarding,
  getdataByIdApprovalOffboarding,
  offboardingApproverupdate,
  insertApprovalLogoffboard,
  getApprovalWorkflowoffboarding,
  getterritory,
  getApproversByTerritory,
  updateDBStatus,
  regionandterritorybyid,
  getAllhierarchyPersons,
  getterritory_id,
  deleteDB,
  deletedocument,
  getroleInfo,
  getregion_id,
  getdbdataById,
  updateApprovalWorkflow,
  getuserdataById,
  updateProspectiveInfoasm,
};
