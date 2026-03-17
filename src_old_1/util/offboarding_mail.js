const nodemailer = require("nodemailer");
require('dotenv').config();

const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const link = process.env.HOST;
const imageHostUrl = link + 'public/images/Mars__wrigley_blue.jpg';

const transporter = nodemailer.createTransport({
  service: SERVICE,
  auth: {
    user: USER_MAIL,
    pass: PASSWORD
  },
});


const sentEmailForOffboarding = async (obj, status) => {
  try {

    if (!obj?.sendToEmail) {
      throw new Error("Recipient email is missing.");
    }
    
    const template = templates[status];


    if (!template) {
      throw new Error("Invalid email status.");
    }

    const subjectMap = {
      DISTRIBUTOR: `${obj?.firmName}_Distributor Onboarding Lifecycle`,
      APPROVED: `${obj?.firmName}_Distributor Onboarding Lifecycle`,
      REJECTED: `${obj?.firmName}_Distributor Onboarding Lifecycle`,
      APPROVAL: `${obj?.firmName}_Distributor Onboarding Lifecycle`,
      SENDTOTHREE: `${obj?.firmName}_Distributor Onboarding Lifecycle`,
    };

    const subject = subjectMap[status];
    const htmlContent = template(obj);

    await transporter.sendMail({
      from: `"DB Onboarding" <${USER_MAIL}>`,
      to: obj?.sendToEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully to ${obj?.sendToEmail}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};




const actionButton = (url, text, bgColor = '#007BFF') => `
  <p style="text-align: center;">
    <a href="${url}" target="_blank"
      style="
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        color: #ffffff;
        background-color: ${bgColor};
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      ">
      ${text}
    </a>
  </p>
`;

const marsLogo = `
  <div>
    <img src="${link/imageHostUrl}"  
      alt="Mars Wrigley Logo" 
      style="max-width: 200px; height: auto;" />
  </div>
`;

const templates = {

    SUBMIT_WEBPAGE: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Distributor Has submitted the application ${obj?.firmName}</p>
    <p>Please check and give your approval:</p>
    ${actionButton(`${link}`, 'View Appointment Details')}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
    DISTRIBUTOR: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Your Offboarding process has been start please fill the required details.</p>
    <p>Please click the button below to fill the details:</p>
    ${actionButton(`${link}/webpage/${obj?.token}`, 'View Appointment Details')}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,
   APPROVED: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>${obj?.userName} has been approved the application: ${obj?.firmName}.</p>
    <p>Need your approval</p>
    ${actionButton(`${link}`, 'View Appointment Details')}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,
    REJECTED: (obj) => `
    <p>Dear ${obj?.asmName},</p>
    <p>The Application of ${obj?.firmName} has been rejected by ${obj?.userName}.</p>
    ${actionButton(`${link}`, 'View Appointment Details')}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,
  APPROVAL: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Application: <strong>${obj?.firmName} </strong> has been submmited.</p>
    <p>Need your approval</p>
    ${actionButton(`${link}`, 'View Appointment Details')}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,
  SENDTOTHREE: (obj) => `
    <p>Dear Team,</p>
    <p> Submit your approval for application: <strong>${obj?.firmName} </strong></p>
    ${actionButton(`${link}`, 'View Appointment Details')}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,
};


module.exports = { sentEmailForOffboarding };
