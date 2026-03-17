const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const navbar = require('../../models/navbar.model');
const usermanagement = require('../../models/super_user_management/user_management.model');
const { decryptData } = require("../../util/encryption");

const userManagmentView = async (req, res, next) => {
  try {
    let email = decryptData(req.cookies.e);

    let data = await navbar.selectQuery(email);

    let navbarviews = await navbar.navbarviewesult(data);
    let userDetail = await usermanagement.userDetail();

    res.render('UserManagment', {
      token: navbarviews, success: req.session.success,
      error: req.session.error,
      user: userDetail
    });
    req.session.destroy();
  }
  catch (error) {
    console.log("error:- ", error);
    return res.redirect("/dashboard");
  }
}



const userManagmentedit = async (req, res, next) => {
  try {
    let email = decryptData(req.cookies.e);
    let data = await navbar.selectQuery(email);
    let navbarviews = await navbar.navbarviewesult(data);
    let id = req.params.id;
    let userDetailById = await usermanagement.userDetailById(id);
    let userDetail = await usermanagement.userDetail();
    let getrole = await usermanagement.role();


    return res.render('UserManagment/edit', {
      token: navbarviews, success: req.session.success,
      error: req.session.error,
      user: userDetail,
      userDetailById: userDetailById,
      getrole: getrole
    });
  }
  catch (error) {
    console.log("error:- ", error);
    return res.redirect("/dashboard");
  }
}

const updateuser = async (req, res) => {
  try {
    let data = req.body;
    let id = req.body.id;
    let log = await usermanagement.userDetailById(id);
    //console.log(log);
    await usermanagement.insertUserLog(log);
    let update = await usermanagement.updateuser(id, data);
    if (update) {
      req.session.success = "User updated successfully";
      return res.redirect("/user_management");
    }

  }
  catch (error) {
    console.log("error:- ", error);
    return res.redirect("/dashboard");
  }
}


const upload_new_user = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const csvFile = req.files.file;
    let csvData = await processCSV(csvFile.path);

    for await (const item of csvData) {
      if (item.parent_id) {
        item.parent_id = item.parent_id.replace(/^(cb|CB)/i, '');
      }
      await usermanagement.insertUserData(item);
      await usermanagement.insertupdateData(req, item);
      req.session.success = "User Create successfully";
      
    }
    return res.redirect("/user_management");

  } catch (error) {
    console.error("Error processing file:", error);
    req.session.error = "Failed to create user";
    return res.redirect("/user_management");
  }
};

const upload_update_user = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const csvFile = req.files.file;
    let csvData = await processCSV(csvFile.path);
    const { filePath, filename } = await handleFileUpload(csvFile);
    let stats = {
      total: csvData.length,
      success: 0,
      failure: 0,
      filename,
      file_path: filePath
    };
    for await (const item of csvData) {

     
      const userData = {
        employee_name: item.employee_name || '',
        email_id: item.email_id,
        role: item.role || '',
        role_id: item.role_id || '',
        mobile_no: item.mobile_no || '',
        designation: item.designation || '',
        city: item.city || '',
      };
      if (item.parent_id) {
        userData.parent_id = item.parent_id.replace(/^(cb|CB)/i, '');
      }

      if (item.user_id) {
        item.user_id = item.user_id.replace(/^(cb|CB)/i, '');
      }
      const existingUser = await usermanagement.userDetailById(item.user_id);

      if (existingUser) {
        await usermanagement.insertupdateData(req, existingUser);

        await usermanagement.updateuser(existingUser.id, userData);
        await usermanagement.approveUser( userData,existingUser.id, req);
        stats.success++;
        req.session.success = "User updated successfully";

      } else {
        req.session.error = "User not found";
        stats.failure++;
      }
    }
    await usermanagement.saveUploadStats(stats);
    const results = await Promise.allSettled(csvData);

    // Count successful and failed operations
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    // Prepare success message
    req.session.success = `Processed ${successCount} users (${failedCount} failed)`;

    return res.redirect("/user_management");

  } catch (error) {
    console.error("Error processing file:", error);
    req.session.error = "Failed to create user";
    return res.redirect("/user_management");
  }

};

