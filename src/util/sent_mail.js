const nodemailer = require("nodemailer");
require('dotenv').config();

const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
  service: SERVICE,
  auth: {
    user: USER_MAIL,
    pass: PASSWORD
  },
});

/**
 * Send an email notification based on approval status
 * @param {string} email - Recipient email
 * @param {string} firm_name - Name of the firm
 * @param {string} emp_name - Employee name
 * @param {string} role - Role of the approver
 * @param {string} status - Status of approval (approved/correction/rejected)
 */
const sendEmail = async (email, firm_name, emp_name, role, status) => {
  try {
    if (!email) {
      throw new Error("Recipient email is missing.");
    }
    
    const template = templates[status];

    if (!template) {
      throw new Error("Invalid email status.");
    }

    const subjectMap = {
      approved: "Approval Notification",
      correction: "Correction Required",
      rejected: "Rejection Notification"
    };

    const subject = subjectMap[status];
    const htmlContent = template(firm_name, emp_name, role);

    await transporter.sendMail({
      from: `"Onboarding System" <${USER_MAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully to ${email} [${status}]`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

const templates = {
  approval: (firm_name, emp_name, role) => `
    <h3>Dear ${emp_name},</h3>
    <p>The request for <b>${firm_name}</b> has been <b>approved</b>.</p>
    <p>Next steps will be communicated shortly.</p>
  `,
  correction: (firm_name, emp_name, role) => `
    <h3>Dear ${emp_name},</h3>
    <p>Some corrections are required for application: <b>${firm_name}</b>.</p>
    <p>Please review and update the necessary details.</p>
  `,
  rejection: (firm_name, emp_name, role) => `
    <h3>Dear ${emp_name},</h3>
    <p>The request for <b>${firm_name}</b> has been <b>rejected</b>.</p>
    <p>Reviewed by: <b>${emp_name}</b> (${role})</p>
  `,
  Rsemapproval: (firm_name, emp_name, role) => `
    <h3>Dear ${emp_name},</h3>
    <p>Application has submit need your approval For <b>${firm_name}</b>.</p>
  `,
};

module.exports = { sendEmail };
