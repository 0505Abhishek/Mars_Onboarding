const bcrypt = require('bcryptjs');
const { createToken } = require("../../util/jwt");
const { sendLinkOnMail } = require("../../util/send.mail");
const { insertQuery, selectQuery, updateQuery, updateQueryByToken, updatePasswordByToken } = require("../../models/account.model");


const loginView = async (req, res, next) => {
    let message = {};
    res.render('account',message);
    // delete req.session.message;
    req.session.destroy();
}

const signupView = async (req, res, next) => {
    res.render('signup');
}

const signup = async (req, res) => {
    try {
        let userResult = await selectQuery(req.body);
        if (userResult.length !== 0) {
            req.session.message = 'User Already exist!';
            return res.redirect('/account');
        }
        req.body.role = 'yoma';
        await insertQuery(req.body);
        let token = createToken(req.body);
        req.body.token = token;
        await updateQuery(req.body);

        req.session.message = 'registration successfully!';
        res.cookie('token', token, { httpOnly: true });
        return res.redirect("/dashboard");
    }
    catch (error) {
        return res.send({ Error: error, code: 500 });
    }
}

const userLogin = async (req, res) => {

    try {
        let results = await selectQuery(req.query);
        if (results.length !== 0) {
            let loginSuccessful = false;

            for (const user of results) {

                if (req.query.password === user.password) {
                    loginSuccessful = true;
                    break;
                }
            }

            if (loginSuccessful) {
                let token = createToken({ email: results[0].email_id});
                res.cookie('token', token, { httpOnly: true });
                res.cookie('email', results[0].email_id, { httpOnly: true });
                res.cookie('user_id', results[0].id, { httpOnly: true });

                return res.redirect("/dashboard");
            } else {
                req.session.message = 'Password is wrong!';
                return res.redirect('/account');
            }
        } else {
            req.session.message = 'user not exist!';
            return res.redirect('/account');
        }
    }
    catch (error) {
        return res.redirect("/account");
    }
}

const userLogout = async (req, res) => {
    let token = req.cookies.token;
    try {
        req.body.token = token;
        await updateQueryByToken(req.body);
        res.clearCookie("token", { httpOnly: true })
        req.session.message = 'logout successfully!';
        return res.redirect('/account');
    }
    catch (error) {
        return res.send({ Error: error, code: 500 });
    }
}

const forgotPasswordView = async (req, res) => {
    try {
        return res.render('forgot-password')
    } catch (error) {
        return res.render('account')
    }
}

const resetPassword = async (req, res) => {
    try {
        let user = await selectQuery(req.body);
        if (user.length !== 0) {
            let tokenObj = {};
            tokenObj.id = user[0].id;
            tokenObj.CurrentDateTime = new Date();
            let token = createToken(tokenObj);
            req.body.token = token;
            await updateQuery(req.body);
            await sendLinkOnMail(req.body.email, token);
            req.session.message = 'Mail sent successfully!';
            return res.redirect('/account');
        } else {
            req.session.message = 'User does not exist!';
            return res.redirect('/account');
        }
    } catch (error) {
        console.error("Error:", error);
        req.session.message = 'Something went wrong!';
        return res.redirect('/account');
    }
}

const updatePasswordView = async (req, res) => {
    res.cookie('token', req.query.token, { httpOnly: true });
    res.render('reset-password');
}

const updatePassword = async (req, res) => {
    try {
        if (req.body.password !== req.body.confirmPassword) {
            req.session.message = 'password are not same!';
            return res.redirect('/account');
        }

        let encryptedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.token = req.cookies.token
        req.body.password = encryptedPassword;
        await updatePasswordByToken(req.body);
        return res.redirect('/account');
    }
    catch (error) {
        req.session.message = 'something went wrong';
        return res.redirect('/account');
    }
}


module.exports = {
    signup,
    userLogin,
    userLogout,
    loginView,
    signupView,
    forgotPasswordView,
    resetPassword,
    updatePasswordView,
    updatePassword
}