const dbconn = require("../../config/db");
const { decryptData } = require("../../util/encryption");
const userDetail = async () => {
    try {
      let query = `SELECT * FROM users WHERE  1 = 1 `;
      return new Promise((resolve, reject) => {
        dbconn.query(query, (error, results) => { 5
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

  const userDetailById = async (id) => {
    try{
      let query = `SELECT * FROM users WHERE id = ${id}`;
      return new Promise((resolve, reject) => {
        dbconn.query(query, (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results[0]);
        });
      });
    } catch (error) {
      console.error("Error in selectQuery:", error);
      throw error; 
    }
  };

  const role = async () => {
    try{
      let query = `SELECT * FROM tbl_role`;
      return new Promise((resolve, reject) => {
        dbconn.query(query, (error, results) => {
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

  const updateuser = async (id, data) => {
    try{
      let query = `UPDATE users SET ? WHERE id = ${id}`;
      return new Promise((resolve, reject) => {
        dbconn.query(query, data, (error, results) => {
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
  const insertUserLog = async (log) =>{
    try{
      let query = `INSERT INTO s_tbl_users_log set ?`;
      return new Promise((resolve, reject) => {
        dbconn.query(query, log, (error, results) => { 
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results);
        });
      });
    } catch (error) {
      console.error("Error in insertUserLog:", error);
      throw error; 
    }
  }

  const insertupdateData = async (req,data) => {
    let email = decryptData(req.cookies.e);
    data.type = 'excel upload update';
    data.email = email;
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO s_tbl_users_log SET ?`;
      dbconn.query(query, [data], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };
  const insertUserData = async (data) => {

    return new Promise((resolve, reject) => {
      const query = `INSERT INTO users SET ?`;
      dbconn.query(query, [data], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };
  const userDetailByEmail = async (email) => {
    try {
      let query = `SELECT * FROM users WHERE email_id = ?`;
      return new Promise((resolve, reject) => {
        dbconn.query(query, [email], (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }
          return resolve(results[0]);
        });
      });
    } catch (error) {
      console.error("Error in selectQuery:", error);
      throw error; 
    }
  }

  const saveUploadStats = async (data) => {
    try {
        const query = `
            INSERT INTO s_tbl_upload_statistics (
                total_records, 
                successful_records, 
                failed_records, 
                filename,
                file_path,
                upload_time
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.total,
            data.success,
            data.failure,
            data.filename,
            data.file_path,
            new Date()
        ];
        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    } catch (error) {
        console.error("Error in saveUploadStats:", error);
        throw error;
    }
};

const approveUser = async ( data,id) => {
    try {
        const query = `UPDATE prospective_info SET aseemail = ? WHERE user_id = ?`;
        var values = [
            data.email_id,
            id
        ];
        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    } catch (error) {
        console.error("Error in approveUser:", error);
        throw error;
    }
};
const getAllRegions = () => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT id, region_name FROM s_tbl_region_master';
      dbconn.query(query, (error, results) => {
          if (error) return reject(error);
          resolve(results);
      });
  });
};

// Get all territories
const getAllTerritories = () => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT id, territory_name FROM s_tbl_territory_master';
      dbconn.query(query, (error, results) => {
          if (error) return reject(error);
          resolve(results);
      });
  });
};

// Get all channels
const getAllChannels = () => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT id, channel_name FROM s_tbl_channel_master';
      dbconn.query(query, (error, results) => {
          if (error) return reject(error);
          resolve(results);
      });
  });
};

// Get transferable users
const getTransferableUsers = () => {
  return new Promise((resolve, reject) => {
      const query = `
          SELECT 
             *
          FROM users 
          WHERE 1 = 1
      `;
      dbconn.query(query, (error, results) => {
          if (error) return reject(error);
          resolve(results);
      });
  });
};

// Transfer User
const transferUser = (transferData) => {
  return new Promise((resolve, reject) => {
      const query = `
          UPDATE users 
          SET 
              region_id = ?, 
              territory_id = ?, 
              channel_id = ?,
              updated_at = NOW()
          WHERE id = ?
      `;
      const values = [
          transferData.new_region, 
          transferData.new_territory, 
          transferData.new_channel,
          transferData.user_id
      ];

      dbconn.query(query, values, (error, results) => {
          if (error) return reject(error);
          resolve(results.affectedRows > 0);
      });
  });
};


  module.exports = {
    userDetail,
    userDetailById,
    role,
    updateuser,
    insertUserLog,
    insertupdateData,
    insertUserData,
    userDetailByEmail,
    saveUploadStats,
    approveUser,
    getAllRegions,
    getAllTerritories,
    getAllChannels,
    getTransferableUsers,
    transferUser
  }
