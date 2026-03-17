const nodemailer = require("nodemailer");
require('dotenv').config();

const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const link = process.env.HOST;
const imageHostUrl = link + 'public/images/Mars__wrigley_blue.jpg';
 

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
      DISTRIBUTOR: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      APPROVED: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      REJECTED: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      APPROVAL: `Action Required: Termination/Resignation Request Pending at Your End – ${obj?.firmName}`,
      SENDTOTHREE: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      DECLINE: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      DISTRIBUTOR2: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      DISTRIBUTORsnf: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      RETURNED: `${obj?.firmName}_Distributor Offboarding Lifecycle`,
      ASM_INFO: `Notification: Action Taken on Offboarding Request – ${obj?.firmName}`,
      DBASM_INFO: `Notification: Action Taken on Offboarding Request – ${obj?.firmName}`,
      FNFACTION_PENDING : `Action Required: Regular F&F Request Pending at Your End – ${obj?.firmName}`,
      LAST_APPROVED: `Notification: Action Taken on Offboarding Request – ${obj?.firmName}`,
      DBAPPROVAL: `Notification: Action Taken on Offboarding Request – ${obj?.firmName}`,
    };

    const subject = subjectMap[status];
    const htmlContent = template(obj);

    await transporter.sendMail({
      from: `"DB Offboarding" <${USER_MAIL}>`,
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
    <img src="${link}/public/images/Mars__wrigley_blue.jpg"  
      alt="Mars Wrigley Logo" 
      style="max-width: 200px; height: auto;" />
  </div>
`;

const templates = {
  SUBMIT_WEBPAGE: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Distributor Has submitted the application ${obj?.firmName}</p>
    <p>Please check and give your approval:</p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
  DISTRIBUTOR: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Your Offboarding process has been start please fill the required details.</p>
    <p>Please click the button below to fill the details:</p>
    ${actionButton(`${link}/webpage/${obj?.token}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,

 LAST_APPROVED: (obj) => `
<p>Hi ${obj?.asmName} / Associate,</p>

<p>This is to notify you that the below Termination / Resignation / Regular F&F request has been <strong>fully approved</strong>.</p>
<p><em>*This is an auto-generated email for your information.</em></p>

<ul>
  <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
  <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
  <li><strong>Created By:</strong> ${obj?.employee_name}</li>
  <li><strong>Start Date:</strong> ${obj?.start_date}</li>
  <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
  <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
  <li><strong>Status:</strong> Final Approval Completed</li>
  <li><strong>Action Link:</strong> <a href="${link}">${link}</a></li>
</ul>

<p>The offboarding process has now been completed successfully in the system.</p>

<p>Regards,<br/>System Notification</p>

${marsLogo}
`,

  ASM_INFO: (obj) => `
    <p>Hi ${obj?.asm_name} / Associate,</p>

    <p>This is to notify you that an action has been taken on the below  Termination/ Resignation / Regular F&F request.</p>
    <p><em>*This is an auto-generated email for your information.</em></p>

    <ul>
      <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
      <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
      <li><strong>Created By:</strong>${obj?.asm_name}</li>
      <li><strong>Start Date:</strong> ${obj?.start_date}</li>
      <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
      <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
      <li><strong>Current Action Pending At:</strong> ${obj?.current_action_pending}</li>
      <li><strong>Action Link:</strong> <a href="${link}">${link}</a></li>
    </ul>

    <p>Please track the status in the system for further updates.</p>
    <p>Regards,<br/>System Notification</p>

    ${marsLogo}
    `,
    DBASM_INFO: (obj) => `
    <p>Hi ${obj?.asm_name} / Associate,</p>

    <p>This is to notify you that an action has been taken on the below  Termination/ Resignation / Regular F&F request.</p>
    <p><em>*This is an auto-generated email for your information.</em></p>

    <ul>
      <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
      <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
      <li><strong>Created By:</strong>${obj?.asm_name}</li>
      <li><strong>Start Date:</strong> ${obj?.start_date}</li>
      <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
      <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
      <li><strong>Current Action Pending At:</strong> ${obj?.current_action_pending}</li>
      <li><strong>Action Link:</strong> <a href="${link}">${link}</a></li>
    </ul>

    <p>Please track the status in the system for further updates.</p>
    <p>Regards,<br/>System Notification</p>

${marsLogo}
`,
  APPROVED: (obj) => `
        <p>Hi ${obj?.sendToName} / Associate,</p>

        <p>
        This is to notify you that the below Resignation/Termination request is currently 
        pending at your end for further action.
        </p>

        <p><strong>Request Details:</strong></p>

        <ul>
          <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
          <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
          <li><strong>Created By:</strong> ASM</li>
          <li><strong>Start Date:</strong> ${obj?.start_date}</li>
          <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
          <li><strong>Current Action Pending At:</strong> ${obj?.current_action_pending || 'Pending'}</li>
          <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
          <li><strong>Action Link:</strong> 
              <a href="${link}">${link}</a>
          </li>
        </ul>

        <p>
        Request you to take necessary action at the earliest to ensure timely process completion.
        </p>

        <p>
        Regards,<br/>
        MARS
      </p>

    ${marsLogo}
    `,
  REJECTED: (obj) => `
    <p>Dear ${obj?.asmName},</p>
    <p>The Application of ${obj?.firmName} has been rejected by ${obj?.userName}.</p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,

        FNFACTION_PENDING :(obj) => `
            <p>Hi ${obj?.sendToName} / Associate,</p>

            <p>This is to inform you that the below Regular F&F request is currently pending at your end for necessary action.</p>

            <p><strong>Request Details:</strong></p>
            <ul>
              <li><strong>Unique Application Code:</strong> ${obj?.application_id}</li>
              <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
              <li><strong>Created By:</strong> ASM</li>
              <li><strong>Start Date:</strong> ${obj?.start_date || 'N/A'}</li>
              <li><strong>Last Action By:</strong> ${obj?.last_action_by || 'N/A'}</li>
              <li><strong>Last Action Date:</strong> ${obj?.last_action_date || 'N/A'}</li>
              <li><strong>Current Action Pending At:</strong> ${obj?.current_action_pending || 'Pending'}</li>
              <li><strong>Action Link:</strong> <a href="${link}">${link}</a></li>
            </ul>

            <p>Request you to take necessary action at the earliest to ensure timely process completion.</p>
            <p>Regards,<br/>System Notification</p>

            ${marsLogo}
            `,

      APPROVAL: (obj) => `
        <p>Hi ${obj?.sendToName} / Associate,</p>

        <p>
        This is to notify you that the below Resignation/Termination request is currently 
        pending at your end for further action.
        </p>

        <p><strong>Request Details:</strong></p>

        <ul>
          <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
          <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
          <li><strong>Created By:</strong> ASM</li>
          <li><strong>Start Date:</strong> ${obj?.start_date}</li>
          <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
          <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
          <li><strong>Action Link:</strong> 
              <a href="${link}">${link}</a>
          </li>
        </ul>

        <p>
        Request you to take necessary action at the earliest to ensure timely process completion.
        </p>

        <p>
        Regards,<br/>
        MARS
      </p>

    ${marsLogo}
    `,


    APPROVAL: (obj) => `
        <p>Hi ${obj?.sendToName} / Associate,</p>

        <p>
        This is to notify you that the below Resignation/Termination request is currently 
        pending at your end for further action.
        </p>

        <p><strong>Request Details:</strong></p>

        <ul>
          <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
          <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
          <li><strong>Created By:</strong> ASM</li>
          <li><strong>Start Date:</strong> ${obj?.start_date}</li>
          <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
          <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
          <li><strong>Action Link:</strong> 
              <a href="${link}">${link}</a>
          </li>
        </ul>

        <p>
        Request you to take necessary action at the earliest to ensure timely process completion.
        </p>

        <p>
        Regards,<br/>
        MARS
      </p>

    ${marsLogo}
    `,


     DBAPPROVAL: (obj) => `
        <p>Hi ${obj?.sendToName} / Associate,</p>

        <p>
        This is to notify you that the below Resignation/Termination request is currently 
        pending at your end for further action.
        </p>

        <p><strong>Request Details:</strong></p>

        <ul>
          <li><strong>Unique Application Code:</strong> ${obj?.mars_code}</li>
          <li><strong>Firm Name:</strong> ${obj?.firmName}</li>
          <li><strong>Created By:</strong> ${obj?.employee_name}</li>
          <li><strong>Start Date:</strong> ${obj?.start_date}</li>
          <li><strong>Last Action By:</strong> ${obj?.last_action_by}</li>
          <li><strong>Current Action Pending At:</strong> ${obj?.current_action_pending || 'Pending'}</li>
          <li><strong>Last Action Date:</strong> ${obj?.last_action_date}</li>
          <li><strong>Action Link:</strong> 
              <a href="${link}">${link}</a>
          </li>
        </ul>

        <p>
        Request you to take necessary action at the earliest to ensure timely process completion.
        </p>

        <p>
        Regards,<br/>
        MARS
      </p>

    ${marsLogo}
    `,

  SENDTOTHREE: (obj) => `
    <p>Dear Team,</p>
    <p> Submit your approval for application: <strong>${obj?.firmName} </strong></p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
  SENDTOTRETURN: (obj) => `
    <p>Dear Team,</p>
    <p> Submit your approval for application: <strong>${obj?.firmName} </strong></p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
  DISTRIBUTOR2: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Your Offboarding process has been start please fill the required details.</p>
    <p>Please click the button below to fill the details:</p>
    ${actionButton(`${link}/webpage/${obj?.sendlink}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,

  DISTRIBUTORsnf: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Your Offboarding process has been start please fill the required details.</p>
    <p>Please click the button below to fill the details:</p>
    ${actionButton(`${link}${obj?.sendlink}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
  DECLINE: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Application: <strong>${obj?.firmName} </strong> has been submmited.</p>
    <p>Need your approval</p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,

    RETURNED: (obj) => `
    <p>Dear ${obj?.sendToName},</p>
    <p>Distributor has returned the application: <strong>${obj?.firmName}</strong>.</p>
    <p>Need your approval.</p>
    ${actionButton(`${link}`, "View Appointment Details")}
    <p>Regards,<br/>Offboarding Team</p>
    ${marsLogo}
  `,
};


module.exports = { sentEmailForOffboarding };
