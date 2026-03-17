const mysqlConnection = require('../../config/db');

const selectQuery = async (data) => {

    let query = `SELECT users.role FROM users WHERE email_id = '${data.email}'`;

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, (error, result) => {
            if (error) {
                return reject(error)
            }
            return resolve(result);
        });
    })
}


const selectQueryForRole = async (email, role) => {

    let query = `SELECT * FROM users WHERE email_id = ? and role = ?`;

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [email, role],(error, result) => {
            if (error) {
                return reject(error)
            }
            return resolve(result[0]);
        });
    })
}


module.exports={selectQuery, selectQueryForRole}
