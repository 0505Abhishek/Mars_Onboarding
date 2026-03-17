const dbconn = require('../../config/db');

const getAllRegions = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_region_master';
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getTerritories = (regionIds) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_territory_master WHERE region_id IN (' + regionIds + ')';
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getAllTerritories = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_user_territories INNER JOIN s_tbl_territory_master ON s_tbl_user_territories.territory_id = s_tbl_territory_master.id';
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getUsersByRole = (role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE role_id = ?';
        dbconn.query(query, [role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const insertUser = (data) => {
    return new Promise((resolve, reject) => {
        const region = Array.isArray(data.region) ? data.region.join(',') : data.region;
        const territory = Array.isArray(data.territories) ? data.territories.join(',') : data.territories;
        const userData = [
            data.role_id,
            data.role,
            region,
            territory,
            data.employee_name,
            data.email_id,
            data.mobile_no
        ];


        const query = 'INSERT INTO users (role_id, role, region, territory, employee_name, email_id, mobile_no) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        dbconn.query(query, userData, (error, results) => {
            if (error) {
                console.error('Insert User Error:', error);
                return reject(error);
            }
            resolve(results);
        });
    });
}
const getRoleName = (role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM tbl_role WHERE id = ?';
        dbconn.query(query, [role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}
const getUsersBy = (role_id,email_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE role = ? AND email_id = ?';
        dbconn.query(query, [role_id,email_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const insertUserTerritories = (userId, data) => {
    return new Promise((resolve, reject) => {
        // Ensure territories are an array
        const territories = Array.isArray(data.territories) ? data.territories : [data.territories];
        
        // Prepare batch insert query
        const query = 'INSERT INTO s_tbl_user_territories (user_id, territory_id,user_role_id) VALUES ?';
        
        // Create values array for batch insert
        const values = territories.map(territoryId => [userId, territoryId,data.role_id]);
        
        dbconn.query(query, [values], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const getUserById = (userId) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE id = ?';
        dbconn.query(query, [userId], (error, results) => {
            if (error) return reject(error);
            resolve(results[0]); // Return the first (and should be only) result
        });
    });
}

const updateUser = (userId, userData) => {
    return new Promise((resolve, reject) => {
        // Convert arrays to comma-separated strings if needed
        const region = Array.isArray(userData.region) ? userData.region.join(',') : userData.region;
        const territory = Array.isArray(userData.territory) ? userData.territory.join(',') : userData.territory;

        const query = `
            UPDATE users 
            SET 
                employee_name = ?, 
                email_id = ?, 
                mobile_no = ?, 
                region = ?, 
                territory = ?
            WHERE id = ?
        `;
        
        const values = [
            userData.employee_name,
            userData.email_id,
            userData.mobile_no,
            region,
            territory,
            userId
        ];

        dbconn.query(query, values, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const checkExistingUserInTerritories = (role_id, territories) => {
    return new Promise((resolve, reject) => {
        // Convert territories to a comma-separated string if it's an array
        const territoryIds = Array.isArray(territories) ? territories.join(',') : territories;
        
        const query = `
            SELECT u.id ,tm.territory_name
            FROM users u
            JOIN s_tbl_user_territories ut ON u.id = ut.user_id
            JOIN s_tbl_territory_master tm ON ut.territory_id = tm.id
            WHERE u.role_id = ? 
            AND ut.territory_id IN (?)
        `;
        
        dbconn.query(query, [role_id, territoryIds.split(',')], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

const whereuserTerritories = (territory_id,role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_user_territories WHERE  territory_id IN (?) AND user_role_id = ?';
        dbconn.query(query, [territory_id,role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const updateUserTerritories = (user_id, territory_id, role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE s_tbl_user_territories SET user_id = ? WHERE territory_id in (?) and user_role_id = ? ';
        dbconn.query(query, [user_id, territory_id, role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}
const getAllTerritoriesbyid = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_user_territories INNER JOIN s_tbl_territory_master ON s_tbl_user_territories.territory_id = s_tbl_territory_master.id where s_tbl_user_territories.user_id = ?';
        dbconn.query(query, [user_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const applicationworkflow = (territory_id, role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id FROM tbl_approval_workflow WHERE territory_id IN (?) AND approver_role_id = ?';
        dbconn.query(query, [territory_id, role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const updateapplicationworkflow = (user_id, workflows) => {
    return new Promise((resolve, reject) => {
        if (!workflows || workflows.length === 0) {
            resolve({ message: 'No workflows to update' });
            return;
        }

        const workflowIds = workflows.map(w => w.id);
        
        const query = 'UPDATE tbl_approval_workflow SET approver_id = ? WHERE id IN (?)';
        dbconn.query(query, [user_id, workflowIds], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const applicationdata = (territory_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id FROM prospective_info WHERE territory_id IN (?)';
        dbconn.query(query, [territory_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const updateapplicationdata = (user_id, email_id, workflows) => {
    return new Promise((resolve, reject) => {
        if (!workflows || workflows.length === 0) {
            resolve({ message: 'No workflows to update' });
            return;
        }

        const workflowIds = workflows.map(w => w.id);
        
        const query = 'UPDATE prospective_info SET user_id = ? ,aseemail= ? WHERE id IN (?)';
        dbconn.query(query, [user_id, email_id, workflowIds], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const offboardapplicationworkflow = (territory_id, role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id FROM offboardHierarchy WHERE territory_id IN (?) AND role_id = ?';
        dbconn.query(query, [territory_id, role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const updateoffboardapplicationworkflow = (user_id, workflows) => {
    return new Promise((resolve, reject) => {
        if (!workflows || workflows.length === 0) {
            resolve({ message: 'No workflows to update' });
            return;
        }

        const workflowIds = workflows.map(w => w.id);
        
        const query = 'UPDATE offboardHierarchy SET approver_id = ? WHERE id IN (?)';
        dbconn.query(query, [user_id, workflowIds], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const offboardapplicationdata = (territory_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id FROM offboardingDistributor WHERE territory_id IN (?)';
        dbconn.query(query, [territory_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const updateoffboardapplicationdata = (user_id, email_id, workflows) => {
    return new Promise((resolve, reject) => {
        if (!workflows || workflows.length === 0) {
            resolve({ message: 'No workflows to update' });
            return;
        }

        const workflowIds = workflows.map(w => w.id);
        
        const query = 'UPDATE offboardingDistributor SET initiator_id = ?, initiator_email = ? WHERE id IN (?)';
        dbconn.query(query, [user_id, email_id, workflowIds], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};
const insertUserTerritoriesbyid = (userId, territoryIds, role_id) => {
    return new Promise((resolve, reject) => {
        const territoryArray = Array.isArray(territoryIds) ? territoryIds : [territoryIds];
        const query = 'INSERT INTO s_tbl_user_territories (user_id, territory_id, user_role_id) VALUES ?';
        const values = territoryArray.map(territoryId => [userId, territoryId, role_id]);
        
        dbconn.query(query, [values], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}
const whereuserTerritoriesbyid = (user_id, territoryIds, role_id) => {
    return new Promise((resolve, reject) => {
        const territoryArray = Array.isArray(territoryIds) ? territoryIds : [territoryIds];
        const query = 'SELECT * FROM s_tbl_user_territories WHERE user_id = ? AND territory_id IN (?) AND user_role_id = ?';
        dbconn.query(query, [user_id, territoryArray, role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const deleteUserTerritories = (user_id, role_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM s_tbl_user_territories WHERE user_id = ? AND user_role_id = ?';
        dbconn.query(query, [user_id, role_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

const checkExistingUserInRegion = (role_id, email_id) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT *
        FROM users u
        WHERE u.role_id = ? AND u.email_id = ?`;
        
        dbconn.query(query, [role_id, email_id], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

const checkExistingUserInEmail = (email_id) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT u.id
        FROM users u
        WHERE u.email_id = ?`;
        
        dbconn.query(query, [email_id], (error, results) => {
            
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}
module.exports = {
    getAllRegions,
    getTerritories,
    getAllTerritories,
    getUsersByRole,
    insertUser,
    getUsersBy,
    getUserById,
    updateUser,
    getRoleName,
    checkExistingUserInTerritories,
    whereuserTerritories,
    updateUserTerritories,
    getAllTerritoriesbyid,
    applicationworkflow,
    updateapplicationworkflow,
    applicationdata,
    updateapplicationdata,
    offboardapplicationworkflow,
    updateoffboardapplicationworkflow,
    offboardapplicationdata,
    updateoffboardapplicationdata,
    insertUserTerritoriesbyid,
    whereuserTerritoriesbyid,
    deleteUserTerritories,
    insertUserTerritories,
    checkExistingUserInRegion,
    checkExistingUserInEmail
};