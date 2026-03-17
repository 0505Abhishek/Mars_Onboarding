const dbconn = require("../../config/db");
const moment = require("moment-timezone");

const getDistributor = async (email_id) => {
  let query = `SELECT * FROM prospective_info WHERE email_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [email_id], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }

      return resolve(results[0]);
    });
  });
};

const updateDistributor = async (data, id, status) => {
  let query = `UPDATE prospective_info SET 
        user_id = ?, 
        aseemail = ?, 
        applicationType = ?, 
        dbType = ?,
        SO_Name = ?,
        SO_Terr = ?,  
        firmName = ?, 
        distributorName = ?, 
        email = ?, 
        contactNumber = ?, 
        experienceDistribution = ?, 
        experienceFMCG = ?, 
        outletsCovered = ?,
        FreightExpenses = ?, 
        monthlyTurnover = ?, 
        stores_covered = ?, 
        roi = ?, 
        fmcg_companies = ?, 
        fmcg_experience = ?, 
        stores_mars = ?, 
        sales_reps = ?, 
        growth_percentage = ?, 
        perfect_store_score = ?, 
        selling_model = ?, 
        mw_compliance = ?, 
        cost_structure = ?, 
        data_operator = ?, 
        internet_access = ?, 
        printer_use = ?, 
        dms_count = ?,
        print_system = ?, 
        logistics_dms = ?, 
        delivery_time = ?, 
        returns_rate = ?, 
        mw_sales_share = ?, 
        openness_change = ?,
        confectionery_sales_share = ?, 
        fte_dedicated = ?, 
        mw_influence = ?,  
        capital_infrastructure = ?,
        applicationStatus = ?,
        invitesend = ?,
        invite_send_flag = ?,
        invitecheckstatus = ?
    WHERE id = ?`;

  let values = [
    data.user_id,
    data.aseemail,
    data.applicationType,
    data.dbType,
    data?.SO_Name,
    data?.SO_Terr,
    data.firmName,
    data.distributorName,
    data.email,
    data.contactNumber,
    data.experienceDistribution,
    data.experienceFMCG,
    data.outletsCovered,
    data.FreightExpenses,
    data.monthlyTurnover,
    data.stores_covered,
    data.roi,
    data.fmcg_companies,
    data.fmcg_experience,
    data.stores_mars,
    data.sales_reps,
    data.growth_percentage,
    data.perfect_store_score,
    data.selling_model,
    data.mw_compliance,
    data.cost_structure,
    data.data_operator,
    data.internet_access,
    data.printer_use,
    data.dms_count,
    data.print_system,
    data.logistics_dms,
    data.delivery_time,
    data.returns_rate,
    data.mw_sales_share,
    data.openness_change,
    data?.confectionery_sales_share,
    data?.fte_dedicated,
    data?.mw_influence,
    data.capital_infrastructure,
    status,
    data.invitesend,
    data.invite_send_flag,
    data.invitecheckstatus,
    id,
  ];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

const addDistributor = async (data, status) => {
  const localTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  let query = `INSERT INTO prospective_info (
        user_id, 
        aseemail, 
        territory_id,
        region_id,
        city,
        applicationType, 
        dbType,
        SO_Name,
        SO_Terr, 
        firmName, 
        replacedFirmName,
        distributorName, 
        email, 
        contactNumber, 
        experienceDistribution, 
        experienceFMCG, 
        outletsCovered,
        FreightExpenses, 
        monthlyTurnover, 
        stores_covered, 
        roi, 
        fmcg_companies, 
        fmcg_experience, 
        stores_mars, 
        sales_reps, 
        growth_percentage, 
        perfect_store_score, 
        selling_model, 
        mw_compliance, 
        cost_structure, 
        data_operator, 
        internet_access, 
        printer_use, 
        dms_count,
        print_system, 
        mars_integration,
        temp_storage,
        logistics_dms, 
        delivery_time, 
        returns_rate, 
        mw_sales_share, 
        openness_change, 
        confectionery_sales_share, 
        fte_dedicated, 
        mw_influence, 
        capital_infrastructure,
        dtr_nps_score,
        invitesend,
        invite_send_flag,
        invitecheckstatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  let values = [
    data?.user_id,
    data?.aseemail,
    data?.territory_id,
    data?.region_id,
    data?.city,
    data?.applicationType,
    data?.dbType,
    data?.SO_Name,
    data?.SO_Terr,
    data?.firmName,
    data?.replacedFirmName,
    data?.distributorName,
    data?.email,
    data?.contactNumber,
    data?.experienceDistribution,
    data?.experienceFMCG,
    data?.outletsCovered,
    data?.FreightExpenses,
    data?.monthlyTurnover,
    data?.stores_covered,
    data?.roi,
    data?.fmcg_companies,
    data?.fmcg_experience,
    data?.stores_mars,
    data?.sales_reps,
    data?.growth_percentage,
    data?.perfect_store_score,
    data?.selling_model,
    data?.mw_compliance,
    data?.cost_structure,
    data?.data_operator,
    data?.internet_access,
    data?.printer_use,
    data?.dms_count,
    data?.print_system,
    data?.mars_integration,
    data?.temp_storage,
    data?.logistics_dms,
    data?.delivery_time,
    data?.returns_rate,
    data?.mw_sales_share,
    data?.openness_change,
    data?.confectionery_sales_share,
    data?.fte_dedicated,
    data?.mw_influence,
    data?.capital_infrastructure,
    data?.dtr_nps_score,
    localTime,
    data?.invite_send_flag,
    data?.invitecheckstatus,
  ];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

const getDistributorById = async (id, asmEmail) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM prospective_info where id= ? and  aseemail = ?`;

    dbconn.query(query, [id, asmEmail], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const getDistributorByEmail = async (email) => {
  let query = `select * from prospective_info where id = ?`;
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

const deleteDistributor = async (id) => {
  let query = `DELETE FROM prospective_info WHERE id = ?`;
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

    // Ensure correct destructuring
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

const getDistributorDraftList = async (id, email) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT prospective_info.*, s_tbl_territory_master.territory_name, s_tbl_region_master.region_name FROM prospective_info  
                            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
                            Inner Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
                            where prospective_info.user_id= ? and prospective_info.aseemail = ? AND prospective_info.type != 'EXISTING'`;

    dbconn.query(query, [id, email], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const updateProspectiveInfo = async (her, len, first, lastApprover, email) => {
  try {
    let userIdsString = JSON.stringify(her);

    let query = `UPDATE prospective_info 
                     SET total_approval_action_user_ids = ?, 
                         total_approval_level = ?, 
                         total_complete_approval_level = ?, 
                         approval_action_user_id = ?, 
                         final_approver = ? 
                     WHERE email = ?`;

    return new Promise((resolve, reject) => {
      dbconn.query(
        query,
        [userIdsString, len, 0, first, lastApprover, email],
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

const getAllDistributor = async (id) => {
  try {
    return new Promise((resolve, reject) => {
      const query = `SELECT prospective_info.id, prospective_info.firmName, prospective_info.mars_code, prospective_info.distributor_code, tbl_approval_workflow.cdCode FROM prospective_info 
        Inner Join tbl_approval_workflow on tbl_approval_workflow.application_id = prospective_info.id
        where prospective_info.final_flag = 1 and prospective_info.user_id = ? and tbl_approval_workflow.approver_role_id = ?`;

      dbconn.query(query, [id, 8], (error, results) => {
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

const getTerritory = async (id, region_id) => {
  try {
    return new Promise((resolve, reject) => {
      const query = `SELECT s_tbl_user_territories.territory_id, s_tbl_territory_master.territory_name FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            where s_tbl_user_territories.user_id = ? and s_tbl_territory_master.region_id = ?`;

      dbconn.query(query, [id, region_id], (error, results) => {
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

const getSoTerritory = async (id, region_id, territory_id) => {
  try {
    return new Promise((resolve, reject) => {
      const query = `SELECT s_tbl_so_territories.id as so_territories_id, s_tbl_so_territories.so_name, s_tbl_so_territories.so_territory_name FROM s_tbl_so_territories
            where s_tbl_so_territories.territory_id = ? and s_tbl_so_territories.region_id = ?`;

      dbconn.query(query, [territory_id, region_id], (error, results) => {
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

const getRegion = async (id) => {
  try {
    return new Promise((resolve, reject) => {
      const query = `SELECT s_tbl_region_master.region_name, s_tbl_region_master.id FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            INNER JOIN s_tbl_region_master ON s_tbl_region_master.id = s_tbl_territory_master.region_id
            where s_tbl_user_territories.user_id = ?
            group by  s_tbl_region_master.region_name`;

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

const addMarsIdForDistributor = async (id, mars_code) => {
  let query = `UPDATE prospective_info SET 
        mars_code = ?
        WHERE id = ?`;

  let values = [mars_code, id];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

const getTerritoryName = async (id) => {
  let query = `SELECT s_tbl_region_master.region_name 
                FROM s_tbl_territory_master  
                INNER JOIN s_tbl_region_master 
                    ON s_tbl_region_master.id = s_tbl_territory_master.region_id
                WHERE s_tbl_territory_master.id = ?`;

  let values = [id];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results[0]);
    });
  });
};

const getAllEmailsToSend = async (roleid, region_id) => {
  let query = `SELECT users.email_id FROM users WHERE role_id = ? AND region LIKE ?`;
  let values = [roleid, `%${region_id}%`];

  return new Promise((resolve, reject) => {
    dbconn.query(query, values, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

module.exports = {
  getAllEmailsToSend,
  updateProspectiveInfo,
  getSoTerritory,
  addDistributor,
  getDistributorDraftList,
  insertApprovalWorkflow,
  getUserById,
  getDistributor,
  getDistributorById,
  getDistributorByEmail,
  updateDistributor,
  deleteDistributor,
  updateDistributorHierarchy,
  getAllDistributor,
  getTerritory,
  getAllhierarchyPersons,
  addMarsIdForDistributor,
  getTerritoryName,
  getRegion,
};
