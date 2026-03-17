const dbconn = require("../../config/db");


const getDistributorList = async (id, email_id) => {

    const query = `
        SELECT p.*, w.cdCode, offboardingDistributor.present_stage, offboardingDistributor.offboard_flag, offboardingDistributor.updated__at as lastupdated_date  
        FROM prospective_info p
         LEFT JOIN tbl_approval_workflow w 
            ON w.application_id = p.id AND w.approver_role_id = 8
         LEFT JOIN 
            offboardingDistributor 
            ON offboardingDistributor.application_id = p.id 
            AND offboardingDistributor.offboard_flag != ?
         WHERE p.final_flag = ? AND p.user_id = ? AND p.aseemail = ?  
    `;

    return new Promise((resolve, reject) => {
        dbconn.query(query, [1, 1, id, email_id], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }


            resolve(results);
        });
    });
};


const setDistributor = async (data) => {
    let query = `Insert into offboardingDistributor(application_id, territory_id, initiator_id, initiator_email, replacement_db, distributor_name, distributor_Code, avg_sale, flag, present_stage, Asset_Reconciliation, application_status)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values=[data?.application_id, data?.territory_id, data?.user_id, data?.aseemail, data?.replacement_db, data?.distributor_name, data?.distributor_Code, data?.avg_sale, 1, 1, data?.Asset_Reconciliation, data?.status]
    return new Promise((resolve, reject) => {
        dbconn.query(query, values, (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const updateProspectInfo = async (data) => {
    let query = `Update prospective_info set offboarding_flag = ? where id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[1, data], (error, results) => {
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
            INSERT INTO offboardHierarchy (application_id, approver_id, role_id, role_name, territory_id, sequence, status)
            VALUES (?, ?, ?, ?, ?, ?,'pending')
        `;

        const result = await dbconn.query(query, [application_id, approver_id, approver_role_id, user.role_name, user.territory_id, user.sequence]);
        
        return result; 
    } catch (error) {
        console.log("Error inserting approval workflow:", error);
        throw error;
    }
};


const getProspectiveById = async (id) => {
   try{
    let query = `SELECT * FROM prospective_info WHERE id = ?`;
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


const setoffboardingProcessLog = async (application_id, approver_id, approver_role_id, user) => {
    try {
        const query = `
            INSERT INTO offboardHierarchyLog (application_id, approver_id, role_id, role_name, sequence, status)
            VALUES (?, ?, ?, ?, ?,'pending')
        `;

        const result = await dbconn.query(query, [application_id, approver_id, approver_role_id, user.role, user.sequence]);
        
        return result; 
    } catch (error) {
        console.log("Error inserting approval workflow:", error);
        throw error;
    }
};


const getoffboardHierarchy = async(application_id)=>{
    try{
        let query = `SELECT application_id, approver_id, role_name, territory_id, approver_role_id FROM tbl_approval_workflow WHERE application_id = ?`;
        return new Promise((resolve, reject) => {
            dbconn.query(query, [application_id], (error, results) => {
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



const getSalesDirector = async (userId) => {

    try {
        return new Promise((resolve, reject) => {
            dbconn.query(
                `SELECT * FROM users WHERE role_id = ?`, 
                [10],
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


const deleteDistributorSubmission = async (application_id) => {
    try{
    const query = `DELETE FROM offboard_distributor_information WHERE applicationId = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
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
};

const deleteOffboard = async (application_id) => {
    try{
    const query = `DELETE FROM offboardingDistributor WHERE application_id = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
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
};


const deleteApprovalWorkflow = async (application_id) => {
  try{
    const query = `DELETE FROM offboardHierarchy WHERE application_id = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
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
};

const getDistributorSubmission = async (application_id) => {
    try{
    const query = `select * FROM offboardingDistributor WHERE application_id = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
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
};


const insertLog = async (logData) => {
 try{
  const query = `
    INSERT INTO offboard_logs 
      (application_id, user_id, user_name, role_name, log_type, old_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    logData.application_id,
    logData.user_id,
    logData.user_name,
    logData.role_name,
    logData.log_type,
    JSON.stringify(logData.old_data),
    logData.created_at || new Date()
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
    }catch(error){
    console.log("error: ",error);
        throw error;
    }
};


module.exports = {insertLog, deleteOffboard, getDistributorSubmission, deleteDistributorSubmission, deleteApprovalWorkflow, getDistributorList, setDistributor, updateProspectInfo, getUserById, insertApprovalWorkflow, getProspectiveById, getoffboardHierarchy, getSalesDirector};