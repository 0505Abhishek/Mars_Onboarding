const dbconn = require("../../config/db");

const getDistributorList = async (role_id, region_id) => {

        const regionArray = Array.isArray(region_id)
        ? region_id
        : region_id
            ? region_id.split(',').map(r => r.trim())
            : [];
    let query = `
    SELECT 
        offboardingDistributor.*, w.cdCode, 
        offboardingDistributor.created_at as offboardCreateDate,prospective_info.id as applicationId,
        prospective_info.*,
        curr.*, 
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
    LEFT JOIN tbl_approval_workflow w 
        ON w.application_id = prospective_info.id AND w.approver_role_id = 8      
    WHERE distributor_flag = ? 
      AND curr.role_id = ?`;
    
    
        const params = [1, role_id];

        if (regionArray.length > 0) {
            const placeholders = regionArray.map(() => '?').join(',');
            query += ` AND prospective_info.region_id IN (${placeholders})`;
            params.push(...regionArray);
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
}


const getDistributorByID = async(application_id, role_id, region_id)=>{

    try{
        const regionArray = Array.isArray(region_id)
        ? region_id
        : region_id
            ? region_id.split(',').map(r => r.trim())
            : [];
    let query = `select s_tbl_region_master.*, w.cdCode, users.employee_name, s_tbl_territory_master.*, offboard_distributor_information.*, offboardHierarchy.*, offboardingDistributor.* from offboard_distributor_information 
                 inner join offboardingDistributor on offboardingDistributor.application_id = offboard_distributor_information.applicationId
                 inner join offboardHierarchy on offboardHierarchy.application_id = offboard_distributor_information.applicationId
                 inner join prospective_info on prospective_info.id =  offboard_distributor_information.applicationId
                 LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
                 LEFT Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id
                 LEFT JOIN tbl_approval_workflow w ON w.application_id = prospective_info.id AND w.approver_role_id = 8    
                 LEFT JOIN users ON users.id = prospective_info.user_id  
                 where offboard_distributor_information.applicationId = ? and offboardHierarchy.role_id = ? and prospective_info.final_flag = ?`;
  
     const params = [application_id, role_id, 1];

        if (regionArray.length > 0) {
            const placeholders = regionArray.map(() => '?').join(',');
            query += ` AND prospective_info.region_id IN (${placeholders})`;
            params.push(...regionArray);
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

const updateoffboardHierarchy = async (user_id, applicationId, final, remarkMsg, role_id) => {
    let query = `Update offboardHierarchy set  is_final_approval = ?, remark = ?, status = ? where role_id = ? and  application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[final, remarkMsg, 'APPROVED', role_id, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const updateRejectoffboardHierarchy = async (user_id, applicationId, remarkMsg, role_id) => {
    let query = `Update offboardHierarchy set status = ?, remark = ? where role_id = ? and  application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,['REJECT', remarkMsg, role_id, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}


const updateoOffboardingDistributor = async (applicationId, ) => {
    let query = `Update offboardingDistributor set offboard_flag = ?  where application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[2, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const updateoOffboardingDistributorApproved = async (applicationId, ) => {
    let query = `Update offboardingDistributor set present_stage = ?  where application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[3, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const getoffboardHierarchy = async(user_id, application_id, role_id)=>{
    try{
    let query = `select * from offboardHierarchy 
                 where offboardHierarchy.application_id = ? and offboardHierarchy.role_id = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[application_id, role_id],(error,results)=>{
         if(error)
         {
          return reject(error);
         }
         return resolve(results[0]);
      })
    })
   }
   catch(error){
    console.error("Error in selectQuery:", error);
    throw error; 
   }
}

const getNextApprover = async(application_id, sequence)=>{
    try{
    let query = `select * from offboardHierarchy 
                 where offboardHierarchy.application_id = ? and sequence = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[application_id,sequence],(error,results)=>{
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


const getUserById = async(user_id)=>{
    try{
    let query = `select * from users 
                 where  users.id= ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[user_id],(error,results)=>{
         if(error)
         {
          return reject(error);
         }
         return resolve(results[0]);
      })
    })
   }
   catch(error){
    console.error("Error in selectQuery:", error);
    throw error; 
   }
}
module.exports = {getDistributorList, getDistributorByID, updateoffboardHierarchy, updateRejectoffboardHierarchy, updateoOffboardingDistributor, getoffboardHierarchy, getNextApprover, getUserById, updateoOffboardingDistributorApproved};