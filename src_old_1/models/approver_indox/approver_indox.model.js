let dbconn = require("../../config/db");


const getDistributorList = async (user_id, role_id) => {
  try {
    let query = `
      SELECT 
        taw.*,
        pi.*, 
        pi.create_date as applicationStartDate,

        (SELECT COUNT(*)
         FROM tbl_approval_workflow t 
         WHERE t.application_id = taw.application_id 
           AND t.approval_sequence < taw.approval_sequence 
           AND t.status = 'Pending') AS lower_pending,

        cpa.approver_id AS current_pending_approver_id,
        u.email_id AS current_pending_approver_email,
        u.role as current_pending_approver_role

      FROM tbl_approval_workflow taw
      JOIN prospective_info pi ON pi.id = taw.application_id

      LEFT JOIN (
          SELECT t1.application_id, t1.approver_id
          FROM tbl_approval_workflow t1
          WHERE t1.status = 'Pending'
            AND t1.approval_sequence = (
                SELECT MIN(t2.approval_sequence)
                FROM tbl_approval_workflow t2
                WHERE t2.application_id = t1.application_id
                  AND t2.status = 'Pending'
            )
      ) AS cpa ON cpa.application_id = taw.application_id

      LEFT JOIN users u ON u.id = cpa.approver_id

      WHERE taw.approver_role_id = ?
    `;

    const params = [role_id];

    if (role_id == 4) {
      query += ' AND taw.approver_id = ?';
      params.push(user_id);
    }

    query += ' AND pi.applicationPhase_Flag > 1 ORDER BY taw.approval_sequence ASC;';

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



const getDistributorByApplication = async (user_id, application_id) => {

  try {
      const query = `
          SELECT s_tbl_territory_master.territory_name, taw.*, pi.*, pi.create_date as application_start_date, documenttable.*, aseusers.employee_name, 
              (SELECT COUNT(*) 
                  FROM tbl_approval_workflow t 
                  WHERE t.application_id = taw.application_id 
                  AND t.approval_sequence < taw.approval_sequence 
                  AND t.status = 'Pending') AS lower_pending
          FROM tbl_approval_workflow taw
          JOIN prospective_info pi ON pi.id = taw.application_id
          Left JOIN documenttable on documenttable.application_id = pi.id
          Join s_tbl_territory_master on s_tbl_territory_master.id = pi.territory_id 
          LEFT JOIN users as aseusers on aseusers.id = pi.user_id
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
          stockUpload = ?, pricingDetails = ?, additionalRemarks = ? 
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
  let query = `select * from users 
               where users.id = ?`;

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
 





const getListByHierarchyRole = async(userId, roleId)=>{
  try{
    let query = `SELECT 
      t1.application_id,
      t2.approver_role_id,
      pi.*, pi.create_date as applicationStartDate
    FROM 
        tbl_approval_workflow t1
    JOIN 
        tbl_approval_workflow t2 ON t1.application_id = t2.application_id
    JOIN 
        prospective_info pi ON pi.id = t1.application_id
    WHERE 
    t1.approver_id = ?  
    AND t2.approver_role_id = ?  AND pi.applicationPhase_Flag > 1 AND t2.is_final_approver = 0 AND pi.flag != 2 AND t2.is_final_approver != 1 
   `;

    return new Promise((resolve, reject)=>{
      dbconn.query(query,[userId, roleId],(error,results)=>{
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

module.exports={getApplicationHistory, getNextApprover, getUserById, getDistributorByApplication, updateProspectiveFinal, updateApprovalReject, getDistributorList, getDistributorById, mainCorrection, updateProspectiveInfo, updateApproval, updateProspectiveInfoForRejection, getListByHierarchyRole};