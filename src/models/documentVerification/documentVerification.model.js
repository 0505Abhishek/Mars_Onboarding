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
            WHERE taw.approver_id = ? and pi.applicationPhase_Flag != ? 
            ORDER BY taw.approval_sequence ASC
        `;


        return new Promise((resolve, reject) => {
            dbconn.query(query, [user_id, 0], (error, results) => { 
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

const distributorDetail = async(applicationId)=>{
  try{
  let query = `select * from documenttable 
  inner join prospective_info on prospective_info.id = documenttable.application_id
   where documenttable.application_id = ?`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, [applicationId], (error, results) => { 5
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
                 
}

const insertCorrectionRecord = (application_id, data) => {
  return new Promise((resolve, reject) => {
    dbconn.query(
      `INSERT INTO applicationscorrection (application_id, status, documents) VALUES (?, ?, ?)`,
      [application_id, 'Pending', data],
      (error, result) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
  });
};

const updateProspectiveInfo = (application_id, user_id) => {
  return new Promise((resolve, reject) => {
    dbconn.query(
      `UPDATE prospective_info SET flag = ?, applicationStatus = ?, approver_id = ? WHERE id = ?`,
      [3, 'Correction', user_id, application_id],
      (error, result) => {
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        if (result.affectedRows === 0) {
          return reject(new Error("No rows updated"));
        }
        resolve(result);
      }
    );
  });
};







const approvedByMis = async(application_id, userId)=>{
  try{
    let query = `update tbl_approval_workflow set approved_by = ?, is_final_approver = ?, approval_status = ?, status = ?  where application_id = ? and approver_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [userId, 1, 1, 'Approved', application_id, userId], (error, results) => { 
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
}

const updateProspectiveInfoMis = async(application_id)=>{
try{
 let query = `update prospective_info set applicationPhase_Flag = ? where id = ?`;

 return new Promise((resolve, reject)=>{
     dbconn.query(query, [2, application_id], (error, results)=>{
       if(error)
       {
        console.log("error");
        return reject(error);
       }
      return resolve(results);
     });
  });
 }catch(error){
    console.error("Error in selectQuery:", error);
    throw error; 
 }
}


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

const getAseDetail = async(user_id)=>{
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


module.exports={getNextApprover, getAseDetail, getUserById, getDistributorList, distributorDetail,approvedByMis, insertCorrectionRecord, updateProspectiveInfo, updateProspectiveInfoMis};