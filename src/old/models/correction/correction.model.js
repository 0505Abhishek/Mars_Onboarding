const dbconn = require('../../config/db');

const getDistributorList = async(user_id)=>{

    try{
        const query = `SELECT prospective_info.*, s_tbl_territory_master.territory_name, s_tbl_region_master.region_name from prospective_info  
                LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
                Inner Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
                where prospective_info.user_id = ? and prospective_info.flag = ? and prospective_info.applicationStatus = ? and prospective_info.applicationPhase_Flag > 1 AND prospective_info.type != 'EXISTING'`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, [user_id, 3, 'Correction'], (error, results) => { 
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



const getCorrection = async(application_Id)=>{

    try{
        const query = `SELECT maincorrection.*, prospective_info.firmName 
                        FROM maincorrection 
                        LEFT JOIN prospective_info ON prospective_info.id = maincorrection.application_id
                        WHERE maincorrection.application_id = ? AND maincorrection.status = ?`;


        return new Promise((resolve, reject) => {
            dbconn.query(query, [application_Id, 'Pending'], (error, results) => { 
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


const getDistributorById = async(id, asmEmail)=>{
  try{
    return new Promise((resolve, reject) => {
        let query = `select s_tbl_territory_master.territory_name, s_tbl_so_territories.so_name, s_tbl_so_territories.so_territory_name, s_tbl_region_master.region_name, prospective_info.* from prospective_info 
        LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
        LEFT Join s_tbl_so_territories on s_tbl_so_territories.id = prospective_info.SO_Terr   
        LEFT Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
        where prospective_info.id = ? `;
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
    console.error("Error fetching distributor info:", error);
    throw error;
  }
}



const updateCorrection = async (applicationId) => {
    try {
        if (!applicationId) {
            throw new Error("applicationId is missing or invalid");
        }

        let query = `UPDATE maincorrection SET status = ? WHERE application_id = ?`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, ['Approved', applicationId], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log("Error in updateCorrectionBasic:", error);
        throw error;
    }
};

const updateProspectiveInfo = async (applicationId) => {
    try {
        if (!applicationId) {
            throw new Error("applicationId is missing or invalid");
        }

        let query = `UPDATE prospective_info SET flag = ?, applicationStatus = ? WHERE id = ?`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, [0, 'Pending', applicationId], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log("Error in updateCorrectionBasic:", error);
        throw error;
    }
};


const GetApplicationDetail = async(id)=>{
    try{
    let query = `select * from prospective_info 
                 where prospective_info.id = ?`;
  
    return new Promise((resolve, reject)=>{
      dbconn.query(query, id,(error,results)=>{
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
               where users.id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,user_id,(error,results)=>{
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


const getDistributorDocument = async(user_id)=>{
  try{
  let query = `select * from documenttable 
               where documenttable.application_id = ?`;

  return new Promise((resolve, reject)=>{
    dbconn.query(query,user_id,(error,results)=>{
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


module.exports={getAllEmailsToSend, getDistributorDocument, getDistributorList, getCorrection, getDistributorById, updateCorrection, updateProspectiveInfo, GetApplicationDetail, getUserById}