const navbar = require('../../models/super_navbar.model');
const tabModel = require('../../models/super_tab/tab.model');
const { decryptData } = require("../../util/encryption");

const renderTabPage = async (req, res, next) => {
  try {
    let id = req.params.id;
    let email = decryptData(req.cookies.e);

    let data = await navbar.selectQuery(email);

    let navbarviews = await navbar.navbarviewesult(data);
    let regions = await tabModel.getAllRegions();
    let territories = await tabModel.getAllTerritories();
    let rolename = await tabModel.getRoleName(id);
    let users = await tabModel.getUsersByRole(id);
    res.render('tab', {
      token: navbarviews, success: req.session.success,
      error: req.session.error,
      regions: regions,
      territories: territories,
      id: id,
      rolename: rolename,
      users: users
    });
    req.session.destroy();
  }
  catch (error) {
    console.log("error:- ", error);
    return res.redirect("/dashboard");
  }
}

const getTerritories = async (req, res, next) => {
  try {
    let regionIds = req.body.regionIds;
    let territories = await tabModel.getTerritories(regionIds);
    res.json(territories);
  }
  catch (error) {
    console.log("error:- ", error);
    return res.status(500).json({ error: "Failed to fetch territories" });
  }
}

const insertUser = async (req, res, next) => {
  try {
    let data = req.body;
    let usercheck = await tabModel.getUsersBy(data.role_id, data.email_id);
    // if (usercheck.length > 0) {
    //   req.session.error = "User already exists";
    //   return res.redirect("/tab");
    // }
    if (data.role_id == 1) {
      try {
        let rolename = await tabModel.getRoleName(data.role_id);
        data.role = rolename[0].role;
        let result = await tabModel.insertUser(data);
        let existingTerritories = await tabModel.whereuserTerritories(data.territories, data.role_id);
        if (existingTerritories.length > 0) {
          await tabModel.updateUserTerritories(result.insertId, data.territories, data.role_id);
        } else {
          let insertuserterritories = await tabModel.insertUserTerritoriesbyid(result.insertId, data.territories, data.role_id);
        }
        let applicationworkflow = await tabModel.applicationworkflow(data.territories, data.role_id);
        let updateapplicationworkflow = await tabModel.updateapplicationworkflow(result.insertId, applicationworkflow);
        let applicationdata = await tabModel.applicationdata(data.territories);
        let updateapplicationdata = await tabModel.updateapplicationdata(result.insertId, data.email_id, applicationdata);
        let offboardapplicationworkflow = await tabModel.offboardapplicationworkflow(data.territories, data.role_id);
        let updateoffboardapplicationworkflow = await tabModel.updateoffboardapplicationworkflow(result.insertId, offboardapplicationworkflow);
        let offboardapplicationdata = await tabModel.offboardapplicationdata(data.territories);
        let updateoffboardapplicationdata = await tabModel.updateoffboardapplicationdata(result.insertId, data.email_id, offboardapplicationdata);

        req.session.success = "Territories updated successfully";
      } catch (error) {
        console.error("Error handling territories:", error);
        req.session.error = "Error updating territories";
        return res.redirect("/tab/" + req.params.id + "/edit");
      }
      // let existingUserCheck = await tabModel.checkExistingUserInTerritories(data.role_id, data.territories);

      // if (existingUserCheck.length > 0) {
      //   req.session.error = "A user with this role already exists in the selected " + existingUserCheck[0].territory_name;
      //   return res.redirect("/tab");
      // }
    } else if (data.role_id == 4 || data.role_id == 2 || data.role_id == 3) {
      try {
        let rolename = await tabModel.getRoleName(data.role_id);
        data.role = rolename[0].role;
        let checkregion = await tabModel.checkExistingUserInRegion(data.role_id, data.email_id);
        if(checkregion.length > 0){
          req.session.error = "A user with this role already exists in the selected region";
          return res.redirect("/tab");
        }
        let checkemail = await tabModel.checkExistingUserInEmail(data.email_id);
        // if(checkemail.length > 0){
        //   req.session.error = "A user with this email already exists";
        //   return res.redirect("/tab");
        // }
        let result = await tabModel.insertUser(data);
        let userterritories = await tabModel.insertUserTerritories(result.insertId, data);
        req.session.success = "User created successfully";
      } catch (error) {
        console.log("error:- ", error);
        req.session.error = "Failed to create user";
        return res.redirect("/tab");
      }
    }else {
      let checkregion = await tabModel.checkExistingUserInRegion(data.role_id, data.email_id);
        if(checkregion.length > 0){
          req.session.error = "A user with this role already exists in the selected region";
          return res.redirect("/tab");
        }
      let rolename = await tabModel.getRoleName(data.role_id);
      data.role = rolename[0].role;
      let result = await tabModel.insertUser(data);
      let userterritories = await tabModel.insertUserTerritories(result.insertId, data);
      req.session.success = "User created successfully";
    }

    return res.redirect("/tab");
  }
  catch (error) {
    req.session.error = "Failed to create user";
    return res.redirect("/tab");
  }
}

