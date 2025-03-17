const dbCon = require('../config/db');


  const getperiod= async()=>
  {
    const currentDate = new Date().toISOString().split('T')[0];
    const query = `
  SELECT FromDate, ToDate 
  FROM period_calender
  WHERE FromDate <= ?
  ORDER BY ToDate DESC
  LIMIT 2
`;
  return new Promise((resolve, reject) => {
    dbCon.query(query,[currentDate],(error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  }); 
}

// const dumpQuery = async (data, date1, date2) => {
//   let { FromDate, ToDate } = date1;
//   let { FromDate: prevFromDate, ToDate: prevToDate } = date2;

//   let query = `
//   WITH LatestFacerecognition AS (
//     SELECT
//         sale_man_id,
//         create_date,
//         status,
//         img,
//         time,
//         ROW_NUMBER() OVER (PARTITION BY sale_man_id, DATE(create_date) ORDER BY time DESC) AS rn
//     FROM facerecognition
//     WHERE create_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
//       AND sale_man_id IS NOT NULL
//   )

//   SELECT 
//       LatestFacerecognition.sale_man_id,
//       awsm_details.awsm_code,
//       ase_details.ase_email_id,
//       distributor_details.name,
//       awsm_details.awsm_name,
//       distributor_details.region,
//       ase_details.asm_territory_code,
//       ase_details.ase_territory_code,
//       ase_details.ASM_Name,
//       ase_details.ase_name,
//       CASE
//           WHEN awsm_details.is_active = '1' THEN 'active'
//           ELSE 'inactive'
//       END as status,
//       MAX(LatestFacerecognition.time) AS Check_in_time,
//       CASE
//           WHEN MAX(LatestFacerecognition.status) = 601 THEN 'yes'
//           ELSE 'no'
//       END AS selfie_Matching,
//       CASE
//           WHEN MAX(LatestFacerecognition.img) IS NOT NULL THEN 'yes'
//           ELSE 'no'
//       END AS selfie,
//       (
//           SELECT COUNT(*)
//           FROM LatestFacerecognition AS fr
//           WHERE fr.sale_man_id = awsm_details.awsm_code
//             AND fr.create_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
//             AND fr.rn = 1
//       ) AS last_7_days_count,
//       (
//           SELECT COUNT(DISTINCT DATE(fr.create_date))
//           FROM facerecognition AS fr
//           WHERE fr.sale_man_id = awsm_details.awsm_code
//             AND fr.create_date BETWEEN ? AND ?
//       ) AS last_4weeks,
//       (
//           SELECT COUNT(DISTINCT DATE(fr.create_date))
//           FROM facerecognition AS fr
//           WHERE fr.sale_man_id = awsm_details.awsm_code
//             AND fr.create_date BETWEEN ? AND ?
//       ) AS previous_4weeks,
//       COUNT(DISTINCT CASE 
//           WHEN LatestFacerecognition.status = '602' 
//           AND DATE(LatestFacerecognition.create_date) = CURDATE() 
//           AND LatestFacerecognition.rn = 1 
//           THEN LatestFacerecognition.sale_man_id 
//       END) AS facematched,
//       DATEDIFF(?, ?) AS days_difference
//   FROM 
//       ase_details
//   INNER JOIN 
//       distributor_details ON distributor_details.SoEmailId = ase_details.ase_email_id
//   INNER JOIN  
//       awsm_details ON awsm_details.aw_code = distributor_details.distributorcode
//   LEFT JOIN
//       LatestFacerecognition ON LatestFacerecognition.sale_man_id = awsm_details.awsm_code
//       AND DATE(LatestFacerecognition.create_date) = CURRENT_DATE
//       AND LatestFacerecognition.rn = 1
//   WHERE 
//       awsm_details.awsm_code IS NOT NULL AND awsm_details.awsm_code != ''
//   GROUP BY
//       awsm_details.awsm_code, ase_details.ase_email_id, distributor_details.name, awsm_details.awsm_name, distributor_details.region, ase_details.asm_territory_code, ase_details.ase_territory_code;
//   `;

//   return new Promise((resolve, reject) => {
//     dbCon.query(query, [FromDate, ToDate, prevFromDate, prevToDate, FromDate, ToDate], (error, result) => {
//       if (error) {
//         return reject(error);
//       }
//       return resolve(result);
//     });
//   });
// };
  
const dumpQuery = async (data, date1, date2) => {
  let { FromDate, ToDate } = date1;
  let { FromDate: prevFromDate, ToDate: prevToDate } = date2;

  let query = `
  SELECT 
    awsm_details.awsm_code,
    ase_details.ase_email_id,
    distributor_details.name,
    awsm_details.awsm_name,
    distributor_details.region,
    ase_details.asm_territory_code,
    ase_details.ase_territory_code,
    ase_details.ASM_Name,
    ase_details.ase_name,
    awsm_details.is_active,
    kyc_details.status as kyc_status,
    MAX(CASE 
            WHEN DATE(facerecognition.create_date) = CURRENT_DATE 
            THEN facerecognition.time 
        END) AS time,
    MAX(CASE 
            WHEN DATE(facerecognition.create_date) = CURRENT_DATE 
            THEN facerecognition.status 
        END) AS status,
    MAX(CASE 
        WHEN DATE(facerecognition.create_date) = CURRENT_DATE 
      THEN facerecognition.img 
      END) AS img
        
  FROM 
      awsm_details
  INNER JOIN 
      distributor_details ON distributor_details.distributorcode = awsm_details.aw_code
  INNER JOIN 
      ase_details ON ase_details.ase_email_id = distributor_details.aseemailid
  LEFT JOIN 
      facerecognition ON facerecognition.sale_man_id = awsm_details.awsm_code
  LEFT JOIN
      kyc_details ON kyc_details.awsm_code = facerecognition.sale_man_id
  WHERE 
      awsm_details.awsm_code IS NOT NULL 
      AND awsm_details.awsm_code != ''
  GROUP BY
    awsm_details.awsm_code, 
    ase_details.ase_email_id, 
    distributor_details.name, 
    awsm_details.awsm_name, 
    distributor_details.region, 
    ase_details.asm_territory_code, 
    ase_details.ase_territory_code,
    ase_details.ASM_Name,
    ase_details.ase_name;

  `;

  return new Promise((resolve, reject) => {
    dbCon.query(query, [FromDate, ToDate, prevFromDate, prevToDate, FromDate, ToDate], (error, result) => {
      if (error) {
        return reject(error);
      }
      
      return resolve(result);
    });
  });
};

const last7Days = async (data, date1, date2) => {
  let query = `
    SELECT 
        awsm_details.awsm_code,
        CASE WHEN COUNT(DISTINCT DATE(facerecognition.create_date)) > 0 THEN 1 ELSE 0 END AS last_7_days_count
    FROM 
        awsm_details
    LEFT JOIN 
        facerecognition ON facerecognition.sale_man_id = awsm_details.awsm_code
    WHERE 
        facerecognition.create_date >= CURRENT_DATE - INTERVAL 7 DAY
        AND facerecognition.create_date < CURRENT_DATE
        AND DAYOFWEEK(facerecognition.create_date) != 1 
        AND facerecognition.status = "601"
    GROUP BY 
        awsm_details.awsm_code;
  `;

  return new Promise((resolve, reject) => {
    dbCon.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}


const last4Weeks = async (data, date1 , date2)=>
  {
    let { FromDate, ToDate } = date1;
    let { FromDate: prevFromDate, ToDate: prevToDate } = date2;
  
    let query = `
    SELECT 
    awsm_details.awsm_code,
    COUNT(DISTINCT DATE(facerecognition.create_date)) AS last_4_weeks
    FROM 
        awsm_details
    LEFT JOIN 
        facerecognition ON facerecognition.sale_man_id = awsm_details.awsm_code
    WHERE 
        facerecognition.create_date >= ?
        AND facerecognition.create_date <= CURRENT_DATE
    GROUP BY 
        awsm_details.awsm_code;
    `;
  
    return new Promise((resolve, reject) => {
      dbCon.query(query, [FromDate], (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
}

const previousPeriod = async (data, date1 , date2)=>
  {
    let { FromDate, ToDate } = date1;
    let { FromDate: prevFromDate, ToDate: prevToDate } = date2;
  
    let query = `
    SELECT 
    awsm_details.awsm_code,
    COUNT(DISTINCT DATE(facerecognition.create_date)) AS previous_period
    FROM 
        awsm_details
    LEFT JOIN 
        facerecognition ON facerecognition.sale_man_id = awsm_details.awsm_code
    WHERE 
        facerecognition.create_date >= ?
        AND facerecognition.create_date <= ?
    GROUP BY 
        awsm_details.awsm_code;

    `;
  
    return new Promise((resolve, reject) => {
      dbCon.query(query, [prevFromDate, prevToDate], (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
  }
const getEmail = async ()=>{
  let query = `
    SELECT email_to, email_cc FROM Attendance_email;
  `;

  return new Promise((resolve, reject) => {
    dbCon.query(query,(error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}




const getRegionBudgetCount = async () => {
  let query = `
    SELECT 
      region, 
      SUM(budget_count) AS total_budget_count
    FROM 
      budget_count
    GROUP BY 
      region;
  `;

  return new Promise((resolve, reject) => {
    dbCon.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};



const getAsmBugdetCount = async () => {
  let query = `
  SELECT
    region, 
    asm_territory_code, 
    SUM(budget_count) AS total_budget_count
  FROM 
    budget_count
  GROUP BY 
    region, asm_territory_code;
`;


  return new Promise((resolve, reject) => {
    dbCon.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};



const insertLog = async (log, currentDate) => {

  const query = `INSERT INTO Automailer_Log (so_email, response, error, date) VALUES (?, ?, ?, ?)`;

  const { email, response, error } = log;

  return new Promise((resolve, reject) => {
    dbCon.query(query, [email,response,error,currentDate], (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};





module.exports={insertLog, getEmail,getperiod,dumpQuery,last7Days,last4Weeks,previousPeriod, getRegionBudgetCount, getAsmBugdetCount};