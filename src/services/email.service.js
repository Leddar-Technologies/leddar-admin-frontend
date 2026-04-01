// // src/services/email.service.js
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// const ses = new SESClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// /**
//  * Send generic email via AWS SES
//  */
// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const command = new SendEmailCommand({
//       Source: process.env.EMAIL_FROM, // must be verified in SES
//       Destination: {
//         ToAddresses: [to],
//       },
//       Message: {
//         Subject: {
//           Data: subject,
//         },
//         Body: {
//           Html: {
//             Data: html,
//           },
//         },
//       },
//     });

//     const response = await ses.send(command);
//     return response;
//   } catch (error) {
//     console.error("SES Email Error:", error);
//     throw new Error("Failed to send email");
//   }
// };

// export const sendVerificationEmail = async (email, token) => {
//   const verifyUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email?token=${token}`;

//   return sendEmail({
//     to: email,
//     subject: "Verify your email",
//     html: `
//       <h2>Welcome to Leddar 👋</h2>
//       <p>Please verify your email to continue:</p>
//       <a href="${verifyUrl}" style="padding:10px 15px;background:#000;color:#fff;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link expires in 1 hour.</p>
//     `,
//   });
// };

// src/services/email.service.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 2525, // smtp4dev default
  secure: false,
});

/**
 * Send generic email (local dev)
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@leddar.local",
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
};

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Welcome to Leddar 👋</h2>
      <p>Click below to verify your email:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
};