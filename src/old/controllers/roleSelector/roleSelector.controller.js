const {
  selectQuery,
  selectQueryForRole,
} = require("../../models/roleSelector/roleSelector.model");
const { createToken } = require("../../util/jwt");

const roleSelectorCtrlView = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true });
    res.clearCookie("user_id", { httpOnly: true });
    res.clearCookie("role_name", { httpOnly: true });
    res.clearCookie("role_id", { httpOnly: true });
    res.clearCookie("region_id", { httpOnly: true });
    res.clearCookie("territory", { httpOnly: true });
    res.clearCookie("UserName", { httpOnly: true });
    let email = req.cookies.email;
    let results = await selectQuery({ email });
    res.render("roleSelector", { results });
    req.session.notification = null;
  } catch (error) {
    console.log(error, "error");
    req.session.notification = {
      type: "warning",
      message: "Sorry You Can not Access this user Id !",
    };
    return res.redirect("/lead_status");
  }
};

const setRoleSelectorCtrl = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true });
    res.clearCookie("user_id", { httpOnly: true });
    res.clearCookie("role_name", { httpOnly: true });
    res.clearCookie("role_id", { httpOnly: true });
    res.clearCookie("region_id", { httpOnly: true });
    res.clearCookie("territory", { httpOnly: true });
    res.clearCookie("UserName", { httpOnly: true });
    let email = req.cookies.email;
    let user = await selectQueryForRole(email, req.body.role);

    console.log(user, "user", email, req.body.role);

    let token = await createToken({ email: user.email_id });
    res.cookie("token", token, { httpOnly: true });
    res.cookie("email", user?.email_id, { httpOnly: true });
    res.cookie("user_id", user?.id, { httpOnly: true });
    res.cookie("role_name", user?.role, { httpOnly: true });
    res.cookie("role_id", user?.role_id, { httpOnly: true });
    res.cookie("region_id", user?.region, { httpOnly: true });
    res.cookie("UserName", user?.employee_name, { httpOnly: true });
    res.cookie("territory", user?.territory, { httpOnly: true });
    return res
      .status(200)
      .json({ success: true, message: "Login Successful!" });
  } catch (error) {
    console.log(error, "error");
    req.session.notification = {
      type: "warning",
      message: "Sorry You Can not Access this user Id !",
    };
    return res.redirect("/lead_status");
  }
};

module.exports = { roleSelectorCtrlView, setRoleSelectorCtrl };
