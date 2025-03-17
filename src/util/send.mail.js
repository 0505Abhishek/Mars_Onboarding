const nodemailer = require("nodemailer")
const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const HOST = process.env.HOST;

// EMAIL_HOST = smtp-realpathSync.gmail.com
// EMAIL_POST = 25
// EMAIL_HOST_USER = britannia_b4u@britindia.com
// EMAIL_HOST_PASSWORD = Welcome@1234
// EMAIL_USE_TLS = True


const transporter = nodemailer.createTransport({
    service: SERVICE,
    auth: {
        user: USER_MAIL,
        pass: PASSWORD
    }
});

const sendLinkOnMail = async (Email, token) => {
    var mailOptions = {
        from: USER_MAIL,
        to: Email,
        subject: 'Reset Password',
        html: `<p>Click <a href='${HOST}/account/reset-password?token=${token}'>here</a> to reset your password</p>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info.response;
    } catch (error) {
        throw error;
    }
};



module.exports = { sendLinkOnMail }