const renderEditUserPage = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await tabModel.getUserById(userId);


    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/tab/" + user.role_id);
    }

    let email = decryptData(req.cookies.e);

    let data = await navbar.selectQuery(email);

    let navbarviews = await navbar.navbarviewesult(data);
    const regions = await tabModel.getAllRegions();
    const territories = await tabModel.getAllTerritoriesbyid(user.id);
    //console.log(territories,"territories");
    res.render('tab/edit', {
      user: user,
      token: navbarviews,
      regions: regions,
      territories: territories,
      success: req.session.success,
      error: req.session.error
    });

    // Clear session messages
    req.session.success = null;
    req.session.error = null;
  } catch (error) {
    console.error("Error rendering edit user page:", error);
    req.session.error = "Failed to load edit page";
    res.redirect("/tab/" + req.params.role_id);
  }
}

const updateUser = async (req, res, next) => {
  try {
    const userId = req.body.id;
    const existingUser = await tabModel.getUserById(userId);
    if (!existingUser) {
      req.session.error = "User not found";
      return res.redirect("/tab/" + existingUser.role_id);
    }
    const userData = {
      employee_name: req.body.employee_name,
      email_id: req.body.email_id,
      mobile_no: req.body.mobile_no,
      region: req.body.region,
      territory: req.body.territories,
      channel: req.body.channel,
      role_id: req.body.role_id
    };

    if (userData.role_id == 1) {
      try {
        let existingTerritories = await tabModel.whereuserTerritories(userData.territory, userData.role_id);

        if (existingTerritories.length > 0) {
          await tabModel.updateUserTerritories(userId, userData.territory, userData.role_id);
        } else {
          let insertuserterritories = await tabModel.insertUserTerritoriesbyid(userId, userData.territory, userData.role_id);
        }
        let applicationworkflow = await tabModel.applicationworkflow(userData.territory, userData.role_id);
        let updateapplicationworkflow = await tabModel.updateapplicationworkflow(userId, applicationworkflow);
        let applicationdata = await tabModel.applicationdata(userData.territory);
        let updateapplicationdata = await tabModel.updateapplicationdata(userId, existingUser.email_id, applicationdata);
        let offboardapplicationworkflow = await tabModel.offboardapplicationworkflow(userData.territory, userData.role_id);
        let updateoffboardapplicationworkflow = await tabModel.updateoffboardapplicationworkflow(userId, offboardapplicationworkflow);
        let offboardapplicationdata = await tabModel.offboardapplicationdata(userData.territory);
        let updateoffboardapplicationdata = await tabModel.updateoffboardapplicationdata(userId, existingUser.email_id, offboardapplicationdata);

        req.session.success = "Territories updated successfully";
      } catch (error) {
        console.error("Error handling territories:", error);
        req.session.error = "Error updating territories";
        return res.redirect("/tab/edit" + req.params.id);
      }
    }
    
    else {
      try {
        // Delete existing territories for this user and role
        await tabModel.deleteUserTerritories(userId, userData.role_id);

        // Convert territories to array if it's not already
        const territoryArray = Array.isArray(userData.territory) ? userData.territory : userData.territory.split(',');

        // Insert all territories as new
        if (territoryArray.length > 0) {
          let insertuserterritories = await tabModel.insertUserTerritoriesbyid(userId, territoryArray, userData.role_id);
        }

        req.session.success = "Territories updated successfully";
      } catch (error) {
        console.error("Error handling territories:", error);
        req.session.error = "Error updating territories";
        return res.redirect("/tab/" + req.params.id + "/edit");
      }
    }

    await tabModel.updateUser(userId, userData);

    req.session.success = "User updated successfully";
    res.redirect("/tab/" + existingUser.role_id);
  } catch (error) {
    console.error("Error updating user:", error);
    req.session.error = "Failed to update user";
    res.redirect("/tab/" + req.body.role_id);
  }
}

module.exports = {
  renderTabPage,
  getTerritories,
  insertUser,
  renderEditUserPage,
  updateUser
};
