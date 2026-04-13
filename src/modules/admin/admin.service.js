import prisma from "../../config/prisma.js";

//////////////////////
// GET PENDING USERS
//////////////////////

export const getPendingUsers = async () => {
  return prisma.user.findMany({
    where: {
      status: "PENDING",
      emailVerified: true, // 🔥 only verified users
    },
    include: {
      brand: true,
      artisan: {
        include: {
          portfolio: true,
        },
      },
    },
  });
};

//////////////////////
// APPROVE USER
//////////////////////

export const approveUser = async (userId, adminId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { brand: true, artisan: true },
  });

  if (!user) throw new Error("User not found");

  const data = {
    status: "APPROVED",
  };

  if (user.brand) {
    data.brand = {
      update: {
        isActive: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    };
  }

  if (user.artisan) {
    data.artisan = {
      update: {
        isActive: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    };
  }

  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

//////////////////////
// REJECT USER
//////////////////////

export const rejectUser = async (userId, adminId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { brand: true, artisan: true },
  });

  if (!user) throw new Error("User not found");

  const updateData = { status: "REJECTED" };

  if (user.brand) {
    updateData.brand = {
      update: { rejectedAt: new Date(), approvedBy: adminId },
    };
  }

  if (user.artisan) {
    updateData.artisan = {
      update: { rejectedAt: new Date(), approvedBy: adminId },
    };
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
};