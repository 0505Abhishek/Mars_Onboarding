const bcrypt = require("bcryptjs");
const {
  createToken,
  getEmailTokenDetails,
  createResetToken,
} = require("../../util/jwt");
const { sendLinkOnMail, sendMailToCreate } = require("../../util/send.mail");
const {
  insertQuery,
  selectQueryById,
  selectQuery,
  updateQuery,
  updateQueryByToken,
  updatePasswordByToken,
  password_history,
  getPassworHistory,
  setLoginCount,
} = require("../../models/account.model");
const superAdmin = require("../../models/super_account.model");

const passwordCheck = require("../../controllers/passwordCheck/passwordVerification.controller");
let loginCountContainer = 0;
const { encryptData } = require("../../util/encryption");

const tokenView = async (req, res) => {
  let msg = req.session.message || "";

  req.session.message = null;

  res.render("token", { message: msg });
};

const loginView = async (req, res) => {
  try {
    let message = req.session.message || null;
    req.session.notification = null;
    return res.render("account", { notification: message });
  } catch (error) {
    console.log("error:- ", error);
  }
};

const signupView = async (req, res, next) => {
  res.render("signup");
};

const signup = async (req, res) => {
  try {
    let userResult = await selectQuery(req.body);
    if (userResult.length !== 0) {
      req.session.message = "User Already exist!";
      return res.redirect("/");
    }
    req.body.role = "yoma";
    await insertQuery(req.body);
    let token = createToken(req.body);
    req.body.token = token;
    await updateQuery(req.body);

    req.session.message = "registration successfully!";
    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/dashboard");
  } catch (error) {
    return res.send({ Error: error, code: 500 });
  }
};

