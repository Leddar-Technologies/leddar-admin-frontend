import * as service from "./auth.service.js";

export const registerBrand = async (req, res) => {
  try {
    const result = await service.registerBrand(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const registerArtisan = async (req, res) => {
  try {
    const result = await service.registerArtisan(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const result = await service.verifyEmail(req.query.token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
