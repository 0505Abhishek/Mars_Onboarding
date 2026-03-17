let dbconn = require("../../config/db");


const getDistributorList = async (user_id, region_id, role_id) => {
    const regionArray = Array.isArray(region_id) 
        ? region_id 
        : region_id
            ? region_id.split(',').map(r => r.trim())
            : [];

    try {
        let query = `
            SELECT * 
            FROM tbl_approval_workflow
            INNER JOIN prospective_info ON tbl_approval_workflow.application_id = prospective_info.id
            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
            LEFT JOIN s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
            WHERE tbl_approval_workflow.approver_role_id = ?
              AND (prospective_info.final_flag IS NULL OR prospective_info.final_flag != 1)
              AND prospective_info.flag IN (0,3,2)
              AND prospective_info.type != 'EXISTING'       `;

        const params = [role_id];

        if (regionArray.length > 0) {
            const placeholders = regionArray.map(() => '?').join(',');
            query += ` AND prospective_info.region_id IN (${placeholders})`;
            params.push(...regionArray);
        }

        query += ` ORDER BY prospective_info.create_date DESC `;

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


const approveLeadByRsem = async (id, user_id) => {
    try {
        const query = `
            SELECT * FROM tbl_approval_workflow
            WHERE application_id = ? AND approver_id = ?
        `;
        return new Promise((resolve, reject) => {
            dbconn.query(query, [id, user_id], (error, results) => {
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


const updateProspectiveInfo = async (action, flag, approval_role, approver_id, id, remark) => {

    try {
        const query = `
            UPDATE prospective_info SET applicationStatus = ?, rsem_remark = ?, flag = ?, approval_role = ?, approver_id = ? WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            dbconn.query(query, [action, remark, flag, approval_role, approver_id, id], (error, results) => {
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



const updateProspectiveInfoForRejection = async (action, flag, approval_role, approver_id, id, remark) => {
    try {
        const query = `
            UPDATE prospective_info SET applicationStatus = ?, flag = ?, approval_role = ?, approver_id = ?, reject_date = now(), rsem_remark = ?, reason = ?   WHERE id = ?
        `;
        values=[action, flag, approval_role, approver_id, remark, remark, id];
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
        console.error("Error in selectQuery:", error);
        throw error;
    }
}

const getDistributorById = async (id, userId, region_id) => {
    try {
        return await new Promise((resolve, reject) => {
            const regionArray = Array.isArray(region_id)
                ? region_id
                : region_id
                    ? region_id.split(',').map(r => r.trim())
                    : [];

            let query = `
                SELECT 
                    s_tbl_territory_master.territory_name, 
                    s_tbl_so_territories.so_territory_name, 
                    s_tbl_so_territories.id as so_territory_id, 
                    s_tbl_region_master.region_name,  
                    prospective_info.*, 
                    replaced.mars_code AS replaced_mars_code, 
                    replaced.firmName as replaced_firmName 
                FROM prospective_info
                INNER JOIN tbl_approval_workflow 
                    ON tbl_approval_workflow.application_id = prospective_info.id
                LEFT JOIN s_tbl_so_territories 
                    ON s_tbl_so_territories.id = prospective_info.SO_Terr 
                LEFT JOIN s_tbl_region_master 
                    ON s_tbl_region_master.id = prospective_info.region_id
                LEFT JOIN prospective_info AS replaced  
                    ON replaced.id = prospective_info.replacedFirmName
                INNER JOIN s_tbl_territory_master 
                    ON s_tbl_territory_master.id = prospective_info.territory_id 
                WHERE prospective_info.id = ? 
                  AND tbl_approval_workflow.approver_role_id = ? 
                  AND tbl_approval_workflow.is_final_approver = 0
            `;

            const params = [id, userId];

            if (regionArray.length > 0) {
                const placeholders = regionArray.map(() => '?').join(',');
                query += ` AND prospective_info.region_id IN (${placeholders})`;
                params.push(...regionArray);
            }

            dbconn.query(query, params, (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error("Error in getDistributorById:", error);
        throw error; 
    }
};





const updateProspectiveForRsem = async(applicationPhase, id, remark)=>{
    try {
        const query = `
            UPDATE prospective_info SET applicationPhase_Flag = ?, rsem_remark = ?, flag = ?, applicationStatus = ? WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            dbconn.query(query, [applicationPhase, remark, 0, 'Pending', id], (error, results) => {
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



const insertProspectiveLog = async (distributorData) => {
    try {
        const query = `
            INSERT INTO prospective_info_log (
                user_id, aseemail, applicationType, dbType, SO_Name, SO_Terr, firmName, distributorName, email, contactNumber, 
                experienceDistribution, experienceFMCG, outletsCovered, FreightExpenses, monthlyTurnover, stores_covered, roi, 
                fmcg_companies, fmcg_experience, stores_mars, sales_reps, growth_percentage, perfect_store_score, 
                selling_model, mw_compliance, cost_structure, data_operator, internet_access, printer_use, 
                dms_count, print_system, logistics_dms, delivery_time, returns_rate, mw_sales_share, 
                openness_change, confectionery_sales_share, fte_dedicated, mw_influence, capital_infrastructure, invitesend, invitecheckstatus, invite_send_flag, 
                application_phase, applicationPhase_Flag, rsem_remark, reject_date, reason, last_approval_start_date, 
                last_approval_action_user_id, total_approval_action_user_ids, approval_action_user_id, 
                total_approval_level, total_complete_approval_level, flag, applicationStatus, approver_id, 
                approval_role, overallremark, final_approver, final_flag, create_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        const values = [
            distributorData?.user_id,
            distributorData?.aseemail,
            distributorData?.applicationType,
            distributorData?.dbType,
            distributorData?.SO_Name, 
            distributorData?.SO_Terr,
            distributorData?.firmName,
            distributorData?.distributorName,
            distributorData?.email,
            distributorData?.contactNumber,
            distributorData?.experienceDistribution,
            distributorData?.experienceFMCG,
            distributorData?.outletsCovered,
            distributorData?.FreightExpenses,
            distributorData?.monthlyTurnover,
            distributorData?.stores_covered,
            distributorData?.roi,
            distributorData?.fmcg_companies,
            distributorData?.fmcg_experience,
            distributorData?.stores_mars,
            distributorData?.sales_reps,
            distributorData?.growth_percentage,
            distributorData?.perfect_store_score,
            distributorData?.selling_model,
            distributorData?.mw_compliance,
            distributorData?.cost_structure,
            distributorData?.data_operator,
            distributorData?.internet_access,
            distributorData?.printer_use,
            distributorData?.dms_count,
            distributorData?.print_system,
            distributorData?.logistics_dms,
            distributorData?.delivery_time,
            distributorData?.returns_rate,
            distributorData?.mw_sales_share,
            distributorData?.openness_change,
            distributorData?.confectionery_sales_share,
            distributorData?.fte_dedicated,
            distributorData?.mw_influence,
            distributorData?.capital_infrastructure,
            distributorData?.invitesend,
            distributorData?.invitecheckstatus,
            distributorData?.invite_send_flag,
            distributorData?.application_phase,
            distributorData?.applicationPhase_Flag,
            distributorData?.rsem_remark,
            distributorData?.reject_date,
            distributorData?.reason,
            distributorData?.last_approval_start_date,
            distributorData?.last_approval_action_user_id,
            distributorData?.total_approval_action_user_ids,
            distributorData?.approval_action_user_id,
            distributorData?.total_approval_level,
            distributorData?.total_complete_approval_level,
            distributorData?.flag,
            distributorData?.applicationStatus,
            distributorData?.approver_id,
            distributorData?.approval_role,
            distributorData?.overallremark,
            distributorData?.final_approver,
            distributorData?.final_flag,
            distributorData?.create_date
        ];
        
        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Database error:", error.sqlMessage || error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

    } catch (err) {
        console.error("Error in insertProspectiveLog:", err.message);
        throw err;
    }
};




const getUserById = async (userId) => {

    try {
        return new Promise((resolve, reject) => {
            dbconn.query(
                `SELECT * FROM users WHERE id = ?`, 
                [userId],
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

module.exports={getUserById, insertProspectiveLog, updateProspectiveInfoForRejection, getDistributorList, approveLeadByRsem, updateProspectiveInfo, getDistributorById, updateProspectiveForRsem};