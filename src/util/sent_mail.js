require('dotenv').config();
const nodemailer = require('nodemailer');
// const { SERVICE, USER_MAIL, PASSWORD, HOST, PORT ,OTP_SECRET} = process.env;

const HOST= "http://localhost:4100";
const SERVICE="gmail";
const USER_MAIL="abhishek@crazibrainsolutions.com";
const PASSWORD="wbrt kdkt nbyi oczw";
const PORT=4100


const sendLinkOnMailToCE = async (dumpsheet, htmlContent, dataCe, currentDate, toEmail, ccEmail) => {

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    let attendanceTime;
    if (currentHour >= 15) {  
        attendanceTime = '04:00 PM';
    } else if (currentHour >= 10) {  
        attendanceTime = '11:00 AM';
    } else {
        attendanceTime = '11:00 AM'; 
    }

    let transporter = nodemailer.createTransport({
        service: SERVICE,
        auth: {
            user: USER_MAIL,
            pass: PASSWORD
        }
    });

    let mailOptions = {


        from: USER_MAIL,
        to: toEmail,
        cc: ccEmail,
        subject: `Selfie attendance status | ${currentDate}`,
        html: `
             <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Selfie Attendance Status</h2>
      <p>Hello,</p>
            <p>Please find attached today’s selfie attendance status as of <strong>${attendanceTime}</strong>.</p>
      <div style="margin-top: 20px; padding: 10px; border-radius: 4px;">
        ${dataCe ? `<p>${dataCe}</p>` : ""}
      </div>
      <div style="margin: 20px 0; padding: 10px;  border-radius: 4px;">
        ${htmlContent}
      </div>
      
      `,
        attachments: [
            {
              filename: 'Attendance Date.xlsx',
              content: dumpsheet,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
        }
    });
};



const sendLinkOnMailToSo = async (htmlContent,currentDate,email) => {

    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    let attendanceTime;
    if (currentHour >= 15) {  
        attendanceTime = '04:00 PM';
    } else if (currentHour >= 10) {  
        attendanceTime = '11:00 AM';
    } else {
        attendanceTime = '10:00 AM'; 
    }

    let transporter = nodemailer.createTransport({
        service: SERVICE,
        auth: {
            user: USER_MAIL,
            pass: PASSWORD
        }
    });

    let mailOptions = {
        from: USER_MAIL,
        to: email, 
        subject: `Selfie attendance status | ${currentDate}`,
        html: `
            <p>Hello,</p>
            <p>Please find attached today’s selfie attendance status as at <strong>${attendanceTime}</strong>.</p>
            ${htmlContent}
        `    };
        try {
            let info = await transporter.sendMail(mailOptions);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            let errorMessage = 'An unknown error occurred';
        
            if (error.responseCode) {
                switch (error.responseCode) {
                    case 421:
                        errorMessage = 'Temporary system problem. Retry later.';
                        break;
                    case 550:
                        errorMessage = 'Invalid recipient address.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred';
                }
            }
            return { success: false, error: errorMessage };
        }
};


const sentEmail = async (dumpsheet) => {
    
        let transporter = nodemailer.createTransport({
            service: SERVICE,
            auth: {
                user: USER_MAIL,
                pass: PASSWORD
            }
        });
    
        let mailOptions = {
    
    
            from: USER_MAIL,
            to: "abhisharma05052002@gmail.com", 
            subject: `Selfie attendance status`,
            attachments: [
                {
                  filename: 'Attendance Date.xlsx',
                  content: dumpsheet,
                  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
              ],
            };
    
            try {
                let info = await transporter.sendMail(mailOptions);

            } catch (error) {
                console.error('Error sending email:', error);
                if (error.responseCode) {
                    switch (error.responseCode) {
                        case 421:
                            console.error('Temporary system problem. Retry later.');
                            break;
                        case 550:
                            console.error('Invalid recipient address.');
                            break;
                        default:
                            console.error('An unknown error occurred.');
                    }
                }
            }
    };
    



    const sentMailToMe = async (success, fail, email) => { 
        const currentDate = new Date().toLocaleDateString();
        
        let transporter = nodemailer.createTransport({
            service: SERVICE,
            auth: {
                user: USER_MAIL,
                pass: PASSWORD
            }
        });

        let mailOptions = {
            from: USER_MAIL,
            to: email, 
            subject: `Selfie Attendance Status | ${currentDate}`,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Selfie Attendance Status</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f8f8f8;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background-color: #4CAF50;
                            color: white;
                            padding: 2px;
                            text-align: center;
                            border-top-left-radius: 8px;
                            border-top-right-radius: 8px;
                        }
                        .content {
                            padding: 20px;
                            text-align: left;
                        }
                        .footer {
                            padding: 15px;
                            text-align: center;
                            font-size: 12px;
                            color: #888888;
                            border-top: 1px solid #dddddd;
                        }
                        .status {
                            margin: 10px 0;
                        }
                        .success {
                            color: #4CAF50;
                        }
                        .fail {
                            color: #FF5733;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Success!</h1>
                        </div>
                        <div class="content">
                            <h2>Email Sending Status</h2>
                            <p>Dear Abhishek,</p>
                            <p>We are pleased to inform you that all emails have been processed.</p>
                            <div class="status">
                                <p class="success"><strong>Total Emails Sent:</strong> ${fail+success}</p>
                                <p class="success"><strong>Successfully Sent:</strong> ${success}</p>
                                <p class="fail"><strong>Failed to Send:</strong> ${fail}</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 Your Company. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
    
        try {
            let info = await transporter.sendMail(mailOptions);

        } catch (error) {
            console.error('Error sending email:', error);
        }
    };
    
module.exports = {sendLinkOnMailToCE,sendLinkOnMailToSo, sentEmail, sentMailToMe}
