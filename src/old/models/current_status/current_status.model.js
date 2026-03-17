let dbconn = require("../../config/db");

const getDistributorList = async (user_id, region_id, role_id) => {

  try {
    let query = `SELECT pi.*, pi.create_date as applicationStartDate, taw_pending.approver_role_id AS pending_role_id, taw_pending.is_final_approver, taw_pending.approval_sequence, taw_pending.role_name
                    FROM prospective_info pi
                    LEFT JOIN tbl_approval_workflow taw_rsm 
                        ON pi.id = taw_rsm.application_id
                    LEFT JOIN (
                        SELECT application_id, approver_role_id, role_name, is_final_approver, approval_sequence
                        FROM tbl_approval_workflow
                        WHERE is_final_approver = 0 
                        AND (application_id, approval_sequence) IN (
                            SELECT application_id, MIN(approval_sequence)
                            FROM tbl_approval_workflow
                            WHERE is_final_approver = 0 
                            GROUP BY application_id
                        )
                    ) taw_pending ON pi.id = taw_pending.application_id
                    WHERE taw_rsm.approver_role_id = ? AND pi.type != 'EXISTING'`;

    const params = [role_id];

    if (role_id == 4 || role_id == 2 || role_id == 3) {

      let regionArray = Array.isArray(region_id) 
          ? region_id 
          : region_id.toString().split(",").map(r => r.trim());

      const placeholders = regionArray.map(() => "?").join(",");

      query += ` AND taw_rsm.approver_role_id = ? AND pi.region_id IN (${placeholders})`;

      params.push(role_id, ...regionArray);
    }

    if (role_id == 1) {
      query += ' AND taw_rsm.approver_id = ?';
      params.push(user_id);
    }
    
   query += ' ORDER BY pi.id';

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
    console.error("Error in getDistributorList:", error);
    throw error;
  }
};



const getListByHierarchyRole = async(roleId)=>{
  try{
    let query = `SELECT 
    t2.application_id,
    t2.approver_role_id,
    pi.*,
    pi.create_date AS applicationStartDate,
    s_tbl_territory_master.territory_name,
    s_tbl_region_master.region_name
FROM 
    tbl_approval_workflow t2
JOIN 
    prospective_info pi ON pi.id = t2.application_id
LEFT JOIN 
    s_tbl_region_master ON s_tbl_region_master.id = pi.region_id  
LEFT JOIN 
    s_tbl_territory_master ON s_tbl_territory_master.id = pi.territory_id
WHERE 
    t2.approver_role_id = ?
    AND pi.applicationPhase_Flag > 1
    AND pi.flag != 2
    AND t2.is_final_approver = 0
    AND t2.approval_sequence = (
        SELECT MIN(t_inner.approval_sequence)
        FROM tbl_approval_workflow t_inner
        WHERE 
            t_inner.application_id = t2.application_id
            AND t_inner.is_final_approver = 0
    )
    AND NOT EXISTS (
        SELECT 1
        FROM tbl_approval_workflow t_prev
        WHERE 
            t_prev.application_id = t2.application_id
            AND t_prev.approval_sequence < t2.approval_sequence
            AND t_prev.is_final_approver != 1
    );
`;

    return new Promise((resolve, reject)=>{
      dbconn.query(query,[roleId],(error,results)=>{
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


const getDistributorRemarkHistory = async(distributorId)=>{
  try{
    let query = `Select prospective_info.mars_code, prospective_info.aseemail, prospective_info.firmName, prospective_info.email, prospective_info.firmName, application_history.* from application_history
                 Inner join prospective_info on prospective_info.id = application_history.application_id
                 where application_history.application_id = ? `;

        return new Promise((resolve, reject)=>{
          dbconn.query(query,[distributorId],(error,results)=>{
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

module.exports={getDistributorList, getListByHierarchyRole, getDistributorRemarkHistory}