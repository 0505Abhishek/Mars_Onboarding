const dbconn = require("../../config/db");

const getDistributorList = async (id) => {

    let query = `
    SELECT 
        offboardingDistributor.*, 
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
    WHERE distributor_flag = ? 
      AND curr.approver_id = ?`;
    
    
    return new Promise((resolve, reject) => {
        dbconn.query(query, [1, id], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}


const getDistributorByID = async(application_id, user_id)=>{
    try{
    let query = `select * from offboard_distributor_information 
                 inner join offboardingDistributor on offboardingDistributor.application_id = offboard_distributor_information.applicationId
                 inner join offboardHierarchy on offboardHierarchy.application_id = offboard_distributor_information.applicationId
                 where offboard_distributor_information.applicationId = ? and offboardHierarchy.approver_id = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[application_id, user_id],(error,results)=>{
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

const updateoffboardHierarchy = async (user_id, applicationId, final, remarkMsg) => {
    let query = `Update offboardHierarchy set  is_final_approval = ?, remark = ?, status = ? where approver_id = ? and  application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[final, remarkMsg, 'APPROVED', user_id, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const updateRejectOffboardHierarchy = async (user_id, applicationId, remarkMsg) => {
    let query = `Update offboardHierarchy set status = ?, remark = ? where approver_id = ? and  application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,['REJECT', remarkMsg, user_id, applicationId], (error, results) => {
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

const getOffboardHierarchy = async(user_id, application_id)=>{
    try{
    let query = `select * from offboardHierarchy 
                 where offboardHierarchy.application_id = ? and offboardHierarchy.approver_id = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[application_id, user_id],(error,results)=>{
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
module.exports = {getDistributorList, getDistributorByID, updateoffboardHierarchy, updateRejectOffboardHierarchy, updateoOffboardingDistributor, getOffboardHierarchy, getNextApprover, getUserById, updateoOffboardingDistributorApproved};