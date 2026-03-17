const dbconn = require("../../config/db");


const getDistributorList = async (id , email_id) => {
    let query = `SELECT * FROM prospective_info WHERE final_flag = ? and user_id = ? and  aseemail = ?`;
    return new Promise((resolve, reject) => {
        dbconn.query(query, [1, id , email_id], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }

            return resolve(results);
        });
    });
}

const setDistributor = async (data) => {
    let query = `Insert into offboardingDistributor(application_id, territory_id, initiator_id, initiator_email, replacement_db, distributor_name, avg_sale, flag, present_stage)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values=[data?.application_id, data?.territory_id, data?.user_id, data?.aseemail, data?.replacement_db, data?.distributor_name, data?.avg_sale, 1, 1]
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


const getOffboardHierarchy = async(application_id)=>{
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

module.exports = {getDistributorList, setDistributor, updateProspectInfo, getUserById, insertApprovalWorkflow, getProspectiveById, getOffboardHierarchy, getSalesDirector};