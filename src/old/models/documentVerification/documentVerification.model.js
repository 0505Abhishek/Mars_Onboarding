let dbconn = require("../../config/db");


const getDistributorList = async (role_id, region_id) => {
    try {

      const regionArray = Array.isArray(region_id)
            ? region_id
            : region_id
                ? region_id.split(',').map(r => r.trim())
                : [];

        let query = `
            SELECT taw.*, pi.*, s_tbl_territory_master.territory_name, s_tbl_region_master.region_name,
                (SELECT COUNT(*) 
                    FROM tbl_approval_workflow t 
                    WHERE t.application_id = taw.application_id 
                    AND t.approval_sequence < taw.approval_sequence 
                    AND t.status = 'Pending') AS lower_pending
            FROM tbl_approval_workflow taw
            JOIN prospective_info pi ON pi.id = taw.application_id  
            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = pi.region_id  
            LEFT JOIN s_tbl_territory_master ON s_tbl_territory_master.id = pi.territory_id 
            WHERE taw.approver_role_id = ? 
              AND pi.applicationPhase_Flag != ?
              AND pi.type != 'EXISTING'
        `;

        const params = [role_id, 0];

        if (regionArray.length > 0) {
            const placeholders = regionArray.map(() => '?').join(',');
            query += ` AND pi.region_id IN (${placeholders})`;
            params.push(...regionArray);
        }

        query += ` ORDER BY taw.approval_sequence ASC`;

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
        console.error("Error in selectQuery:", error);
        throw error; 
    }
};


const distributorDetail = async (applicationId, region_id) => {
  try {

     let regionArray = Array.isArray(region_id) 
      ? region_id 
      : region_id.toString().split(",").map(r => r.trim());

    let query = `
      SELECT * 
      FROM documenttable 
      INNER JOIN prospective_info 
        ON prospective_info.id = documenttable.application_id
      WHERE documenttable.application_id = ? 
      AND prospective_info.region_id IN (?)
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [applicationId, regionArray], (error, results) => { 
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







const approvedByMis = async(application_id, userId, role_id)=>{
  try{
    let query = `update tbl_approval_workflow set approved_by = ?, is_final_approver = ?, approval_status = ?, status = ?  where application_id = ? and approver_role_id = ?`;
    return new Promise((resolve, reject) => {
      dbconn.query(query, [userId, 1, 1, 'Approved', application_id, role_id], (error, results) => { 
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

const getApplicationInfo = async(applicationId, role_id)=>{
  try {
    const query = `
      SELECT * 
      FROM tbl_approval_workflow 
      WHERE application_id = ? 
        AND approver_role_id = ? 
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      dbconn.query(query, [applicationId, role_id], (error, results) => { 
        if (error) {
          console.error("Database error:", error);
          return reject(error);
        }
        return resolve(results.length > 0 ? results[0].is_final_approver : nul); 
      });
    });

  } catch (error) {
    console.error("Error in getNextApprover:", error);
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
 
module.exports={getRegion, getTerritory, getTerritoryByRegion, getApplicationInfo, getNextApprover, getAseDetail, getUserById, getDistributorList, distributorDetail,approvedByMis, insertCorrectionRecord, updateProspectiveInfo, updateProspectiveInfoMis};