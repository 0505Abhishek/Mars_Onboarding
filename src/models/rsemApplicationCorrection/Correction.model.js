let dbconn = require("../../config/db");


const getDistributorList = async (user_id) => {
    try{
      const query = `
      SELECT * from prospective_info 
      where prospective_info.applicationStatus = 'Correction' and prospective_info.flag = 3 and user_id = ? `;
        return new Promise((resolve, reject) => {
            dbconn.query(query, [user_id], (error, results) => { 
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
      const query = `SELECT * FROM prospective_info where id= ? and aseemail= ?`;

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
      dbType = ?, 
      firmName = ?, 
      distributorName = ?, 
      email = ?, 
      contactNumber = ?, 
      experienceDistribution = ?, 
      experienceFMCG = ?, 
      outletsCovered = ?, 
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
      capital_infrastructure = ?,
      flag = ?,
      applicationStatus = ?,
      approval_role = ?,
      approver_id = ?
  WHERE id = ?`;  

  let values = [
    data.user_id,
    data.aseemail,
    data.applicationType,
    data.dbType,
    data.firmName,
    data.distributorName,
    data.email,
    data.contactNumber,
    data.experienceDistribution,
    data.experienceFMCG,
    data.outletsCovered,
    data.monthlyTurnover,
    data.stores_covered,
    data.roi,
    data.fmcg_companies,
    data.fmcg_experience,
    data.stores_mars,
    data.sales_reps,
    data.growth_percentage,
    data.perfect_store_score,
    data.selling_model,
    data.mw_compliance,
    data.cost_structure,
    data.data_operator,
    data.internet_access,
    data.printer_use,
    data.dms_count,
    data.logistics_dms,
    data.delivery_time,
    data.returns_rate,
    data.mw_sales_share,
    data.openness_change,
    data.capital_infrastructure,
    data.flag,
    data.applicationStatus,
    data.approval_role,
    data.approver_id,
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

module.exports={getDistributorList,getDistributorById,updateDistributor, getUserById, updateApprovalWorkFlow};