"user strict";
const mysql = require("mysql");


const connection = mysql.createPool({
  host: "178.156.218.239",
  user: "admin",
  password: "J@!krishn@3030",
  database: "mars_onboarding_uat",
});


module.exports = connection;
