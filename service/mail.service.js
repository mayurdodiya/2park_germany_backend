const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

function loadTemplate(filePath, data) {
  let template = fs.readFileSync(filePath, "utf-8");

  for (const key in data) {
    // This handles both ${mailObj.key} and ${mailObj?.key}
    const regex = new RegExp(`\\$\\{mailObj(?:\\?\\.)?${key}\\}`, "g");
    template = template.replace(regex, data[key] || "");
  }

  return template;
}

module.exports = {
  sendEmail: async ({ to, name, subject, otp }) => {
    // let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${to}`,
      subject: subject,
      text: "One Time Password",
      html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
                <title>First Page</title>
                <style>
                    body {
                        font-family: 'Mulish', sans-serif;
                        background-color: #f5f5f5;
                    }
                    * {
                        box-sizing: border-box;
                        font-family: 'Mulish', sans-serif;
                    }
                    p:last-child {
                        margin-top: 0;
                    }
                    img {
                        max-width: 100%;
                    }
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        margin-top: 0;
                    }
                    tbody {
                        padding: 20px;
                    }
                    .group:after {
                        content: "";
                        display: table;
                        clear: both;
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tbody>
                        <tr>
                            <td>
                                <table align="center" cellpadding="0" cellspacing="0" style="width:600px; border:1px solid #184f5e; border-radius:6px;">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div style="
                                                background: #fff;
                                                width: 600px;
                                                border: 1px solid #E0E0E0;
                                                border-radius: 12px;
                                                box-shadow:(0px 4px 20px rgba(0, 0, 0, 0.18));
                                                ">
                                                    <div style="padding: 40px;">
                                                        <h2 style="color: #282828;
                                                        font-size: 24px;
                                                        font-style: normal;
                                                        font-weight: 700;
                                                        margin: 0 0 20px 0;
                                                        text-align: center;
                                                        line-height: normal;">
                                                        Hallo Administrator
                                                        </h2>
                                                        <h2 style="color: #282828;
                                                        font-size: 24px;
                                                        font-style: normal;
                                                        font-weight: 700;
                                                        margin: 0 0 20px 0;
                                                        text-align: center;
                                                        line-height: normal;">
                                                        Sicherheitsstufe 1
                                                        </h2>
                                                        <p style="color: #000;
                                                        text-align: center;
                                                        font-size: 14px;
                                                        font-style: normal;
                                                        font-weight: 400;
                                                        margin: 0 0 20px 0;
                                                        line-height: 28px; ">
                                                        OTP TOKEN
                                                        </p>
                                                        <div align="center">
                                                            <h6 style="
                                                            padding: 20px 30px;
                                                            border: none;
                                                            cursor: pointer;
                                                            color: #ffffff;
                                                            text-align: center;
                                                            font-size: 24px;
                                                            font-style: normal;
                                                            border-radius: 8px;
                                                            background: #87CEFA;
                                                            font-weight: 700;
                                                            line-height: 28px;
                                                            ">
                                                                ${otp}
                                                            </h6>
                                                        </div>
                                                        <p style="color: #000;
                                                        text-align: center;
                                                        font-size: 14px;
                                                        font-style: normal;
                                                        font-weight: 400;
                                                        margin: 0 0 20px 0;
                                                        line-height: 28px; ">OTP Code ist 5min gültig 
                                                        </p>
                                                        <p style="margin: 22px 0 0 0;
                                                        color: #000;
                                                        text-align: center;
                                                        font-size: 14px;
                                                        font-style: normal;
                                                        font-weight: 400;
                                                        line-height: normal;
                                                        ">
                                                        Two park
                                                        </p>
                                                        
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return otp;
    } catch (error) {
      console.log("mail sending wrror", error);
      return new Error("mail not sent, plase try again later");
    }
  },

  leadEmail: async ({ to, name, subject, location, postalcode, benutzername, userId }) => {
    // let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      // to: `${to}`,
      to: process.env.EMAIL_USER,
      subject: subject,
      text: "One Time Password",
      html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>First Page</title>
                <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Mulish', sans-serif; background-color: #f5f5f5;">

                <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 20px;">
                    <tr>
                        <td>
                            <table align="center" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #184f5e; border-radius: 6px; background-color: #ffffff;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <div style="border: 1px solid #E0E0E0; border-radius: 12px; box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.18);">
                                            <div style="padding: 40px;">
                                                <h2 style="color: #282828; font-size: 28px; font-weight: 700; text-align: center; margin: 0 0 20px 0; line-height: 1.4;"><b></b>Hallo Administrator</h2>
                                                
                                                <h2 style="color: #282828; font-size: 20px; font-weight: 500; margin: 0 0 10px 0; line-height: 1.4;">
                                                    <b>Lead Name:</b> ${name}
                                                </h2>
                                                <h2 style="color: #282828; font-size: 20px; font-weight: 500; margin: 0 0 10px 0; line-height: 1.4;">
                                                    <b>Lead Location:</b> ${location}
                                                </h2>
                                                <h2 style="color: #282828; font-size: 20px; font-weight: 500; margin: 0 0 10px 0; line-height: 1.4;">
                                                    <b>Lead Postalcode:</b> ${postalcode}
                                                </h2>
                                                <h2 style="color: #282828; font-size: 20px; font-weight: 500; margin: 0 0 10px 0; line-height: 1.4;">
                                                    <b>Benutzer Name:</b> ${benutzername}
                                                </h2>
                                                <h2 style="color: #282828; font-size: 20px; font-weight: 500; margin: 0 0 20px 0; line-height: 1.4;">
                                                    <b>UserId:</b> ${userId}
                                                </h2>

                                                <p style="margin: 0; color: #000000; text-align: center; font-size: 14px; font-weight: 400; line-height: 1.4;">
                                                    WePro Deutschland GmbH
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
            `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.log("mail sending wrror", error);
      return new Error("mail not sent, plase try again later");
    }
  },

  sendQueryEmail: async ({ email, userName: name, query, subject }) => {
    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${email}`,
      subject: subject,
      html: `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
            </head>
            <style>
                body {
                    font-family: 'Ubuntu', sans-serif;
                    background-color: #f5f5f5;
                }
            
                * {
                    box-sizing: border-box;
                }
            
                p:last-child {
                    margin-top: 0;
                }
            
                img {
                    max-width: 100%;
                }
            </style>
            
            <body style="margin: 0; padding: 0;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="padding: 20px 0 30px 0;">
                            <table align="center" cellpadding="0" cellspacing="0" width="600" style=" border-collapse: collapse; border: 1px solid #ececec; background-color: #fff;">
                                <tr>
                                    <td align="center" style="position: relative;">
                                        <div
                                        class="company-logo-align"
                                        style=" padding: 2rem 2rem 1rem 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto;"
                                        align="center">
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="user-information" 
                                        style="padding: 25px; background-color: #021f4c;"
                                        >
                                        <p align="center" style="color: #fff; font-size: 30px; font-weight: 500; margin: 0 0 1rem 0;">Xxxxx</p>
                                        <h1 align="center" style="color: #fff; font-size: 35px; font-weight: 500; margin: 0 0 1rem 0;">Hi, ${name} </h1>
                                        </div>
                                      
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td style="padding: 3rem 2rem 1rem 2rem;">
                                      <h2 align="center" style="color: #585d6a; font-size: 30px; ">${subject}</h2>
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 2.50rem 0 2rem 0;">${query}</p>
                                    </td>
                                </tr>
                                                             <tr>
                                    <td style="padding: 2rem;">
                                      <p align="center" style="color: #585d6a; font-size: 14px; margin: 0;">
                                                     </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            
            </html>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.error(` MAIL SENDING ERROR: ${error}`);
      return new Error("mail not sent, plase try again later");
    }
  },

  forgetEmail: async ({ to, name, subject, link }) => {
    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${to}`,
      subject: subject,
      text: "One Time Password",
      html: `<!DOCTYPE html>
            <html lang="en"><head>
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <!-- <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600&display=swap" rel="stylesheet" /> -->
                <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">

                <title> first page </title>
            <style>
                body {
                    font-family: 'Mulish', sans-serif;
                    background-color: #f5f5f5;
                }
                * {
                    box-sizing: border-box;
                    font-family: 'Mulish', sans-serif;
                }
                p:last-child {
                    margin-top: 0;
                }

                img {
                    max-width: 100%;
                }
                h1,
                h2,
                h3,
                h4,
                h5,
                h6 {margin-top: 0;}
                tbody {padding: 20px;}
                .group:after {
                    content: "";
                    display: table;
                    clear: both;
                }
            </style></head>
            <body style="margin: 0; padding: 0;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tbody><tr>
                        <!-- style="padding: 20px 0 30px 0;" -->
                        <td>
                            <table align="center" cellpadding="0" cellspacing="0" style="width:600px; border:1px solid #184f5e; border-radius:6px;">
                                <tbody><tr>
                                    <td>
                                        <div style="
                                        background: #fff;
                                        width: 600px;
                                        border: 1px solid #E0E0E0;
                                        border-radius: 12px;
                                        box-shadow:(0px 4px 20px rgba(0, 0, 0, 0.18));
                                        ">
                                            <div style="padding: 40px;">
                                                <h2 style="color: #282828;
                                            font-size: 24px;
                                            font-style: normal;
                                            font-weight: 700;
                                            margin: 0 0 20px 0;
                                            text-align: center;
                                            line-height: normal;">Hi, ${name}
                                                </h2>
                                                <h2 style="color: #282828;
                                            font-size: 24px;
                                            font-style: normal;
                                            font-weight: 700;
                                            margin: 0 0 20px 0;
                                            text-align: center;
                                            line-height: normal;">Forgot Password
                                                </h2>
                                                <p style="color: #000;
                                                text-align: center;
                                                font-size: 14px;
                                                font-style: normal;
                                                margin: 0 0 12px 0;
                                                font-weight: 400;
                                                line-height: 28px; ">
                                                    It appears that you've requested a password reset for your Wepro account.
                                                    No worries,
                                                    we've got you covered!
                                                </p>
                                                <p style="color: #000;
                                                text-align: center;
                                                font-size: 14px;
                                                font-style: normal;
                                                font-weight: 400;
                                                margin: 0 0 20px 0;
                                                line-height: 28px; ">
                                                    Use this link to reset password
                                                </p>
                                                <div align="center">
                                                    <h6 style="
                                                    padding: 20px 30px;
                                                    border: none;
                                                    cursor: pointer;
                                                    color: #0E53A5;
                                                    text-align: center;
                                                    font-size: 24px;
                                                    font-style: normal;
                                                    border-radius: 8px;
                                                    background: #F3F9FF;
                                                    font-weight: 700;
                                                    line-height: 28px;
                                                    "><a style="color: #0000ff" href="${link}">here. </a>
                                                    </h6>
                                                </div>
                                                <p style="margin: 22px 0 0 0;
                                                color: #000;
                                                text-align: center;
                                                font-size: 14px;
                                                font-style: normal;
                                                font-weight: 400;
                                                line-height: normal;
                                                ">
                                                    This link will securely reset password using
                                                </p>
                                            </div>
                                    </div></td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
            </body></html>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      // return otp;
    } catch (error) {
      console.log("mail sending wrror", error);
      return new Error("mail not sent, plase try again later");
    }
  },

  duplicateentryEmail: async ({ to, subject, cardata }) => {
    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${to}`,
      subject: subject,
      text: "Duplicate entry detected",
      html: `<html>
<head>
    <meta charset="UTF-8">
    <title>Duplicate Entry Detected</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <tr>
            <td style="text-align: center;">
                <h2 style="color: #d9534f;">🚨 Duplicate Entry Detected 🚨</h2>
                <p style="font-size: 16px; color: #555;">We have detected a duplicate entry in our system. Please review the details below:</p>
            </td>
        </tr>
        <tr>
            <td>
                <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; margin: 20px 0; width: 100%;">
                    <tr style="background-color: #f8d7da; color: #721c24; font-weight: bold;">
                        <td>Plate Number</td>
                        <td>{${cardata.plateNumber}}</td>
                    </tr>
                    <tr>
                        <td>Device ID</td>
                        <td>{${cardata.deviceId}}</td>
                    </tr>
                    <tr>
                        <td>Snap Time</td>
                        <td>{${cardata.snapTime}}</td>
                    </tr>
                </table>
            </td>
        </tr>
       
    </table>
</body>
</html>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      // return otp;
    } catch (error) {
      console.log("mail sending wrror", error);
      return new Error("mail not sent, plase try again later");
    }
  },


  paymentConfirmationEmail: async (mailObj) => {
    const templatePath = path.join(__dirname, "../views/paymentConfirmation.html");
    const htmlContent = loadTemplate(templatePath, mailObj);
    var transporter = nodemailer.createTransport({
      host: process.env.PAYMENT_CONFIRMATION_EMAIL_HOST,
      port: process.env.PAYMENT_CONFIRMATION_EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.PAYMENT_CONFIRMATION_EMAIL_USER,
        pass: process.env.PAYMENT_CONFIRMATION_EMAIL_PASSWORD,
      },
    });
    console.log(mailObj?.pdfFileName, "--------------------------- mailObj?.pdfFileName");
    let mailOptions = {
      from: process.env.PAYMENT_CONFIRMATION_EMAIL_USER,
      to: `${mailObj?.receiverEmail}`,
      subject: mailObj?.subject,
      text: mailObj.text,
      html: htmlContent,
      attachments: [
        {
          filename: "2park_logo.png",
          path: `${process.env.DOMAIN_URL}/api/uploads/2park_logo.png`,
          cid: "logo", // Same cid value as in the img src
        },
        // {
        //   filename: "invoice.pdf", // You can rename it here
        //   path: path.join(__dirname, "..", mailObj?.pdfFileName), // Adjust path as per actual location
        //   contentType: "application/pdf",
        // },
        {
          filename: "invoice.pdf",
          content: mailObj?.pdfBuffer, // <-- pass the buffer here
          contentType: "application/pdf",
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      return "mail send successfully";
    } catch (error) {
      console.log("paymentConfirmationEmail sending error", error);
      return new Error("mail not sent, plase try again later");
    }
  },

  // common mail function
  commonEmail: async (mailObj) => {
    const templatePath = path.join(__dirname, "../views/paymentConfirmation.html");
    const htmlContent = loadTemplate(templatePath, mailObj);

    var transporter = nodemailer.createTransport({

      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });


    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${mailObj?.receiverEmail}`,
      subject: mailObj?.subject,
      text: mailObj.text,
      html: htmlContent,
      attachments: [
        {
          filename: "2park_logo.png",
          path: `${process.env.DOMAIN_URL}/api/uploads/2park_logo.png`,
          // path: `${process.env.DOMAIN_URL}/uploads/2park_logo.png`,
          cid: "logo", // Same cid value as in the img src
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);

      console.log("mail send successfully");
      return "mail send successfully";
    } catch (error) {
      console.log("commonEmail sending error", error);
      return new Error("mail not sent, plase try again later");
    }
  },

};

