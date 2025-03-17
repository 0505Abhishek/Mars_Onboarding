
const roleManagement = require('../../models/roleManagement/roleManagement.model');
const gettingNavbar = require('../../models/dashboard.model');

const roleManagmentView = async (req, res, next) => {
  let data = await gettingNavbar.selectQuery(req.cookies.email);     
  let navbarviews = await gettingNavbar.navbarviewesult(data);
  let roleManagment = await roleManagement.rolemanagmentresult(req, res, req.query);

    res.render("roleManagement", {
      roleManagment: roleManagment,
      message: req.session.message,
      success: req.session.success,
      error: req.session.error,
      token: navbarviews,
    });
    req.session.destroy();
  };

const createrole = async (req, res) => {
    // let encryptedUserEmail = req.cookies.e_l;
  
    // let email = decryptData(encryptedUserEmail);
    let data = await gettingNavbar.selectQuery(req.cookies.email);     
    let navbarviews = await gettingNavbar.navbarviewesult(data);
    // let business_line_view = await business_line(req, res);
    let tblrole = await roleManagement.tbl_role(req, res);
  
  
    res.render("roleManagement/createRole", {
      message: req.session.message,
      business_line_view: [],
      success: req.session.success,
      error: req.session.error,
      token: navbarviews,
      tblrole: tblrole
    });
    req.session.destroy();
  };
  
  const vieweditrole = async (req, res) => {
    let data = await gettingNavbar.selectQuery(req.cookies.email);     
    let navbarview = await gettingNavbar.navbarviewesult(data);
    // let business_line_view = await roleManagement.business_line(req, res);
    const emailrole = req.query.role;
    let editroleview = await roleManagement.editroleviewviewesult(req, res, emailrole);
    let tblrole = await roleManagement.tbl_role(req, res);
  
    res.render("roleManagement/editRole", {
      role: emailrole,
      business_line_view: {},
      editroleview: editroleview,
      message: req.session.message,
      success: req.session.success,
      token: navbarview,
      tblrole: tblrole,
    });
  };
  
  const editrole = async (req, res) => {
    try {
      // let encryptedUserEmail = req.cookies.e_l;
  
      // let email = decryptData(encryptedUserEmail);
      let email = req.cookies.email;
    
      // Ensure role ID is available in the request
      if (!req.body.id) {
        throw new Error("Role ID is missing");
      }
  
      await roleManagement.updaterole(req.body, req.body.id);
      const type = "update";
      // await logCreate(req.body, type, email);

      req.session.success = "Role updated successfully";
      res.redirect("/role_managment");
    } catch (error) {
      console.error("Error updating role:", error);
      req.session.error = "Failed to update role";
      if (!res.headersSent) {
        res.redirect("/role_managment");
      }
    }
  };
  
  const insertrole = async (req, res) => {

    let selectUser = await roleManagement.selectUsers(req.body);
    // let encryptedUserEmail = req.cookies.e_l;
  
    // let email = decryptData(encryptedUserEmail);
  
    if (selectUser.length === 0) {
      // let encryptedUserEmail = req.cookies.e_l;
  
      // let email = decryptData(encryptedUserEmail);
      let email = "abhisharma05052002@gmail.com";
      req.body.parent_id = req.body.parent_id ? req.body.parent_id : 0;
      const viewid = await roleManagement.saveUser(req.body, email);
      const insertId = viewid.insertId;
      await roleManagement.saverole(req.body, insertId);
  
      const type = "Create";
  
      req.session.success = "User Role Create successfully";
    } else {
      req.session.message = "Role Already Exists";
    }
    const type = "insert";
    // await logCreate(req.body, type, email);
    res.redirect("/role_managment");
  };
  
  const deleteview = async (req, res) => {
    const role = req.query.role;
    let encryptedUserEmail = req.cookies.e_l;
  
    let email = decryptData(encryptedUserEmail);
    try {
      await deleteRoleFromDatabase(role);
      const type = "delete";
      await logCreate(req.body, type, email);
      req.session.success = "Role deleted successfully";
      res.redirect("/role_managment");
    } catch (error) {
      console.error("Error deleting role:", error);
      req.session.error = "Failed to delete role";
      res.redirect("/role_managment");
    }
  };
  
  module.exports = {
    roleManagmentView,
    createrole,
    insertrole,
    editrole,
    vieweditrole,
    deleteview,
  };
  
