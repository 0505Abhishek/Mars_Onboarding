const nodemailer = require("nodemailer");

const SERVICE = process.env.SERVICE;
const USER_MAIL = process.env.USER_MAIL;
const PASSWORD = process.env.PASSWORD;
const HOST = process.env.HOST;

const sendDbActionEmail = async (
  toEmail,
  application_id,
  offboard_type,
  firm_name,
  distributor_name,
  token
) => {

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: USER_MAIL,
    pass: PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4, 
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

  let actionUrl = "";
  let buttonText = "";
  let emailBodyText = "";
  let subject = "";

  if (offboard_type === "resignation") {
    actionUrl = `${HOST}/newoffboardApprover/webpageView/${token}`;
    buttonText = "Submit Resignation Details";
    subject = `Action Required: Submit Your Resignation - ${firm_name}`;
    emailBodyText = `
      <p>Your distributor firm <strong>${firm_name}</strong> has initiated the <strong>RESIGNATION</strong> offboarding process.</p>
      <p>Please click the button below to provide your resignation details, select reason(s), average GSV, upload NOC, and confirm no objection for replacement distributor:</p>
    `;
  } else {
    actionUrl = `${HOST}/newoffboardApprover/dbOffboardAction/${token}`;
    buttonText = "Complete Action Now";
    subject = `Action Required: Acknowledge Termination - ${firm_name}`;
    emailBodyText = `
      <p>Your distributor firm <strong>${firm_name}</strong> is undergoing <strong>TERMINATION</strong> process.</p>
      <p>Please click the button below to complete the required action (upload NOC and confirm no objection for replacement DB):</p>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
      <h2 style="color: #333;">Dear ${distributor_name},</h2>
      
      ${emailBodyText}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
          ${buttonText}
        </a>
      </div>
      
      <p><small>This link will expire in 15 days.</small></p>
      <p>If you have any questions, please contact your ASM immediately.</p>
      
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Regards,<br>MARS Offboarding Team</p>
    </div>
  `;

  let mailOptions = {
    from: USER_MAIL,
    to: toEmail,
    subject: subject,
    html: html,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("DB Action Email Sent:", info.messageId);
    return "done";
  } catch (error) {
    console.error("Error sending DB action email:", error);
    return "error";
  }
};

module.exports = { sendDbActionEmail };
