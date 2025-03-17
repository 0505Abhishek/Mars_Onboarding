const { selectNotification } = require('../models/notification.model');


const getNotification = async (req, res, next) => {
  // let result = await selectNotification();
  let result=[];
  res.notification = result;
  next()
}

module.exports = { getNotification }