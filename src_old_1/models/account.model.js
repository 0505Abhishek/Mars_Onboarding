const mysqlConnection = require('../config/db');
const bcrypt = require("bcryptjs");

const insertQuery = async (data) => {
    let encryptedPassword = await bcrypt.hash(data.password, 10)
    let query = `INSERT INTO awsm_users( firstName, lastName, email, password, role) VALUES ( '${data.firstName}', '${data.lastName}', '${data.email}', '${encryptedPassword}', '${data.role}')`;
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, (error, employees) => {
            if (error) {
                return reject(error);
            }
            return resolve(employees);
        });
    });
}

const selectQuery = async (data) => {
    let query = `SELECT * FROM users WHERE email_id = '${data.email}'`;

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, (error, result) => {
            if (error) {
                return reject(error)
            }
            return resolve(result);
        });
    })
}


const selectQueryById = async (data) => {
    let query = `SELECT * FROM users WHERE id = '${data.id}'`;

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, (error, result) => {
            if (error) {
                return reject(error)
            }
            return resolve(result);
        });
    })
}

const selectQueryByToken = async (token) => {
    return new Promise((resolve, reject) => {
        mysqlConnection.query('SELECT * FROM awsm_users WHERE token =?', token, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        })
    })
}


const updateQuery = async (data) => {
    let token = data.token;

    return new Promise((resolve, reject) => {
        let query = `UPDATE users SET ? WHERE email_id =?`;
        mysqlConnection.query(query, [{ token:data.token }, `${data.email}`], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        })
    })
}

const updateQueryPassword = async (data) => {
    let password = data.password;
    return new Promise((resolve, reject) => {
        let query = `UPDATE awsm_users SET ? AND SET ? WHERE email =?`;
        mysqlConnection.query(query, [{ password: password }, `${data.email}`], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        })
    })
}

const updateQueryByToken = async (data) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE awsm_users SET ? WHERE token = ?`;
        mysqlConnection.query(query, [{ token: '' }, `${data.token}`], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        })
    })
}

const updatePasswordByToken = async (data, password) => {

    return new Promise((resolve, reject) => {
        let query = `UPDATE users SET password = ?, password_last_updated = NOW() WHERE email_id = ?`;
        mysqlConnection.query(query, [password, data], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
};


const password_history = async(password,email)=>{

    return new Promise((resolve, reject) => {
        let query = `INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)`;
        mysqlConnection.query(query, [email,password], (error, result) => {
            if (error) {
                console.log(error);
                return reject(error);
            }
            return resolve(result);
        })
    })

}


const getPassworHistory = async (userId) => {

    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM password_history 
                     WHERE user_id = ? 
                     ORDER BY created_at DESC 
                     LIMIT 15`;
        mysqlConnection.query(query, [userId], (error, result) => {
            if (error) {
                console.log(error);
                return reject(error);
            }

            return resolve(result);
        });
    });
}

const updateLoginAttempt = async(email, count)=>{


    return new Promise((resolve, reject) => {
        let query = `UPDATE awsm_users SET failed_login_attempts = ? WHERE email = ?`;

        mysqlConnection.query(query, [count, email], (error, result) => {
            if (error) {
                console.log(error);
                return reject(error);
            }
            return resolve(result);
        });
    });
}


const updateLockout = async(date, locked, email)=>{

    return new Promise((resolve, reject) => {
        let query = `UPDATE awsm_users SET lockout_start_time = ?, locked_account = ? WHERE email = ?`;

        mysqlConnection.query(query, [date, locked, email], (error, result) => {
            if (error) {
                console.log(error);
                return reject(error);
            }
            return resolve(result);
        });
    });
}


const setLoginCount = async (count, email) => {
    const now = new Date();  
    const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');  
    
    // Update the database query:
    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET login_count = ?, system_logged_time = ? WHERE email_id = ?`;
    
        mysqlConnection.query(query, [count, formattedTime, email], (error, result) => {
            if (error) {
                console.error("Error updating login count:", error);
                return reject(error);
            }
            resolve(result);
        });
    });
    
};

const getUserByTerritory = async (territory, email) => {
    let query = `SELECT * FROM users WHERE email_id = ? AND territory = ?`;

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [email, territory], (error, result) => {
            if (error) {
                return reject(error)
            }
            return resolve(result[0]);
        });
    })
}

module.exports = { setLoginCount, selectQueryById, insertQuery, selectQuery, selectQueryByToken, updateQuery, updateQueryByToken, updateQueryPassword, updatePasswordByToken, getPassworHistory, password_history, updateLockout, updateLoginAttempt, getUserByTerritory }