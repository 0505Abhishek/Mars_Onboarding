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
      AND curr.approver_id = ? AND offboardingDistributor.offboard_flag != 2`;
    
    
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


const getApplicationDetail = async(application_id)=>{
    try{
    let query = `select * from offboarding_Application_detail 
                 where application_id = ?`;
  
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



const insertApplicationDetail = async (application_id, data) => {
    try {
      const query = `
        INSERT INTO offboarding_Application_detail (
          application_id,
          replacement_DB,
          master_Transfer,
          stock_Transfer,
          Asset_Reconciliation,
          Claim_Clearance,
          pending_amount,
          noc_file,
          approval_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const values = [
        application_id,
        data.replacement_DB,
        data.master_Transfer,
        data.stock_Transfer,
        data.Asset_Reconciliation,
        data.Claim_Clearance,
        data.pending_amount,
        data.noc_file,
        data.approval_count
      ];
  
      return new Promise((resolve, reject) => {
        dbconn.query(query, values, (error, results) => {
          if (error) return reject(error);
          resolve(results);
        });
      });
    } catch (error) {
      console.error("Error in insertApplicationDetail:", error);
      throw error;
    }
  };
  

  const updateApplicationDetail = async (application_id, data) => {
    try {
      let updates = [];
      let values = [];
  
      for (let key in data) {
        if (data[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(data[key]);
        }
      }
  
      if (updates.length === 0) {
        throw new Error("No data provided for update.");
      }
  
      values.push(application_id);
  
      const query = `
        UPDATE offboarding_Application_detail
        SET ${updates.join(', ')}
        WHERE application_id = ?
      `;
  
      return new Promise((resolve, reject) => {
        dbconn.query(query, values, (error, results) => {
          if (error) return reject(error);
          resolve(results);
        });
      });
    } catch (error) {
      console.error("Error in updateApplicationDetail:", error);
      throw error;
    }
  };
 
  


  const updateoffboardHierarchy = async (user_id, applicationId, final) => {
    let query = `Update offboardHierarchy set  is_final_approval = ?, status = ? where approver_id = ? and  application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[final, 'APPROVED', user_id, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}


const getUserById = async (userId, applicationId) => {

    try {
        return new Promise((resolve, reject) => {
            dbconn.query(
                `SELECT * FROM offboardHierarchy WHERE approver_id = ? and application_id = ?`, 
                [userId,applicationId],
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


const getdistributorData = async(application_id)=>{
    try{
    let query = `select * from offboard_distributor_information 
                 where applicationId = ?`;
  
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


const getNextApprover = async(application_id)=>{
    try{
        let query = `SELECT * FROM offboardHierarchy
                    Inner join users on users.id =  offboardHierarchy.approver_id
                    WHERE application_id = ? AND is_final_approval = ?
                    ORDER BY sequence ASC 
                    LIMIT 1 `;      
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query,[application_id, 0],(error,results)=>{
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

module.exports = {getDistributorList, getDistributorById, getApplicationDetail, insertApplicationDetail, updateApplicationDetail, updateoffboardHierarchy, getUserById, getdistributorData, getNextApprover};