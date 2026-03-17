let dbconn = require("../../config/db");


const getDistributorList = async (user_id, role_id, region) => {
  try {
    let query = `
      SELECT 
        taw.*,
        pi.*,
        pi.create_date AS applicationStartDate,
        u2.employee_name AS approver_employee_name,
        s_tbl_territory_master.territory_name,
        s_tbl_region_master.region_name,

        (
          SELECT COUNT(*)
          FROM tbl_approval_workflow t 
          WHERE t.application_id = taw.application_id 
            AND t.approval_sequence < taw.approval_sequence 
            AND t.status = 'Pending'
        ) AS lower_pending,

        cpa.approver_id AS current_pending_approver_id,
        cpa.role_name AS current_pending_role_name,
        u.email_id AS current_pending_approver_email,
        u.role AS current_pending_approver_role

      FROM tbl_approval_workflow taw
      JOIN prospective_info pi ON pi.id = taw.application_id

      LEFT JOIN (
        SELECT t1.application_id, t1.approver_id, t1.role_name
        FROM tbl_approval_workflow t1
        WHERE t1.status = 'Pending'
          AND t1.approval_sequence = (
            SELECT MIN(t2.approval_sequence)
            FROM tbl_approval_workflow t2
            WHERE t2.application_id = t1.application_id
              AND t2.status = 'Pending'
          )
      ) cpa ON cpa.application_id = taw.application_id

      LEFT JOIN users u ON u.id = cpa.approver_id
      LEFT JOIN users u2 ON u2.id = taw.approved_by
      LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = pi.region_id  
      LEFT JOIN s_tbl_territory_master ON s_tbl_territory_master.id = pi.territory_id 

      WHERE taw.approver_role_id = ?
        AND pi.type != 'EXISTING'
        AND pi.applicationPhase_Flag > 1
    `;

    const params = [role_id];

    if (role_id == 4 && region) {
      const regionArray = region.split(",");
      const placeholders = regionArray.map(() => "?").join(",");
      query += ` AND pi.region_id IN (${placeholders})`;
      params.push(...regionArray);
    }

    query += ` ORDER BY pi.create_date DESC`;

    return new Promise((resolve, reject) => {
      dbconn.query(query, params, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  } catch (error) {
    throw error;
  }
};

const getCdCodeAndMargin = async (application_id) => {

  try {
      const query = `
          SELECT tbl_approval_workflow.cfaList, tbl_approval_workflow.cdCode, tbl_approval_workflow.distributorMargin from tbl_approval_workflow where approver_role_id = ? and application_id = ?`;
      
      return new Promise((resolve, reject) => {
          dbconn.query(query, [8, application_id], (error, results) => { 
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

const getsubmittedCfa = async (application_id) => {
  try {
      const query = `
          SELECT tbl_approval_workflow.cfaList, tbl_approval_workflow.cdCode, tbl_approval_workflow.distributorMargin from tbl_approval_workflow where approver_role_id = ? and application_id = ?`;
      
      return new Promise((resolve, reject) => {
          dbconn.query(query, [11, application_id], (error, results) => { 
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


const getDistributorByApplication = async (user_id, application_id) => {
  try {
      const query = `
          SELECT s_tbl_territory_master.territory_name, taw.*, pi.*, replaced_awf.cdCode as replaced_cdCode, s_tbl_so_territories.so_territory_name, s_tbl_so_territories.id as so_territory_id,  replaced_pi.distributorName as ReplacedDBName, pi.create_date as application_start_date, documenttable.*, aseusers.employee_name, 
              (SELECT COUNT(*) 
                  FROM tbl_approval_workflow t 
                  WHERE t.application_id = taw.application_id 
                  AND t.approval_sequence < taw.approval_sequence 
                  AND t.status = 'Pending') AS lower_pending
          FROM tbl_approval_workflow taw
          JOIN prospective_info pi ON pi.id = taw.application_id
          LEFT Join s_tbl_so_territories on s_tbl_so_territories.id = pi.SO_Terr   
          Left JOIN documenttable on documenttable.application_id = pi.id
          Left Join s_tbl_territory_master on s_tbl_territory_master.id = pi.territory_id 
          LEFT JOIN users as aseusers on aseusers.id = pi.user_id
          LEFT JOIN prospective_info AS replaced_pi ON replaced_pi.id = pi.replacedFirmName
          LEFT JOIN tbl_approval_workflow AS replaced_awf ON replaced_awf.application_id = pi.replacedFirmName
          AND replaced_awf.approver_role_id = 8 
         WHERE taw.approver_role_id = ? AND pi.applicationPhase_Flag > 0 AND taw.application_id = ?  
          ORDER BY taw.approval_sequence ASC `;
      
      return new Promise((resolve, reject) => {
          dbconn.query(query, [user_id, application_id], (error, results) => { 
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

const getDistributorById = async(application_id)=>{
  try{
  let query = `select * from prospective_info 
               inner join documenttable on documenttable.application_id = prospective_info.id
               where prospective_info.id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,application_id,(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}


const getNextApprover = async (application_id) => {
  try {
    const query = `
      SELECT approver_id 
      FROM tbl_approval_workflow 
      WHERE application_id = ? 
        AND status = 'Pending' 
      ORDER BY approval_sequence ASC 
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [application_id], (error, results) => { 
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results.length > 0 ? results[0].approver_id : null); 
      });
    });

  } catch (error) {
    console.error("Error in getNextApprover:", error);
    throw error; 
  }
};




const mainCorrection = async (application_id, data) => {
  try {
    let basicflag = 1; 
    let documentflag = 1; 
    
    let pageName = data.pages || [];
    
    if (pageName.includes("basicDetails")) {
      basicflag = 0; 
    }
    if (pageName.includes("additionalDetails")) {
      basicflag = 0; 
    }
    if (pageName.includes("documentDetails")) {
      documentflag = 0; 
    }

    let query = `INSERT INTO maincorrection (application_id, basic_page_status, document_page_status, page_name, feilds, overallremark) VALUES (?, ?, ?, ?, ?, ?)`;
    let page_name = JSON.stringify(data.pages);  
    let fields = JSON.stringify(data.fields); 
    let values = [application_id, basicflag, documentflag, page_name, fields, data.overallremark];

    const results = await new Promise((resolve, reject) => {
      dbconn.query(query, values, (error, results) => {
        if (error) {
          return reject(error);
        }
        return resolve(results);
      });
    });

    return results; 

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
};

const updateProspectiveInfo = async(status, flag, user_id, applicationId, overallremark)=>{
  try{
   let query  = `update prospective_info set applicationStatus = ?, flag = ?, approver_id = ?, overallremark = ? where id = ? and applicationPhase_Flag = ?`;
   return new Promise((resolve, reject)=>{
    dbconn.query(query,[status, flag, user_id, overallremark, applicationId, 2],(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }catch(error)
  {
    console.error("Error in selectQuery:", error);
    throw error; 
  }
}


const updateApproval = async (status, user_id, applicationId, overallremark, data, roleId) => {  
  try {
    let query = `
      UPDATE tbl_approval_workflow 
      SET status = ?, approved_by = ?, is_final_approver = ?, remarks = ?, 
          cdCode = ?, distributorMargin = ?, ivyLogin = ?, masterData = ?, 
          stockUpload = ?, pricingDetails = ?, additionalRemarks = ?, cfaList = ? 
      WHERE application_id = ? AND approver_role_id = ?`;

    const values = [
      status, user_id, 1, overallremark,
      data?.CdCode || null,                
      data?.DistributorMargin || null, 
      data?.ivyLogin || null, 
      data?.masterData || null, 
      data?.stockUpload || null, 
      data?.pricingDetails || null, 
      data?.additionalRemarks || null, 
      Array.isArray(data?.cfaList) ? data.cfaList.join(',') : data?.cfaList || null,
      applicationId, roleId
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
} catch (error) {
  console.error("Error in updateProspectiveInfoForRejection:", error);
  throw error;
}
};


const updateProspectiveInfoForRejection = async (action, flag, id, remark, applicationId) => {
  try {
      const query = `UPDATE prospective_info 
                     SET applicationStatus = ?, flag = ?, approver_id = ?, reject_date = now(), reason = ? 
                     WHERE id = ?`;

      const values = [action, flag, id, remark, applicationId];  

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
      console.error("Error in updateProspectiveInfoForRejection:", error);
      throw error;
  }
};



const updateApprovalReject = async(status, user_id, applicationId, overallremark)=>{
  try{
   let query  = `update tbl_approval_workflow set status = ?, approved_by = ?, remarks = ? where application_id = ? and approver_id = ?`;
   return new Promise((resolve, reject)=>{
    dbconn.query(query,[status, user_id, overallremark, applicationId, user_id],(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }catch(error)
  {
    console.error("Error in selectQuery:", error);
    throw error; 
  }
}


const updateProspectiveFinal = async (final, applicationId) => {
  try {
      const query = `UPDATE prospective_info 
                     SET final_approver = ?, final_flag = ? 
                     WHERE id = ?`;

      const values = [final, 1, applicationId];  

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
      console.error("Error in updateProspectiveInfoForRejection:", error);
      throw error;
  }
};



const getUserById = async(user_id)=>{
  try{

  let query = `select * from users where users.id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,user_id,(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}


const getUserByRole = async(role_id, applicationId)=>{
  try{

  let query = `select * from users where users.id = ? and users.role_id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,user_id,(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}


const getApplicationHistory = async(application_id)=>{
  try{
  let query = `select * from application_history 
               where application_history.application_id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,application_id,(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}
 


const getListByHierarchyRole = async(forwardedTo, roleId, userId)=>{
  try{
    let params = [forwardedTo]; 
    let query = `SELECT 
    t2.application_id,
    t2.approver_role_id,
    pi.*,
    pi.create_date AS applicationStartDate,
    s_tbl_territory_master.territory_name,
    s_tbl_region_master.region_name
FROM 
    tbl_approval_workflow t2
JOIN 
    prospective_info pi ON pi.id = t2.application_id
LEFT JOIN 
    s_tbl_region_master ON s_tbl_region_master.id = pi.region_id  
LEFT JOIN 
    s_tbl_territory_master ON s_tbl_territory_master.id = pi.territory_id
WHERE 
    t2.approver_role_id = ?
    AND pi.applicationPhase_Flag > 1
    AND pi.flag != 2
    AND t2.is_final_approver = 0
    AND t2.approval_sequence = (
        SELECT MIN(t_inner.approval_sequence)
        FROM tbl_approval_workflow t_inner
        WHERE 
            t_inner.application_id = t2.application_id
            AND t_inner.is_final_approver = 0
    )
    AND NOT EXISTS (
        SELECT 1
        FROM tbl_approval_workflow t_prev
        WHERE 
            t_prev.application_id = t2.application_id
            AND t_prev.approval_sequence < t2.approval_sequence
            AND t_prev.is_final_approver != 1
    )
`;

  if (roleId == 4) {
      query += ` AND t2.approver_id = ?`;
      params.push(userId);
    }
    
    return new Promise((resolve, reject)=>{
      dbconn.query(query, params,(error,results)=>{
        if(error)
        {
          return reject(error);
        }

        return resolve(results);
      })
    })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}


const getCorrectionData = async (forwardedTo, roleId, userId) => {
  try {
    let query = `
      SELECT prospective_info.*, s_tbl_territory_master.territory_name, s_tbl_region_master.region_name
      FROM prospective_info 
      INNER JOIN tbl_approval_workflow 
        ON tbl_approval_workflow.application_id = prospective_info.id
      LEFT JOIN 
        s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
      LEFT JOIN 
        s_tbl_territory_master ON s_tbl_territory_master.id = prospective_info.territory_id  
      WHERE prospective_info.flag = ? 
        AND prospective_info.applicationPhase_Flag = 2
      group by prospective_info.email`;

    const params = [3]; 

    if (roleId == 4) {
      query += ` AND tbl_approval_workflow.approver_id = ?`;
      params.push(userId);
    }

    return new Promise((resolve, reject)=>{
      dbconn.query(query,params,(error,results)=>{
        if(error)
        {
          return reject(error);
        }

        return resolve(results);
      })
    })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}


const getTerritory = async(id)=>{
    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_user_territories.territory_id, s_tbl_territory_master.territory_name FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            where s_tbl_user_territories.user_id = ?`;
    
            dbconn.query(query,[id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}
 
const getRegion = async(id)=>{
    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_region_master.region_name, s_tbl_region_master.id FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            INNER JOIN s_tbl_region_master ON s_tbl_region_master.id = s_tbl_territory_master.region_id
            where s_tbl_user_territories.user_id = ?
            group by  s_tbl_region_master.region_name`;
    
            dbconn.query(query,[id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}

const getTerritoryByRegion = async(id, region_id)=>{
    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_user_territories.territory_id, s_tbl_territory_master.territory_name FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            where s_tbl_user_territories.user_id = ? and s_tbl_territory_master.region_id = ?`;
    
            dbconn.query(query,[id, region_id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}



const getCfaList = async()=>{
  try{

  let query = `select * from cfa_list`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,(error,results)=>{
       if(error)
       {
        return reject(error);
       }
       return resolve(results);
    })
  })
 }
 catch(error){
  console.error("Error in selectQuery:", error);
  throw error; 
 }
}

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

module.exports={getAllEmailsToSend, getCfaList, getCdCodeAndMargin, getRegion, getTerritory, getTerritoryByRegion, getCorrectionData, getApplicationHistory, getNextApprover, getUserById, getDistributorByApplication, updateProspectiveFinal, updateApprovalReject, getDistributorList, getDistributorById, mainCorrection, updateProspectiveInfo, updateApproval, updateProspectiveInfoForRejection, getListByHierarchyRole, getUserByRole, getsubmittedCfa};