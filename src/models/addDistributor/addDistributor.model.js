const dbconn = require("../../config/db");


const getDistributor = async (email_id) => {
    let query = `SELECT * FROM prospective_info WHERE email_id = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [email_id], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results[0]);
        });
    });
}

const updateDistributor = async (data, id, status) => {

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
        print_system = ?, 
        logistics_dms = ?, 
        delivery_time = ?, 
        returns_rate = ?, 
        mw_sales_share = ?, 
        openness_change = ?, 
        capital_infrastructure = ?,
        applicationStatus = ?,
        invitesend = ?,
        invite_send_flag = ?,
        invitecheckstatus = ?
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
    data.print_system,
    data.logistics_dms,
    data.delivery_time,
    data.returns_rate,
    data.mw_sales_share,
    data.openness_change,
    data.capital_infrastructure,
    status,
    data.invitesend,
    data.invite_send_flag,
    data.invitecheckstatus,
    id
];

    return new Promise((resolve, reject) => {
        dbconn.query(query,values, (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results);
        });
    });
};

const addDistributor = async (data, status) => {

    let query = `INSERT INTO prospective_info (
        user_id, 
        aseemail, 
        applicationType, 
        dbType, 
        firmName, 
        distributorName, 
        email, 
        contactNumber, 
        experienceDistribution, 
        experienceFMCG, 
        outletsCovered, 
        monthlyTurnover, 
        stores_covered, 
        roi, 
        fmcg_companies, 
        fmcg_experience, 
        stores_mars, 
        sales_reps, 
        growth_percentage, 
        perfect_store_score, 
        selling_model, 
        mw_compliance, 
        cost_structure, 
        data_operator, 
        internet_access, 
        printer_use, 
        dms_count,
        print_system, 
        logistics_dms, 
        delivery_time, 
        returns_rate, 
        mw_sales_share, 
        openness_change, 
        capital_infrastructure,
        invitesend,
        invite_send_flag,
        invitecheckstatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;
    
    let values = [
        data?.user_id,
        data?.aseemail,
        data?.applicationType,
        data?.dbType,
        data?.firmName,
        data?.distributorName,
        data?.email,
        data?.contactNumber,
        data?.experienceDistribution,
        data?.experienceFMCG,
        data?.outletsCovered,
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
        data?.print_system,
        data?.logistics_dms,
        data?.delivery_time,
        data?.returns_rate,
        data?.mw_sales_share,
        data?.openness_change,
        data?.capital_infrastructure,
        data?.invite_send_flag,
        data?.invitecheckstatus
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



const getDistributorById = async(id, asmEmail)=>{
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM prospective_info where id= ? and  aseemail = ?`;

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

const getDistributorByEmail = async(email)=>{
    let query =`select * from prospective_info where email = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [email], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results);
        });
    });
}


const deleteDistributor = async(id)=>{
    let query = `DELETE FROM prospective_info WHERE id = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [id], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results);
        });
    });
}




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


const insertApprovalWorkflow = async (application_id, approver_id, approver_role_id, user) => {
    try {
        const query = `
            INSERT INTO tbl_approval_workflow (application_id, approver_id, approver_role_id, role_name, approval_sequence,status)
            VALUES (?, ?, ?, ?, ?,'pending')
        `;

        // Ensure correct destructuring
        const result = await dbconn.query(query, [application_id, approver_id, approver_role_id, user.designation, user.approval_sequence]);
        
        return result; 
    } catch (error) {
        console.log("Error inserting approval workflow:", error);
        throw error;
    }
};



const updateDistributorHierarchy = async(user_id, application_id, approval_sequence, status)=>{
try{
   let query = `update tbl_approval_workflow set is_final_approver = ?,status = ? where application_id = ? and approver_id = ? and approval_sequence = ?`;

   return new Promise((resolve, reject) => {
    dbconn.query(query, [1,status,application_id,user_id,approval_sequence], (error, results) => {
        if (error) {
            console.error("Database error:", error);
            return reject(error);
        }
        return resolve(results);
    });
});
}catch(error){
    console.log(error);
    throw error;
}
}



const getDistributorDraftList = async(id, email) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM prospective_info where user_id= ? and aseemail = ?`;

        dbconn.query(query,[id, email],(error, results) => {
            if (error) {
                console.error("Database error:", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};


const updateProspectiveInfo = async (her, len, first, lastApprover, email) => {
    try {
        let userIdsString = JSON.stringify(her); 

        let query = `UPDATE prospective_info 
                     SET total_approval_action_user_ids = ?, 
                         total_approval_level = ?, 
                         total_complete_approval_level = ?, 
                         approval_action_user_id = ?, 
                         final_approver = ? 
                     WHERE email = ?`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, [userIdsString, len, 0, first, lastApprover, email], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};




module.exports = {updateProspectiveInfo, addDistributor, getDistributorDraftList, insertApprovalWorkflow, getUserById, getDistributor, getDistributorById, getDistributorByEmail, updateDistributor, deleteDistributor, updateDistributorHierarchy };