const userLogin = async (req, res) => {
  let { email, password } = req.body;
  let results = await selectQuery({ email });
  if (results.length > 0) {
    try {
      res.clearCookie("token", { httpOnly: true });
      res.clearCookie("email", { httpOnly: true });
      res.clearCookie("user_id", { httpOnly: true });
      res.clearCookie("role_name", { httpOnly: true });
      res.clearCookie("UserName", { httpOnly: true });
      let { email, password } = req.body;

      let results = await selectQuery({ email });

      if (results.length === 0) {
        return res.status(401).json({ message: "User does not exist!" });
      }

      const loginCount = results[0].login_count;

      const lastLoginTime = results[0].system_logged_time;
      const lastLoginTimeIST = new Date(lastLoginTime + " UTC");

      const currentTime = new Date();
      const timeDiffInMinutes = (currentTime - lastLoginTimeIST) / (1000 * 60);

      if (loginCount >= 25 && timeDiffInMinutes < 30) {
        const minutesLeft = Math.ceil(30 - timeDiffInMinutes);
        return res.status(401).json({
          message: `Your account is locked. Please try again in ${minutesLeft} minute(s).`,
          minutesLeft: minutesLeft,
        });
      } else if (loginCount >= 25 && timeDiffInMinutes >= 30) {
        loginCountContainer = 0;
        await setLoginCount(loginCountContainer, email);
      }

      let expiryPassword = await passwordCheck.checkPasswordExpiry(results[0]);

      if (expiryPassword.status) {
        return res.status(401).json({ message: `${expiryPassword.message}` });
      }

      let user = results[0];
      let territory = [];

      results?.forEach((element) => {
        territory.push(element?.territory);
      });

      if (password !== user.password) {
        loginCountContainer++;
        setLoginCount(loginCountContainer, email);
        return res.status(401).json({ message: "Password is wrong!" });
      }

      let token = await createToken({ email: user.email_id });
      // res.cookie("token", token, { httpOnly: true });
      res.cookie("email", user?.email_id, { httpOnly: true });
      // res.cookie("user_id", user?.id, { httpOnly: true });
      // res.cookie("role_name", user?.role, { httpOnly: true });
      // res.cookie("role_id", user?.role_id, { httpOnly: true });
      // res.cookie("UserName", user?.employee_name, { httpOnly: true });
      // res.cookie("territory", user?.territory, { httpOnly: true });

      loginCountContainer = 0;
      setLoginCount(loginCountContainer, email);

      return res
        .status(200)
        .json({ success: true, message: "Login Successful!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong!" });
    }
  } else {
    try {
      const cookiesToClear = ["t", "e", "u_d", "r_n", "u_n"];

      cookiesToClear.forEach((cookie) => {
        res.clearCookie(cookie);
      });
      let { email, password } = req.body;

      let results = await superAdmin.selectQuery({ email });

      if (!results || results.length === 0) {
        return res.status(401).json({ message: "User does not exist!" });
      }

      const loginCount = results.login_count;

      const lastLoginTime = results.system_logged_time;
      const lastLoginTimeIST = new Date(lastLoginTime + " UTC");

      const currentTime = new Date();
      const timeDiffInMinutes = (currentTime - lastLoginTimeIST) / (1000 * 60);

      if (loginCount >= 25 && timeDiffInMinutes < 30) {
        const minutesLeft = Math.ceil(30 - timeDiffInMinutes);
        return res.status(401).json({
          message: `Your account is locked. Please try again in ${minutesLeft} minute(s).`,
          minutesLeft: minutesLeft,
        });
      } else if (loginCount >= 25 && timeDiffInMinutes >= 30) {
        loginCountContainer = 0;
        await superAdmin.setLoginCount(loginCountContainer, results.email_id);
      }

      let expiryPassword = await passwordCheck.checkPasswordExpiry(results);

      if (expiryPassword.status) {
        return res.status(401).json({ message: `${expiryPassword.message}` });
      }

      let user = results;

      if (password !== user.password) {
        loginCountContainer++;
        let sac = await superAdmin.setLoginCount(
          loginCountContainer,
          user.email_id
        );

        return res.status(401).json({ message: "Password is wrong!" });
      }

      let token = await createToken({ email: user.email_id });
      res.cookie("token", token, { httpOnly: true });
      const encryptedEmail = encryptData(user.email_id);
      const encryptedId = encryptData(user.id);
      const encryptedRole = encryptData(user.role);
      const encryptedName = encryptData(user.employee_name);

      res.cookie("e", encryptedEmail, { httpOnly: true });
      res.cookie("u_d", encryptedId, { httpOnly: true });
      res.cookie("r_n", encryptedRole, { httpOnly: true });
      res.cookie("u_n", encryptedName, { httpOnly: true });

      return res
        .status(200)
        .json({
          success: true,
          message: "Login Successful!",
          isSuperAdmin: true,
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong!" });
    }
  }
};

const userLogout = async (req, res) => {
  let token = req.cookies.token;
  try {
    req.body.token = token;
    await updateQueryByToken(req.body);
    res.clearCookie("token", { httpOnly: true });
    res.clearCookie("email", { httpOnly: true });
    res.clearCookie("user_id", { httpOnly: true });
    res.clearCookie("role_name", { httpOnly: true });
    res.clearCookie("UserName", { httpOnly: true });
    req.session.message = "logout successfully!";
    return res.redirect("/");
  } catch (error) {
    return res.send({ Error: error, code: 500 });
  }
};

const forgotPasswordView = async (req, res) => {
  try {
    return res.render("forgot-password");
  } catch (error) {
    return res.render("account");
  }
};

const resetPassword = async (req, res) => {
  try {
    let user = await selectQuery(req.body);
    let adminUser = await superAdmin.selectQuery(req.body);

    if (user.length !== 0) {
      let tokenObj = {};
      tokenObj.id = user[0].id;
      tokenObj.CurrentDateTime = new Date();
      let token = await createToken(tokenObj);
      req.body.token = token;
      await updateQuery(req.body);
      await sendLinkOnMail(req.body.email, token);
      console.log("Mail sent successfully!");
      req.session.message = {
        type: "success",
        text: "Mail sent successfully!",
      };
      return res.redirect("/");
    } else if (adminUser) {
      let tokenObj = {};
      tokenObj.id = user.id;
      tokenObj.CurrentDateTime = new Date();
      let token = await createToken(tokenObj);
      req.body.token = token;
      await superAdmin.updateQuery(req.body);
      await sendLinkOnMail(req.body.email, token);
      console.log("Mail sent successfully!");
      req.session.message = {
        type: "success",
        text: "Mail sent successfully!",
      };
      return res.redirect("/");
    } else {
      req.session.message = { type: "error", text: "User does not exist!" };
      return res.redirect("/");
    }
  } catch (error) {
    console.error("Error:", error);
    req.session.message = { type: "error", text: "something went wrong" };
    return res.redirect("/");
  }
};

const resetPasswordView = async (req, res) => {
  const message = req.session.notification || null;

  req.session.notification = null;
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      console.log("Session destroyed successfully");
    }
  });
  res.render("reset-password", { notification: message });
};

