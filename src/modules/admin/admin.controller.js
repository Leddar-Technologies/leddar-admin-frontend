import * as service from "./admin.service.js";

export const getPendingUsers = async (req, res) => {
  try {
    const users = await service.getPendingUsers();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const result = await service.approveUser(
      req.params.userId,
      req.user.userId,
    );
    res.json({ message: "User approved", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const result = await service.rejectUser(req.params.userId, req.user.userId);
    res.json({ message: "User rejected", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
