const nodemailer = require("nodemailer");
require('dotenv').config();

const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const link = process.env.HOST;
const imageHostUrl = link + '/public/images/Mars__wrigley_blue.jpg';


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

/**
 * @param {string} email - Recipient email
 * @param {string} firm_name - Name of the firm
 * @param {string} emp_name - Employee name
 * @param {string} role - Role of the approver
 * @param {string} status - Status of approval (approved/correction/rejected)
 */
const sendEmail = async (obj, status) => {
  try {
    if (!obj.sendToEmail) {
      throw new Error("Recipient email is missing.");
    }
    
    const template = templates[status];


    if (!template) {
      throw new Error("Invalid email status.");
    }

    const subjectMap = {
      approved: `${obj.firmName}_Distributor Onboarding Lifecycle`,
      correction: `${obj.firmName}_Distributor Onboarding Lifecycle`,
      rejected: `${obj.firmName}_Distributor Onboarding Lifecycle`,
      Rsemapproval: `${obj.firmName}_Distributor Onboarding Lifecycle`,
      DocumentCorrectionSubmit:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      CorrectionDone:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      RsemCorrectionapproval:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      rsemCorrection:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      approveLeadApproved:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      documentapproval:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      docCorrection:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      documentapprovalToMis:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      DocumentCorrectionSubmit:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      CorrectionDone:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      approval:`${obj.firmName}_Distributor Onboarding Lifecycle`,
      Finalapproval: `${obj.firmName}_Distributor Onboarding Lifecycle`
    };

    const subject = subjectMap[status];
    const htmlContent = template(obj);

    await transporter.sendMail({
      from: `"DB Onboarding" <${USER_MAIL}>`,
      to: obj.sendToEmail,
      cc: obj?.sendCcEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully to ${obj.sendToEmail}`);
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
    <img src="${link}/public/images/Mars__wrigley_blue.jpg"  
      alt="Mars Wrigley Logo" 
      style="max-width: 200px; height: auto;" />
  </div>
`;

const templates = {
  Rsemapproval: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> has been raised by <strong>${obj.sendByName}</strong>.</p>
    <p>Please click the button below for more details:</p>
    ${actionButton(link, 'View Appointment Details')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  RsemCorrectionapproval: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending more information from your end.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'View Appointment Details')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  rsemCorrection: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending more information from your end.</p>
    <p>Please click the button below to complete the process:</p>
    ${actionButton(link, 'Complete Appointment Details', '#ffc107')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  approveLeadApproved: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is approved by <strong>${obj.sendByName}</strong>.</p>
    <p>Please click on the following link for more details:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  documentapproval: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>
      For the DB appointment for <strong>${obj.firmName}</strong>, 
      <strong>${obj.sendByName}</strong> has successfully reviewed the uploaded documents by <strong>${obj.AseName}</strong>.
    </p>
    <p>Please click the button below for more details:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  docCorrection: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending more information from your end.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'Complete Appointment Details', '#ffc107')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  documentapprovalToMis: (obj) => `
    <p>Dear ${obj.SendToRole} Team,</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending a document review.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  DocumentCorrectionSubmit: (obj) => `
    <p>Dear ${obj.SendToRole} Team,</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending a document review.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'View Appointment Details')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  approval: (obj) => `
    <p>Dear ${obj.SendToRole} Team,</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending action at your end.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  correction: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>The DB appointment for <strong>${obj.firmName}</strong> is pending corrections at your end.</p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'Complete Appointment Details', '#ffc107')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  rejected: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>
      The DB appointment for <strong>${obj.firmName}</strong> 
      has been <span style="color: #dc3545; font-weight: bold;">rejected</span> by <strong>${obj.sendByName}</strong>.
    </p>
    <p>Please click the button below for more details:</p>
    ${actionButton(link, 'View Rejection Details', '#dc3545')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  CorrectionDone: (obj) => `
    <p>Hello ${obj.sendToName},</p>
    <p>
      The DB appointment for <strong>${obj.firmName}</strong>
      is pending action at your end. 
    </p>
    <p>Please click on the following link to complete:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `,

  Finalapproval: (obj) => `
    <p>Dear ${obj.SendToRole} Team,</p>
    <p>
      The DB <strong>${obj.firmName}</strong>
      is successfully appointed. 
    </p>
    <p>Please click on the following link for details:</p>
    ${actionButton(link, 'View Appointment Details', '#28a745')}
    ${obj?.remark ? `<p><strong>Remark:</strong> ${obj.remark}</p>` : ''}
    <p>Regards,<br/>Onboarding Team</p>
    ${marsLogo}
  `
};



module.exports = { sendEmail };
