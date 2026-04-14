import dotenv from "dotenv";
dotenv.config();

console.log({
  NODE_ENV: process.env.NODE_ENV,
  BRAND_CLIENT_URL: process.env.BRAND_CLIENT_URL,
  ARTISAN_CLIENT_URL: process.env.ARTISAN_CLIENT_URL,
  SMTP_HOST: process.env.SMTP_HOST,
});

import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

const transporter = nodemailer.createTransport(
  isDev
    ? {
        host: "localhost",
        port: 25,
        secure: false,
        ignoreTLS: true,
        auth: null,
      }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
);
//   const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

//   await transporter.sendMail({
//     from: `"Leddar" <no-reply@leddar.com>`,
//     to: email,
//     subject: "Verify your email",
//     html: `
//       <h2>Verify your email</h2>
//       <p>Click the link below to verify your Leddar account:</p>
//       <a href="${link}" style="
//         display: inline-block;
//         padding: 12px 24px;
//         background-color: #000;
//         color: #fff;
//         text-decoration: none;
//         border-radius: 6px;
//         font-weight: bold;
//       ">Verify Email</a>
//       <p>This link expires in <strong>1 hour</strong>.</p>
//       <p>If you didn't create a Leddar account, ignore this email.</p>
//     `,
//   });
// };

export const sendVerificationEmail = async (email, token, role = "BRAND") => {
  const configs = {
    BRAND: {
      from: `"Leddar for Brands" <no-reply@leddar.com>`,
      subject: "Verify your Brand account",
      link: `${process.env.BRAND_CLIENT_URL}/verify-email?token=${token}`,
      heading: "Welcome, Brand Partner!",
      body: "Click below to verify your Leddar brand account and get started.",
      footer: "If you didn't register a brand on Leddar, ignore this email.",
    },
    ARTISAN: {
      from: `"Leddar for Artisans" <no-reply@leddar.com>`,
      subject: "Verify your Artisan account",
      link: `${process.env.ARTISAN_CLIENT_URL}/verify-email?token=${token}`,
      heading: "Welcome, Artisan!",
      body: "Click below to verify your Leddar artisan account and showcase your craft.",
      footer:
        "If you didn't register as an artisan on Leddar, ignore this email.",
    },
  };

  // Extract the specific configuration based on the role
  // Defaulting to BRAND if the role is missing or unrecognized
  const selectedConfig = configs[role] ?? configs.BRAND;

  const { from, subject, link, heading, body, footer } = selectedConfig;

  await transporter.sendMail({
    from,
    to: email,
    subject,
    html: `
      <h2>${heading}</h2>
      <p>${body}</p>
      <a href="${link}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      ">Verify Email</a>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>${footer}</p>
    `,
  });
};

export const sendPasswordResetEmail = async (email, token, role = "BRAND") => {
  const configs = {
    BRAND: {
      from: `"Leddar for Brands" <no-reply@leddar.com>`,
      subject: "Reset your Brand password",
      link: `${process.env.BRAND_CLIENT_URL}/reset-password?token=${token}`,
      heading: "Reset your password",
      body: "Click below to reset your Leddar brand account password.",
      footer: "If you didn't request this, ignore this email.",
    },
    ARTISAN: {
      from: `"Leddar for Artisans" <no-reply@leddar.com>`,
      subject: "Reset your Artisan password",
      link: `${process.env.ARTISAN_CLIENT_URL}/reset-password?token=${token}`,
      heading: "Reset your password",
      body: "Click below to reset your Leddar artisan account password.",
      footer: "If you didn't request this, ignore this email.",
    },
    ADMIN: {
      from: `"Leddar Admin" <no-reply@leddar.com>`,
      subject: "Reset your Admin password",
      link: `${process.env.ADMIN_CLIENT_URL}/reset-password?token=${token}`,
      heading: "Reset your Admin password",
      body: "Click below to reset your Leddar admin account password.",
      footer: "If you didn't request this, ignore this email.",
    },
  };

  const { from, subject, link, heading, body, footer } = configs[role];

  await transporter.sendMail({
    from,
    to: email,
    subject,
    html: `
      <h2>${heading}</h2>
      <p>${body}</p>
      <a href="${link}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      ">Reset Password</a>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <p>${footer}</p>
    `,
  });
};