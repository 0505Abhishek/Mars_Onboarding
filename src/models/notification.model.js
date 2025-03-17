const dbCon = require('../config/db');


const selectNotification = async () => {
  let query = `SELECT * FROM notification where status = 0 limit 5`
  return new Promise((resolve, reject) => {
    dbCon.query(query, (error, result) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(result);
      }
    })
  })
}


const updateNotification = async (data) => {
  const query = 'UPDATE notification SET status = 1 WHERE id = ?';
  const values = [data.notify_id];

  return new Promise((resolve, reject) => {
    dbCon.query(query, values, (error, result) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(result);
      }
    });
  });
};


module.exports = { selectNotification, updateNotification }