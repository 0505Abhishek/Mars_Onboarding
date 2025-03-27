const bcrypt = require('bcryptjs');
const { createToken, getEmailTokenDetails, createResetToken } = require("../../util/jwt");
const { sendLinkOnMail } = require("../../util/send.mail");
const { insertQuery, selectQueryById, selectQuery, updateQuery, updateQueryByToken, updatePasswordByToken, password_history, getPassworHistory, updateTokenStatus} = require("../../models/account.model");
const passwordCheck = require("../../controllers/passwordCheck/passwordVerification.controller");


const tokenView = async(req, res)=>{
    let msg = req.session.message||"";

    req.session.message = null;

    res.render('token',{message:msg});
}

const loginView = async (req, res, next) => {
    let message = req.session.message || null;  
    req.session.message = null; 

    res.render('account', { notification: message });
};


const signupView = async (req, res, next) => {
    res.render('signup');
}

const signup = async (req, res) => {
    try {
        let userResult = await selectQuery(req.body);
        if (userResult.length !== 0) {
            req.session.message = 'User Already exist!';
            return res.redirect('/');
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
        let { email, password } = req.body; // Use req.body instead of req.query
        let results = await selectQuery({ email });

        if (results.length === 0) {
            return res.status(401).json({ message: "User does not exist!" });
        }

        let user = results[0]; // Get the first matching user
        if (password !== user.password) {
            return res.status(401).json({ message: "Password is wrong!" });
        }

        // Generate token and set cookies
        let token = await createToken({ email: user.email_id });
        res.cookie("token", token, { httpOnly: true });
        res.cookie("email", user.email_id, { httpOnly: true });
        res.cookie("user_id", user.id, { httpOnly: true });

        return res.status(200).json({ success: true, message: "Login Successful!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong!" });
    }
};




const userLogout = async (req, res) => {
    let token = req.cookies.token;
    try {
        req.body.token = token;
        await updateQueryByToken(req.body);
        res.clearCookie("token", { httpOnly: true })
        req.session.message = 'logout successfully!';
        return res.redirect('/');
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
            let token = await createToken(tokenObj);
            req.body.token = token;
            await updateQuery(req.body);
            await sendLinkOnMail(req.body.email, token);
            console.log("Mail sent successfully!");
            req.session.message = 'Mail sent successfully!';
            return res.redirect('/');
        } else {
            req.session.message = 'User does not exist!';
            return res.redirect('/');
        }
    } catch (error) {
        console.error("Error:", error);
        req.session.message = 'Something went wrong!';
        return res.redirect('/');
    }
}

const resetPasswordView = async (req, res) => {
    
    const message = req.session.message||[];

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            console.log('Session destroyed successfully');
        }
    });
    res.render('reset-password', { notification: message });
}




const changePasswordView = async (req, res) => {
    try {
        let token = req.query.token;

        let data = await getEmailTokenDetails(req,res,token);

        let user = await selectQuery(data);


        if(user.token_status === 1)
        {
            req.session.message = "This Token is Already Used";
            return res.redirect('/account/token'); 
        }

        return res.render('forgot-password',{token,message: req.session.message})
    } catch (error) {
        console.log(error);
        return res.redirect('/account')
    }
}

const updatePassword = async (req, res) => {
    try {

        const { token, new_password, confirm_password } = req.body;

        let data = await getEmailTokenDetails(req,res,token);
        
        if(!data)
        {
            req.session.message = 'Token is not Correct';
            return res.redirect('/');
        }


        let user = await selectQueryById(data);

        let valid = passwordCheck.isPasswordComplex(new_password);

        if(!valid.isValid)
        {
            req.session.message = valid.message;
            return res.redirect(`/account/change-password?token=${token}`);
        }

        // let passwords = await getPassworHistory(data);

        // let resultpassword = await passwordCheck.storePassword(passwords,new_password);

        // if(!resultpassword.status)
        // {
        //         req.session.message = resultpassword.message;
        //         return res.redirect(`/account/change-password?token=${token}`);
        // }

        if (new_password !== confirm_password) {
            return res.status(400).send("Passwords do not match");
        }


        let encryptedPassword = await bcrypt.hash(req.body.new_password, 10);
        req.body.password = encryptedPassword;
        await updatePasswordByToken(user[0].email_id, req.body.new_password);
        // await password_history(new_password,user.email_id);

        // await updateTokenStatus(token,1);

        req.session.message = "Password Changed SuccessFully";
        return res.redirect('/');
    }
    catch (error) {
        console.log(error);
        req.session.message = 'something went wrong';
        return res.redirect('/');
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
    resetPasswordView,
    changePasswordView,
    updatePassword,
    tokenView
}