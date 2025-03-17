"user strict";
const mysql = require("mysql");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "onboarding_adani",
});

// const connection = mysql.createPool({
//   host: "13.234.162.67",
//   user: "anuj",
//   password: "Anuj@3112",
//   database: "uat_mkyc",
// });

// const connection = mysql.createPool({
//   host: "13.234.162.67",
//   user: "anuj",
//   password: "Anuj@3112",
//   database: "m_kyc",
// });



// const connection = mysql.createPool({
//   host: "marsh-mysql.cpeybyvf5bd4.ap-south-1.rds.amazonaws.com",
//   user: "himanshu",
//   password: "hfusGsfeckgua2gs",
//   database: "uat_mkyc",
// });


// const connection = mysql.createPool({
//   host: "13.234.162.67",
//   user: "anuj",
//   password: "Anuj@3112",
//   database: "kyc",
// });

module.exports = connection;
