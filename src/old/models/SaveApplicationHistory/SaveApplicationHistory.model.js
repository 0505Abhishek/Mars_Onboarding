const dbconn = require('../../config/db');
const util = require('util');

const insertApplicationHistory = async (applicationId, actionBy, action_by_role, status, actionForId, actionForRole, actionForName, user_remark, action, remarks) => {
    const query = `INSERT INTO application_history (application_id, action_by, action_by_role, status, actionForId, actionForRole, actionForName, user_remark, action, remarks, action_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    try {
        const queryAsync = util.promisify(dbconn.query).bind(dbconn);
        return await queryAsync(query, [applicationId, actionBy, action_by_role, status, actionForId, actionForRole, actionForName, user_remark, action, remarks]);
    } catch (error) {
        console.error("Database error:", error);
        throw error; // Ensure error is propagated
    }
};

const insertApplicationHistory1 = async (applicationId, actionBy, action_by_role, status, approveFor, action, remarks) => {
    const query = `INSERT INTO application_history (application_id, action_by, action_by_role, status, approveFor, action, remarks, action_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    try {
        const queryAsync = util.promisify(dbconn.query).bind(dbconn);
        return await queryAsync(query, [applicationId, actionBy, action_by_role, status, approveFor, action, remarks]);
    } catch (error) {
        console.error("Database error:", error);
        throw error; // Ensure error is propagated
    }
};


 
module.exports={insertApplicationHistory, insertApplicationHistory1}