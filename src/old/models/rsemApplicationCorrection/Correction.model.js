let dbconn = require("../../config/db");


const getDistributorList = async (user_id) => {
    try{
      const query = `
      SELECT * from prospective_info 
      where prospective_info.applicationStatus = 'Correction' and prospective_info.flag = 3 and user_id = ? and applicationPhase_Flag = ? AND (prospective_info.final_flag IS NULL OR prospective_info.final_flag != 1)`;
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


const getDistributorById = async(id, asmEmail)=>{
  return new Promise((resolve, reject) => {
      const query = `SELECT s_tbl_territory_master.territory_name,  s_tbl_so_territories.so_territory_name, s_tbl_so_territories.id as so_territory_id, s_tbl_region_master.region_name, prospective_info.* FROM prospective_info
                            Inner Join tbl_approval_workflow on tbl_approval_workflow.application_id = prospective_info.id
                            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
                            LEFT Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id
                            LEFT Join s_tbl_so_territories on s_tbl_so_territories.id = prospective_info.SO_Terr
                            where prospective_info.id= ? and prospective_info.aseemail= ?`;

      dbconn.query(query,[id, asmEmail],(error, results) => {
          if (error) {
              console.error("Database error:", error);
              reject(error);
          } else {
              resolve(results);
          }
      });
  });
}

const updateDistributor = async (data, id) => {
  
  let query = `UPDATE prospective_info SET 
      user_id = ?, 
      aseemail = ?, 
      applicationType = ?,
      city = ?, 
      dbType = ?,
      SO_Name = ?,
      SO_Terr = ?,  
      firmName = ?, 
      replacedFirmName = ?,
      distributorName = ?, 
      email = ?, 
      contactNumber = ?, 
      experienceDistribution = ?, 
      experienceFMCG = ?, 
      outletsCovered = ?, 
      FreightExpenses = ?,
      monthlyTurnover = ?, 
      stores_covered = ?, 
      roi = ?, 
      fmcg_companies = ?, 
      fmcg_experience = ?, 
      stores_mars = ?, 
      sales_reps = ?, 
      growth_percentage = ?, 
      perfect_store_score = ?, 
      selling_model = ?, 
      mw_compliance = ?, 
      cost_structure = ?, 
      data_operator = ?, 
      internet_access = ?, 
      printer_use = ?, 
      dms_count = ?, 
      logistics_dms = ?, 
      delivery_time = ?, 
      returns_rate = ?, 
      mw_sales_share = ?, 
      openness_change = ?,
      confectionery_sales_share = ?, 
      fte_dedicated = ?, 
      mw_influence = ?,   
      capital_infrastructure = ?,
      dtr_nps_score = ?,
      flag = ?,
      applicationStatus = ?,
      approval_role = ?,
      approver_id = ?
  WHERE id = ?`;  

  let values = [
    data?.user_id,
    data?.aseemail,
    data?.applicationType,
    data?.city,
    data?.dbType,
    data?.SO_Name,
    data?.SO_Terr, 
    data?.firmName,
    data?.replacedFirmName,
    data?.distributorName,
    data?.email,
    data?.contactNumber,
    data?.experienceDistribution,
    data?.experienceFMCG,
    data?.outletsCovered,
    data?.FreightExpenses,
    data?.monthlyTurnover,
    data?.stores_covered,
    data?.roi,
    data?.fmcg_companies,
    data?.fmcg_experience,
    data?.stores_mars,
    data?.sales_reps,
    data?.growth_percentage,
    data?.perfect_store_score,
    data?.selling_model,
    data?.mw_compliance,
    data?.cost_structure,
    data?.data_operator,
    data?.internet_access,
    data?.printer_use,
    data?.dms_count,
    data?.logistics_dms,
    data?.delivery_time,
    data?.returns_rate,
    data?.mw_sales_share,
    data?.openness_change,
    data?.confectionery_sales_share,  
    data?.fte_dedicated, 
    data?.mw_influence,
    data?.capital_infrastructure,
    data?.dtr_nps_score,
    data?.flag,
    data?.applicationStatus,
    data?.approval_role,
    data?.approver_id,
    id
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
};



const getUserById = async(user_id)=>{
  return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users where id= ?`;

      dbconn.query(query,[user_id],(error, results) => {
          if (error) {
              console.error("Database error:", error);
              reject(error);
          } else {
              resolve(results);
          }
      });
  });
}



const updateApprovalWorkFlow = async (action, approval_status, application_id ) => {

  let query = `UPDATE tbl_approval_workflow 
               SET status = ?, approval_status = ? 
               WHERE application_id = ? AND role_name = ?`;

  return new Promise((resolve, reject) => {
      dbconn.query(query, [action, approval_status, application_id, 'RSEM'], (error, results) => {
          if (error) {
              console.error("Database error:", error);
              return reject(error);
          }
          return resolve(results);
      });
  });
};



const getAllDistributor = async(id)=>{
 try{
    return new Promise((resolve, reject) => {
        const query = `SELECT prospective_info.id, prospective_info.firmName, prospective_info.mars_code, prospective_info.distributor_code , tbl_approval_workflow.cdCode FROM prospective_info 
        Inner Join tbl_approval_workflow on tbl_approval_workflow.application_id = prospective_info.id
        where prospective_info.final_flag = 1 and prospective_info.user_id = ? and tbl_approval_workflow.approver_role_id = ?`;

        dbconn.query(query,[id, 8],(error, results) => {
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


module.exports={getAllEmailsToSend, getTerritory, getDistributorList, getDistributorById, updateDistributor, getUserById, updateApprovalWorkFlow, getAllDistributor};