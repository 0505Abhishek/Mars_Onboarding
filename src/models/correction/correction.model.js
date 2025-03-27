const dbconn = require('../../config/db');

const getDistributorList = async(user_id)=>{

    try{
        const query = `SELECT * from prospective_info  where user_id = ? and flag = ? and applicationStatus = ? and prospective_info.applicationPhase_Flag > 1 `;

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
        const query = `SELECT * from maincorrection  where application_id = ? and status = ? `;

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
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM prospective_info where id= ? `;

        dbconn.query(query,[id],(error, results) => {
            if (error) {
                console.error("Database error:", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
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


module.exports={getDistributorList, getCorrection, getDistributorById, updateCorrection, updateProspectiveInfo}