const dbCon = require('../config/db');


const filterKycData = async (data) => {
        // let query = `select kyc_details_history.*, awsm_details.*, distributor_details.*, ase_details.* from kyc_details_history INNER JOIN awsm_details on awsm_details.awsm_code=kyc_details_history.awsm_code INNER JOIN distributor_details on kyc_details_history.aw_code = distributor_details.aw_code INNER JOIN ase_details on kyc_details_history.ase_email = ase_details.ase_email_id where 1 = 1 AND kyc_type != 'FRESH'`;
        // let query = `select  kyc_details.*, kyc_details.created_on,kyc_details.SellerType,kyc_details.pancard_no,kyc_details.pancard_image,kyc_details.JoiningDate,kyc_details.update_old_modification_date, kyc_details.kyc_type, kyc_details.ase_email, kyc_details.aw_code, kyc_details.awsm_code, kyc_details.bank_account_no, kyc_details.ifsc_code, kyc_details.address, kyc_details.bank_cheque, kyc_details.bank_name, kyc_details.photo, kyc_details.beneficiary_name, kyc_details.photo_id, kyc_details.mobile_no, kyc_details.calling_count, kyc_details.calling_status, kyc_details.calling_remarks, kyc_details.status, kyc_details.wip_remarks, kyc_details.approved_comment, kyc_details.approved_on, kyc_details.gender, kyc_details.dob, kyc_details.update_timestamp, kyc_details.update_old_modification_date, kyc_details.re_kyc_edit_on, kyc_details.replace_kyc_edit_on ,kyc_details.approved_kyc_edit_on ,  awsm_details.channel, awsm_details.awsm_name, awsm_details.salesman_type, awsm_details.awsm_city, awsm_details.awsm_state,  distributor_details.aw_name, ase_details.ase_employee_code, ase_details.ase_name from kyc_details INNER JOIN awsm_details on awsm_details.awsm_code=kyc_details.awsm_code INNER JOIN distributor_details on distributor_details.aw_code = kyc_details.aw_code INNER JOIN ase_details on ase_details.ase_email_id = kyc_details.ase_email where 1 = 1 AND kyc_details.status != 'PENDING'`;
        let query = `SELECT 
          kyc_details.*,
          awsm_details.*,
          kyc_details.created_on,
          kyc_details.SellerType,
          kyc_details.pancard_no,
          kyc_details.pancard_image,
          awsm_details.channel,
          awsm_details.awsm_name,
          awsm_details.salesman_type,
          awsm_details.awsm_city,
          awsm_details.awsm_state,
          distributor_details.name,
          distributor_details.distributorcode,
          ase_details.ase_employee_code,
          ase_details.ase_name,
          ase_details.ASM_Name,
          ase_details.ASM_email,
          ase_details.ase_territory_code,
          ase_details.asm_territory_code,
          awsm_details.id as sal_emp_code,
          awsm_details.Salesman_Emp_CODE as emp_code
          FROM 
            kyc_details
          INNER JOIN 
            awsm_details ON awsm_details.awsm_code = kyc_details.awsm_code
          INNER JOIN 
            distributor_details ON distributor_details.distributorcode = kyc_details.aw_code
          INNER JOIN 
            ase_details ON ase_details.ase_email_id = kyc_details.ase_email
           WHERE kyc_details.status = 'SUCCESS'`;
      
      
      
        if (data.Mobile) {
          query += ` AND kyc_details.mobile_no = '${data.Mobile}'`;
        }
        if (data.salesman_id) {
          query += ` AND kyc_details.awsm_code = '${data.salesman_id}'`;
        }
        if (data.salesman_name) {
          query += ` AND awsm_details.awsm_name = '${data.salesman_name}'`;
        }
        if (data.salesman_type) {
          query += ` AND kyc_details.SellerType = '${data.salesman_type}'`;
        }
        if (data.aw_code) {
          query += ` AND kyc_details.aw_code = '${data.aw_code}'`;
        }
        if (data.aw_name) {
          query += ` AND distributor_details.name = '${data.aw_name}'`;
        }
      
        if (data.ase_code) {
          query += ` AND ase_details.ase_employee_code = '${data.ase_code}'`;
        }
        if (data.ase_name) {
          query += ` AND ase_details.ase_name = '${data.ase_name}'`;
        }
        if (data.fromDate && data.toDate) {
          query += ` AND kyc_details.created_on  >= ? AND kyc_details.created_on <= DATE_ADD(?, INTERVAL 1 DAY)`;
        }
        if (data.state) {
          query += ` AND awsm_details.awsm_state = '${data.state}'`;
        }
        if (data.city) {
          query += ` AND awsm_details.awsm_city = '${data.city}'`;
        }
        if (true) {
          query += ` ORDER BY kyc_details.approved_kyc_edit_on DESC`;
        }
        if (data.limit || true) {
          query += ` LIMIT ${parseInt(5)}`;
        }
        const queryParams = [];
      
        if (data.fromDate && data.toDate) {
          queryParams.push(data.fromDate, data.toDate);
        }
        return new Promise((resolve, reject) => {
          dbCon.query(query, queryParams, (error, result) => {
            if (error) {
              return reject(error);
            }
            return resolve(result);
          });
        });
  }
  

  const getAWSMCity = () => {
    let awsmCityQuery = 'SELECT awsm_city, COUNT(*) AS city_count FROM awsm_details GROUP BY awsm_city';
  
    return new Promise((resolve, reject) => {
      dbCon.query(awsmCityQuery, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  
  const updateKycStatus = (data) => {
    let updateStatus = `UPDATE kyc_details SET calling_count = '${data.calling_count || 0}', calling_status = '${data.calling_status || null}', calling_remarks = '${data.calling_remarks || null}', status = '${data.kyc_status || 'PENDING'}', wip_remarks = '${data.kyc_rejection_reason || null}', approved_comment = '${data.approved_comment}', approved_comment1 = '${data.approved_comment}' where kyc_id = '${data.kyc_id}'`
  
    return new Promise((resolve, reject) => {
      dbCon.query(updateStatus, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  const updateFreshKycStatus = (data) => {
    let updateStatus = `UPDATE kyc_details SET calling_count = '${data.calling_count || 0}', calling_status = '${data.calling_status || null}', calling_remarks = '${data.calling_remarks || null}', status = '${data.kyc_status || 'PENDING'}', kyc_type = 'RE-KYC-Request', wip_remarks = '${data.kyc_rejection_reason || null}', approved_on = '${data.todayDate}', approved_by = '${data.userName}', approved_comment = '${data.approved_comment}', approved_comment1 = '${data.approved_comment}',updated_date = '${data.todayDate}' where kyc_id = '${data.kyc_id}'`
  
    return new Promise((resolve, reject) => {
      dbCon.query(updateStatus, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  const updateReplaceKycStatus = (data) => {
    let updateStatus = `UPDATE kyc_details SET calling_count = '${data.calling_count || 0}', calling_status = '${data.calling_status || null}', calling_remarks = '${data.calling_remarks || null}', status = '${data.kyc_status || 'PENDING'}', wip_remarks = '${data.kyc_rejection_reason || null}', replace_kyc_edit_on = '${data.todayDate}', replace_kyc_edit_by = '${data.userName}', kyc_type = '${'RE-KYC-Request'}', approved_comment= '${data.approved_comment}', approved_comment1 = '${data.approved_comment}', updated_date = '${data.todayDate}' where kyc_id = '${data.kyc_id}'`
  
    return new Promise((resolve, reject) => {
      dbCon.query(updateStatus, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  const updateReKycStatus = (data) => {
    let updateStatus = `UPDATE kyc_details SET calling_count = '${data.calling_count || 0}', calling_status = '${data.calling_status || null}', calling_remarks = '${data.calling_remarks || null}', status = '${data.kyc_status || 'PENDING'}', wip_remarks = '${data.kyc_rejection_reason || null}', re_kyc_edit_on = '${data.todayDate}', re_kyc_edit_by = '${data.userName}', kyc_type = '${'RE-KYC-Request'}', approved_comment = '${data.approved_comment}', approved_comment1 = '${data.approved_comment}', updated_date = '${data.todayDate}' where kyc_id = '${data.kyc_id}'`
  
    return new Promise((resolve, reject) => {
      dbCon.query(updateStatus, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  const selectPhoenix = async (id) => {
    let query = `SELECT * FROM third_party_phoenix_data WHERE id = '${id}'`;
    return new Promise((resolve, reject) => {
      dbCon.query(query, (error, result) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(result);
        }
      });
    });
  }
  
  const updateThirdPartyData = async (data, id) => {
    let query = `UPDATE third_party_phoenix_data SET client_id = ?, campaign_id =? , url =? , request=?, response=?, status = ?, flag = ?, count = ? WHERE id = '${id}'`;
  
    let requestJson = JSON.stringify(data.request);
    let responseJson = JSON.stringify(data.response);
  
    let values = ['BRIT_20190625', '100005555', data.url, requestJson, responseJson, data.status, data.flag, data.count];
  
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
  
  
  
  const SaveThirdPartyData = async (data) => {
    let query = 'INSERT INTO third_party_phoenix_data (client_id, campaign_id, url, request, response, status, flag, count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  
    let requestJson = JSON.stringify(data.request);
    let responseJson = JSON.stringify(data.response);
  
    let values = ['BRIT_20190625', '100005555', data.url, requestJson, responseJson, data.status, data.flag, data.count];
    return new Promise((resolve, reject) => {
      dbCon.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
  
  const CurrentUser = async (email) => {
  
    let query = `SELECT * FROM awsm_users WHERE email = '${email}'`;
  
    return new Promise((resolve, reject) => {
      dbCon.query(query, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
  const selectAWSM = async (awsmCode) => {
    try {
      let query = `SELECT * FROM awsm_details WHERE awsm_code = '${awsmCode}'`;
      const result = await new Promise((resolve, reject) => {
        dbCon.query(query, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      return result.length > 0 ? result[0] : null; // Return the first element if found, otherwise null
    } catch (error) {
      throw error;
    }
  }
  
  module.exports = { filterKycData, getAWSMCity, updateKycStatus, SaveThirdPartyData, selectPhoenix, updateThirdPartyData, updateFreshKycStatus, updateReplaceKycStatus, updateReKycStatus, CurrentUser, selectAWSM }
