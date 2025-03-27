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
    console.log(Email, "..........................", token);

    let transporter = nodemailer.createTransport({
        service: SERVICE,
        auth: {
            user: USER_MAIL,
            pass: PASSWORD
        }
    });

    let mailOptions = {
        from: USER_MAIL,
        to: Email,
        subject: 'Reset Password',
        html: `<p>Click <a href='${HOST}/account/change-password?token=${token}'>here</a> to reset your password</p>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return "done";
    } catch (error) {
        console.error('Error sending email:', error);
    }
};



module.exports = { sendLinkOnMail }
