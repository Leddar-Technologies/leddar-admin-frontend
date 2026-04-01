import { prisma } from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const registerBrand = async (data) => {
  const { email, password, businessName } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "BRAND",
      status: "PENDING", // 🔥 important
      brand: {
        create: {
          businessName,
        },
      },
    },
  });

  return {
    message: "Registration submitted. Await admin approval.",
  };
};

export const registerArtisan = async (data) => {
  const { email, password, fullName } = data;

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "ARTISAN",
      status: "PENDING",
      artisan: {
        create: {
          fullName,
        },
      },
    },
  });

  return {
    message: "Registration submitted. Await admin approval.",
  };
};