const createPasswordView = async (req, res) => {
  try {
    const message = req.session.notification || null;
    return res.render("create_password", { notification: message });
  } catch (error) {
    console.log(error);
    return res.redirect("/account");
  }
};

const changePasswordView = async (req, res) => {
  try {
    let token = req.query.token;

    let data = await getEmailTokenDetails(req, res, token);

    let user = await selectQuery(data);

    if (user.token_status === 1) {
      req.session.message = "This Token is Already Used";
      return res.redirect("/account/token");
    }

    return res.render("forgot-password", {
      token,
      message: req.session.message,
      notification: req.session.message,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/account");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { token, new_password, confirm_password } = req.body;

    let data = await getEmailTokenDetails(req, res, token);

    if (!data) {
      req.session.message = "Token is not Correct";
      return res.redirect("/");
    }

    let user = await selectQueryById(data);

    let valid = passwordCheck.isPasswordComplex(new_password);

    if (!valid.isValid) {
      req.session.message = valid.message;
      return res.redirect(`/account/change-password?token=${token}`);
    }

    let passwords = await getPassworHistory(user[0].email_id);

    let resultpassword = await passwordCheck.storePassword(
      passwords,
      new_password
    );

    if (!resultpassword.status) {
      req.session.message = resultpassword.message;
      return res.redirect(`/account/change-password?token=${token}`);
    }

    if (new_password !== confirm_password) {
      return res.status(400).send("Passwords do not match");
    }

    let encryptedPassword = await bcrypt.hash(req.body.new_password, 10);
    req.body.password = encryptedPassword;
    await updatePasswordByToken(user[0].email_id, req.body.new_password);
    await password_history(new_password, user[0].email_id);

    req.session.message = "Password Changed SuccessFully";
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    req.session.message = { type: "error", text: "something went wrong" };
    return res.redirect("/");
  }
};

const createPassword = async (req, res) => {
  try {
    let user = await selectQuery(req.body);
    let adminUser = await superAdmin.selectQuery(req.body);

    if (user.length !== 0) {
      let tokenObj = {};
      tokenObj.id = user[0].id;
      tokenObj.CurrentDateTime = new Date();
      let token = await createToken(tokenObj);
      req.body.token = token;
      await updateQuery(req.body);
      await sendMailToCreate(req.body.email, token);
      req.session.message = {
        type: "success",
        text: "Mail sent successfully!",
      };
      return res.redirect("/");
    } else if (adminUser) {
      let tokenObj = {};
      tokenObj.id = user.id;
      tokenObj.CurrentDateTime = new Date();
      let token = await createToken(tokenObj);
      req.body.token = token;
      await superAdmin.updateQuery(req.body);
      await sendMailToCreate(req.body.email, token);
      console.log("Mail sent successfully!");
      req.session.message = {
        type: "success",
        text: "Mail sent successfully!",
      };
      return res.redirect("/");
    } else {
      req.session.message = { type: "error", text: "User does not exist!" };
      return res.redirect("/");
    }
  } catch (error) {
    console.error("Error:", error);
    req.session.message = { type: "error", text: "something went wrong" };
    return res.redirect("/");
  }
};

module.exports = {
  signup,
  userLogin,
  userLogout,
  loginView,
  signupView,
  forgotPasswordView,
  resetPassword,
  resetPasswordView,
  changePasswordView,
  updatePassword,
  tokenView,
  createPasswordView,
  createPassword,
};
