const dbconn = require("../../config/db");
const CryptoJS = require('crypto-js');

const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, 'mnh&phy$secret*kjy@ou20!rc'); 
    return bytes.toString(CryptoJS.enc.Utf8);
};
const saveUser = async (data, email) => {
  try {
    let query = `
            INSERT INTO tbl_role 
            ( parent_id, role, display_name, email) 
            VALUES ( ?, ?, ?, ?)
        `;

    // Prepare the array of values corresponding to the columns
    let values = [data.parent_id, data.role, data.display_name, email];

    return new Promise((resolve, reject) => {
      // Execute the query with values
      dbconn.query(query, values, (err, result) => {
        if (err) {
          console.log(err,"...................");
          return reject(err); // Handle the error
        }
        return resolve(result); // Resolve with the result of the query
      });
    });
  } catch (error) {
    return error; // Catch and return unexpected errors
  }
};
const saverole = async (data, role_id) => {
  const view = 1;
  const query = `
      INSERT INTO tbl_role_permission (role_id, view, module_name, approval, reject, dummy_code, clarification, correction_from_cd, correction_from_executive) 
      VALUES ?
  `;

  // Ensure `module_name` is an array, even if it's a single value
  const modules = Array.isArray(data.module_name) ? data.module_name : [data.module_name];

  const values = modules.map(module => [
      role_id,
      view,
      module,
      data.approval,
      data.reject,
      data.dummy_code,
      data.clarification,
      data.correction_from_cd,
      data.correction_from_executive
  ]);

  return new Promise((resolve, reject) => {
      dbconn.query(query, [values], (error, result) => {
          if (error) {
              console.error("Error inserting data:", error);
              return reject(error);
          }
          return resolve(result);
      });
  });
};


const logCreate = async (data, type, email) => {
  data.parent_id = data.parent_id ? data.parent_id : 0;
  if (Array.isArray(data.module_name)) {
      data.module_name = JSON.stringify(data.module_name);
  }

  data.type = type;
  data.email = email;

  let query = `INSERT INTO roleuserslog SET ?`;

  return new Promise((resolve, reject) => {
      dbconn.query(query, data, (error, result) => {
          if (error) {
              console.error("Error inserting data:", error);
              return reject(error);
          }
          return resolve(result);
      });
  });
};

