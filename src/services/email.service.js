import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

const transporter = nodemailer.createTransport(
  isDev
    ? {
        host: "localhost",
        port: 25,
        secure: false,
      }
    : {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
);

export const sendVerificationEmail = async (email, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Leddar" <no-reply@leddar.com>`,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>
      <p>Click below to verify:</p>
      <a href="${link}">${link}</a>
    `,
  });
};
