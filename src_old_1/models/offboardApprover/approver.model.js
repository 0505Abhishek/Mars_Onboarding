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



const getDistributorData = async(application_id)=>{
    try{
    let query = `select * from offboard_distributor_information 
                 inner join offboardingDistributor on offboardingDistributor.application_id = offboard_distributor_information.applicationId
                 inner join offboarding_Application_detail on offboarding_Application_detail.application_id = offboard_distributor_information.applicationId
                 where offboard_distributor_information.applicationId = ?`;
  
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

module.exports = {getDistributorList, getDistributorById, getDistributorData};