function processCSV(filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filename)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

const handleFileUpload = async (file) => {
    try {
        const uploadDir = path.join(__dirname, '../../public/upload');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const timestamp = new Date().getTime();
        const extension = path.extname(file.name);
        const uniqueFilename = `user_update_${timestamp}${extension}`;

        const filePath = path.join(uploadDir, uniqueFilename);

        fs.copyFileSync(file.path, filePath);
        fs.unlinkSync(file.path);

        return {
            filePath,
            filename: uniqueFilename
        };
    } catch (error) {
        console.error("Error in handleFileUpload:", error);
        throw error;
    }
};


const getUserTransferView = async (req, res) => {
  try {
    let email = decryptData(req.cookies.e);
    let data = await navbar.selectQuery(email);
    let navbarviews = await navbar.navbarviewesult(data);
      const regions = await usermanagement.getAllRegions();
      const territories = await usermanagement.getAllTerritories();
      const channels = await usermanagement.getAllChannels();
      
      // Fetch users who can be transferred
      const transferableUsers = await usermanagement.getTransferableUsers();

      return res.render('UserManagment/user_transfer', {
          token: navbarviews,
          user: res.userDetail,
          regions,
          territories,
          channels,
          transferableUsers,
          success: req.session.success,
          error: req.session.error
      });
  } catch (error) {
      console.error('User Transfer View Error:', error);
      req.session.error = "Error loading user transfer page";
      return res.redirect('/user_management');
  }
};

// Process User Transfer
const processUserTransfer = async (req, res) => {
  try {
      const { 
        to_user_id, 
        from_user_id, 
      } = req.body;

      // Validate input
      if (!to_user_id || !from_user_id) {
          req.session.error = "All transfer fields are required";
          return res.redirect('/user_management/user-transfer');
      }
      const fromUser = await usermanagement.userDetailById(from_user_id);
      const toUser = await usermanagement.userDetailById(to_user_id);


      // await usermanagement.insertUserLog({
      //   user_id: from_user_id,
      //   action: "Transfer",
      //   new_region: toUser.region,
      //   new_territory: toUser.territory,
      //   new_channel: toUser.channel
      // });
      // await usermanagement.updateuser(from_user_id, { region: toUser.region, territory: toUser.territory, channel: toUser.channel });
      // await usermanagement.updateuser(to_user_id, { region: fromUser.region, territory: fromUser.territory, channel: fromUser.channel });
      
      req.session.success = "User transferred successfully";
      return res.redirect("/user_management/user-transfer");
  } catch (error) {
      console.error('User Transfer Error:', error);
      req.session.error = "An error occurred during user transfer";
      return res.redirect('/user_management/user-transfer');
  }
};
  

const getMappingView = async (req, res) => {
  try {
    let email = decryptData(req.cookies.e);
    let data = await navbar.selectQuery(email);
    let navbarviews = await navbar.navbarviewesult(data);
      const regions = await usermanagement.getAllRegions();
      const territories = await usermanagement.getAllTerritories();
      const channels = await usermanagement.getAllChannels();
      return res.render('UserManagment/mapping', {
          token: navbarviews,
          user: res.userDetail,
          regions,
          territories,
          channels,
          success: req.session.success,
          error: req.session.error
      });
  } catch (error) {
      console.error('Mapping View Error:', error);
      req.session.error = "Error loading mapping page";
      return res.redirect('/user_management');
  }
};
module.exports = {
  userManagmentView,
  userManagmentedit,
  updateuser,
  upload_new_user,
  upload_update_user,
  getUserTransferView,
  processUserTransfer,
  getMappingView
}