const logCreatedelete = async (data, type, email) => {
  const row = data[0];

  if (!row) {
    console.error("No data available to log");
    return;
  }

  try {
    const query = `
            INSERT INTO roleuserslog 
            SET
                roleuserid = ?, 
                Dashboard = ?, 
                ProspectiveDistributors = ?, 
                Invite = ?, 
                ScoutingSheet = ?, 
                ApproverInbox = ?, 
                ApplicationList = ?, 
                DistributorsList = ?, 
                RoleManagement = ?, 
                UserManagement = ?, 
                TerritoryManagement = ?, 
                displayname = ?,
                created_date = ?, 
                type = ?, 
                email = ?, 
                role = ?`;

    const values = [
      row.id, // Extract the ID from the first object in the array
      row.Dashboard,
      row.ProspectiveDistributors,
      row.Invite,
      row.ScoutingSheet,
      row.ApproverInbox,
      row.ApplicationList,
      row.DistributorsList,
      row.RoleManagement,
      row.UserManagement,
      row.TerritoryManagement,
      row.displayname,
      row.created_date,
      type,
      email,
      row.role,
    ];


    return new Promise((resolve, reject) => {
      dbconn.query(query, values, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

const selectUsers = async (data) => {
  let query = `SELECT * FROM tbl_role WHERE role = '${data.role}'`;

  return new Promise((resolve, reject) => {
    dbconn.query(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};

const deleteRoleFromDatabase = async (roleId) => {
  const deleteRoleQuery = `
        DELETE FROM tbl_role WHERE id = ?
    `;
  const deletePermissionsQuery = `
        DELETE FROM tbl_role_permission WHERE role_id = ?
    `;

  const queryAsync = (query, data) => {
    return new Promise((resolve, reject) => {
      dbconn.query(query, data, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  };

  try {
    // Start transaction
    await queryAsync("START TRANSACTION");

    // Delete permissions
    let deletePermissionsResult = await queryAsync(deletePermissionsQuery, [roleId]);

    // Delete role
    let deleteRoleResult = await queryAsync(deleteRoleQuery, [roleId]);

    // Commit transaction
    await queryAsync("COMMIT");

    // Return an object with the results
    return {
      deletedRole: deleteRoleResult,
      deletedPermissions: deletePermissionsResult,
    };
  } catch (error) {
    // Rollback transaction on error
    await queryAsync("ROLLBACK");
    throw error;
  }
};


// const deleteRoleFromDatabase = async (roleId) => {
//   const deleteRoleQuery = `
//         DELETE FROM tbl_role WHERE id = ?
//     `;
//   const deletePermissionsQuery = `
//         DELETE FROM tbl_role_permission WHERE role_id = ?
//     `;

//   const queryAsync = (query, data) => {
//     return new Promise((resolve, reject) => {
//       dbconn.query(query, data, (error, result) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(result);
//       });
//     });
//   };

//   try {
//     // Start transaction
//     await queryAsync("START TRANSACTION");

//     // Delete role
//     await queryAsync(deleteRoleQuery, [roleId]);

//     // Delete permissions
//     await queryAsync(deletePermissionsQuery, [roleId]);

//     // Commit transaction
//     await queryAsync("COMMIT");
//   } catch (error) {
//     // Rollback transaction on error
//     await queryAsync("ROLLBACK");
//     throw error;
//   }
// };

const deletedataUsers = async (data) => {

  let query = `SELECT * FROM roleusers WHERE role = '${data}'`;

  return new Promise((resolve, reject) => {
    dbconn.query(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};

const rolemanagmentresult = async (req, res, data) => {
  let query = `SELECT tblrole.*, 
                        GROUP_CONCAT(role_permission.module_name) AS module_names
                 FROM tbl_role AS tblrole
                 JOIN tbl_role_permission AS role_permission 
                 ON tblrole.id = role_permission.role_id
                 WHERE tblrole.role != 'admin'
                 GROUP BY tblrole.id`;

  return new Promise((resolve, reject) => {
    dbconn.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      result.forEach((role) => {
        role.module_names = role.module_names
          ? role.module_names.split(",")
          : [];
      });
      return resolve(result);
    });
  });
};

const business_line = async (req, res, data) => {
  let query = `SELECT * FROM tbl_business_line WHERE flag = 1`;

  return new Promise((resolve, reject) => {
    dbconn.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};
const navbarviewesult = async (req, res, data) => {
  let role_id = req.cookies.role_id.role;
  let encryptedUserEmail = req.cookies.Text;

  let userEmail = decryptData(encryptedUserEmail);
  let query = `
    SELECT tbl_role_permission.*, users.email_id, users.role, users.role_id, 
    users.employee_name as employeename, tbl_role.role
    FROM tbl_role_permission
    JOIN users ON FIND_IN_SET(tbl_role_permission.role_id, users.role_id)
    JOIN tbl_role ON tbl_role.id = tbl_role_permission.role_id
    WHERE FIND_IN_SET(tbl_role_permission.role_id, ?) AND users.id = ?
    GROUP BY tbl_role_permission.module_name
    `;

  return new Promise((resolve, reject) => {
    // Pass the role_id and user's email as parameters
    dbconn.query(query, [role_id, userEmail], (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};

const navbarviewesults = async (req, res, data) => {
  let role_id = req.cookies.role_id.role;

  let query = `
        SELECT *
        FROM tbl_role_permission
        WHERE tbl_role_permission.role_id = ?
    `;

  return new Promise((resolve, reject) => {
    // Pass the role_id as a parameter to the query
    dbconn.query(query, [role_id], (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};

const editroleviewviewesult = async (req, res, data) => {
  let query = `SELECT tblrole.*, role_permission.*, tblrole.id as roleid,
                        GROUP_CONCAT(role_permission.module_name) AS module_names
                 FROM tbl_role AS tblrole
                 JOIN tbl_role_permission AS role_permission 
                 ON tblrole.id = role_permission.role_id
                 WHERE tblrole.role = ?
                 GROUP BY tblrole.id`;
  // let querys = `SELECT * FROM tbl_role WHERE role = ? `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, data, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result[0]);
    });
  });
};

const updaterole = async (data, roleId) => {

  const {
    parent_id,
    displayname,
    module_name,
    approval,
    reject,
    dummy_code,
    clarification,
    correction_from_cd,
    correction_from_executive,
  } = data;

  // Ensure module_name is always treated as an array
  const permissionKeys = Array.isArray(module_name)
    ? module_name
    : [module_name];

  const updateRoleQuery = `
        UPDATE tbl_role 
        SET parent_id = ?, display_name = ?
        WHERE id = ?
    `;
  const deletePermissionsQuery = `
        DELETE FROM tbl_role_permission WHERE role_id = ?
    `;
  const insertPermissionsQuery = `
        INSERT INTO tbl_role_permission (role_id, module_name, view, approval, reject, dummy_code, clarification, correction_from_cd, correction_from_executive) 
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    `;

  const queryAsync = (query, data) => {
    return new Promise((resolve, reject) => {
      dbconn.query(query, data, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  };

  try {
    // Start transaction
    await queryAsync("START TRANSACTION");

    // Update role
    await queryAsync(updateRoleQuery, [parent_id || 0, displayname, roleId]);

    // Delete existing permissions
    await queryAsync(deletePermissionsQuery, [roleId]);

    // Insert new permissions for each module_name
    for (const permissionKey of permissionKeys) {
      await queryAsync(insertPermissionsQuery, [
        roleId,
        permissionKey,
        approval,
        reject,
        dummy_code,
        clarification,
        correction_from_cd,
        correction_from_executive,
      ]);
    }

    // Commit transaction
    await queryAsync("COMMIT");
  } catch (error) {
    // Rollback transaction on error
    await queryAsync("ROLLBACK");
    throw error;
  }
};

const updateroles = async (data, roleId) => {
  const { business_line_id, parent_id, displayname, module_name } = data;

  const permissionKeys = Array.isArray(module_name)
    ? module_name
    : [module_name];
  const permissionsData = permissionKeys.map((permissionKey) => [
    roleId,
    permissionKey,
    1,
  ]);

  const updateRoleQuery = `
        UPDATE tbl_role 
        SET  parent_id = ?, display_name = ?
        WHERE id = ?
    `;
  const deletePermissionsQuery = `
        DELETE FROM tbl_role_permission WHERE role_id = ?
    `;
  const insertPermissionsQuery = `
        INSERT INTO tbl_role_permission (role_id, module_name, view) VALUES ?
    `;

  const queryAsync = (query, data) => {
    return new Promise((resolve, reject) => {
      dbconn.query(query, data, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  };

  try {
    // Start transaction
    await queryAsync("START TRANSACTION");

    // Update role
    await queryAsync(updateRoleQuery, [parent_id, displayname, roleId]);

    // Delete existing permissions
    await queryAsync(deletePermissionsQuery, [roleId]);

    // Insert new permissions
    if (permissionsData.length > 0) {
      await queryAsync(insertPermissionsQuery, [permissionsData]);
    }

    // Commit transaction
    await queryAsync("COMMIT");
  } catch (error) {
    // Rollback transaction on error
    await queryAsync("ROLLBACK");
    throw error;
  }
};

const deleteRole = async (role) => {
  const query = "DELETE FROM roleusers WHERE role = ?";
  return new Promise((resolve, reject) => {
    dbconn.query(query, [role], (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};
const tbl_role = async (data) => {
  let query = `SELECT * FROM tbl_role WHERE 1 = 1`;
  return new Promise((resolve, reject) => {
    dbconn.query(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};

const getGraphData = async (req, res) => {
  let encryptedUserEmail = req.cookies.Text;

  let user= decryptData(encryptedUserEmail);

  let query = `SELECT prospect.*,user.employee_name as last_approver_name,distributoeuser.from_user,distributor_documents.personal_pan_number,
    (select group_concat(distinct flag) from tbl_distributor_approver_log where approve_by=? and distributor_id=prospect.id) as user_flag
        FROM prospective_info as prospect
        left join users as user on user.id=prospect.last_approval_action_user_id
        LEFT JOIN  distributor_documents ON   distributor_documents.distributor_emails =prospect.email_id
        LEFT join tbl_distributor_approver_log as distributoeuser on distributoeuser.approve_by=prospect.last_approval_action_user_id
        WHERE  (FIND_IN_SET(?,total_approval_action_user_ids) or approval_action_user_id=?)
        group by prospect.id
        order by prospect.create_date desc        
        `;

  return new Promise((resolve, reject) => {
    dbconn.query(query, [user, user, user], (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
};
module.exports = {
  getGraphData,
  saveUser,
  selectUsers,
  rolemanagmentresult,
  navbarviewesult,
  editroleviewviewesult,
  updaterole,
  deleteRole,
  logCreate,
  deletedataUsers,
  logCreatedelete,
  navbarviewesults,
  business_line,
  saverole,
  deleteRoleFromDatabase,
  tbl_role,
};
