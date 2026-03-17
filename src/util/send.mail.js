const nodemailer = require("nodemailer")
const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const HOST = process.env.HOST;


const transporter = nodemailer.createTransport({
    service: SERVICE,
    auth: {
        user: USER_MAIL,
        pass: PASSWORD
    }
});

const sendLinkOnMail = async (Email, token, emailText) => {    
    
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: USER_MAIL,
    pass: PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
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

const sendMailToCreate = async (Email, token, emailText) => {    
    
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
        subject: 'Create Password',
        html: `<p>Click <a href='${HOST}/account/change-password?token=${token}'>here</a> to create your password</p>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return "done";
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendLinkOnMail,sendMailToCreate}
