const dbconn = require("../../config/db");


const getApplicationFromDB = async (id) => {
    try{
     let query = `SELECT * FROM prospective_info WHERE id = ?`;
     return new Promise((resolve, reject) => {
         dbconn.query(query, [id], (error, results) => {
             if (error) {
                 console.error("Database error:", error);
                 return reject(error);
             }
 
             return resolve(results[0]);
         });
     });
   }catch(error){
     console.log("error: ",error);
      throw error;
   }
 }

 const submitDBData = async (applicationId, data) => {
   try {
     const query = `INSERT INTO offboard_distributor_information 
       (
         applicationId,
         firmName, 
         distributorName, 
         email, 
         contact_no, 
         gsvAverage, 
         low_turnover, 
         low_roi, 
         limitation_in_investment, 
         db_going_out_of_business, 
         increasing_cost, 
         not_ready_for_additional_infrastructure
       ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
 
     const values = [
       applicationId,
       data?.firmName,
       data?.distributorName,
       data?.email,
       data?.contact_no,
       data?.gsvAverage,
       data?.low_turnover || 0,
       data?.low_roi || 0,
       data?.limitation_in_investment || 0,
       data?.db_going_out_of_business || 0,
       data?.increasing_cost || 0,
       data?.not_ready_for_additional_infrastructure || 0
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
     console.log("error: ", error);
     throw error;
   }
 };
 

 const getDistributorData = async (id) => {
    try{
     let query = `SELECT * FROM offboard_distributor_information WHERE applicationId = ?`;
     return new Promise((resolve, reject) => {
         dbconn.query(query, [id], (error, results) => {
             if (error) {
                 console.error("Database error:", error);
                 return reject(error);
             }
 
             return resolve(results);
         });
     });
   }catch(error){
     console.log("error: ",error);
      throw error;
   }
 }

 const offboardingDistributor = async (applicationId) => {
    try {
        const query = `UPDATE offboardingDistributor SET present_stage = ?, distributor_flag = ? WHERE application_id = ?`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, [2, 1, applicationId], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log("Error:", error);
        throw error;
    }
};


const getRsemFromUsers = async (id) => {
  try{
   let query = `SELECT * FROM offboardHierarchy 
                inner join users on users.id = offboardHierarchy.approver_id
                inner join prospective_info on prospective_info.id = offboardHierarchy.application_id
                WHERE offboardHierarchy.application_id = ? and role = ?`;
   return new Promise((resolve, reject) => {
       dbconn.query(query, [id,'RSEM'], (error, results) => {
           if (error) {
               console.error("Database error:", error);
               return reject(error);
           }

           return resolve(results[0]);
       });
   });
 }catch(error){
   console.log("error: ",error);
    throw error;
 }
}

 module.exports={getApplicationFromDB, submitDBData, getDistributorData, offboardingDistributor, getRsemFromUsers}