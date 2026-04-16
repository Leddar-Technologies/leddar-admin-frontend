import bcrypt from "bcryptjs";
import crypto from "crypto";

import prisma from "../../config/prisma.js";
import {
  generateAccessToken,
  generateVerificationToken,
} from "../../utils/token.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../services/email.service.js";


//////////////////////
// REGISTER BRAND
//////////////////////

export const registerBrand = async (data) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      role: "BRAND",
      status: "PENDING",
      acceptedTermsAt: new Date(),
      brand: {
        create: {
          businessName: data.businessName,
          productType: data.productType,
          whatsapp: data.whatsapp,
          contactName: data.contactName,
          brandEstimatedQty: data.brandEstimatedQty,
        },
      },
    },
  });

  // Email verification
  const token = generateVerificationToken();

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  await sendVerificationEmail(user.email, token);

  return { message: "Check your email to verify account" };
};

//////////////////////
// REGISTER ARTISAN
//////////////////////

export const registerArtisan = async (data, files) => {
  if (!files || files.length < 3) {
    throw new Error("Please upload at least 3 portfolio images.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      role: "ARTISAN",
      acceptedTermsAt: new Date(),
      artisan: {
        create: {
          fullName: data.fullName,
          phone: data.phone,
          whatsapp: data.whatsapp,
          specialty: data.specialty, // Must be BAGS, WALLETS, etc.
          yearsOfExperience: parseInt(data.yearsOfExperience) || 0,
          bio: data.bio,
          city: data.city,
          state: data.state,
          portfolio: {
            create: files.map((file) => ({
              file: {
                create: {
                  url: `/uploads/${file.filename}`,
                  key: file.filename,
                  fileType: "IMAGE",
                  mimeType: file.mimetype,
                  size: file.size,
                },
              },
            })),
          },
        },
      },
    },
  });

  const token = generateVerificationToken();
  await prisma.verificationToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600000) },
  });

  await sendVerificationEmail(user.email, token, "ARTISAN");
  return { message: "Check your email to verify account" };
};

//////////////////////
// VERIFY EMAIL
//////////////////////

export const verifyEmail = async (token) => {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) throw new Error("Invalid token");

  if (record.expiresAt < new Date()) {
    throw new Error("Token expired");
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  return { message: "Email verified successfully" };
};

//////////////////////
// LOGIN
//////////////////////

export const login = async (credentials) => {
  const { email, password } = credentials;

  // 1. Fetch the user
  // We include the emailVerified field to ensure they've confirmed their mail too
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 2. Safeguard: Check if user exists
  // This prevents the "Cannot read properties of undefined" error
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // 5. Optional: Check Email Verification
  if (!user.emailVerified) {
    throw new Error("Please verify your email address");
  }

  // 4. Check Admin Approval Status
  // We only block BRAND and ARTISAN roles.
  // Admins usually don't need to approve themselves.
  if (user.role !== "ADMIN" && user.status === "PENDING") {
    throw new Error("Awaiting admin approval");
  }

  if (user.status === "REJECTED") {
    throw new Error("Your account has been rejected. Please contact support.");
  }

  // 3. Verify password first
  // (Standard practice: verify who they are before telling them their status)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }
  // 6. Generate Token (Assuming you have a helper for this)
  console.log("User role:", user.role);
  const token = generateAccessToken(user);

  // Return user data (excluding password) and token
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      brand: {
        select: {
          businessName: true,
          productType: true,
          whatsapp: true,
          contactName: true,
          isActive: true,
          approvedAt: true,
        },
      },
      artisan: {
        select: {
          fullName: true,
          phone: true,
          specialty: true,
          city: true,
          state: true,
          isActive: true,
          approvedAt: true,
          portfolio: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return user;
};

export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal if email exists or not — always return same message
  if (!user)
    return { message: "If that email exists, a reset link has been sent" };

  // Delete any existing reset token for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 
    },
  });

  await sendPasswordResetEmail(user.email, token, user.role);

  return { message: "If that email exists, a reset link has been sent" };
};

export const resetPassword = async (token, newPassword) => {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) throw new Error("Invalid or expired token");

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    throw new Error("Token expired");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashed },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return { message: "Password reset successfully" };
};