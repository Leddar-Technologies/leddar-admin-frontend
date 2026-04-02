import { prisma } from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateVerificationToken,
} from "../../utils/token.js";
import { sendVerificationEmail } from "../../services/email.service.js";

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
      brand: {
        create: {
          businessName: data.businessName,
          productType: data.productType,
          whatsapp: data.whatsapp,
          contactInfo: data.contactInfo,
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

export const registerArtisan = async (data) => {
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
      status: "PENDING",
      artisan: {
        create: {
          fullName: data.fullName,
          phone: data.phone,
          whatsapp: data.whatsapp,
          specialty: data.specialty,
          yearsOfExperience: data.yearsOfExperience,
          bio: data.bio,
          city: data.city,
          state: data.state,
          portfolio: {
            create: data.portfolio.map((fileId) => ({
              fileId,
            })),
          },
        },
      },
    },
  });

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

export const login = async (data) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  if (!user.emailVerified) {
    throw new Error("Verify your email first");
  }

  if (user.status !== "APPROVED") {
    throw new Error("Await admin approval");
  }

  const token = generateAccessToken(user);

  return { token };
};
