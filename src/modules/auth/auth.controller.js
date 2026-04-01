import * as authService from "./auth.service.js";

export const registerBrand = async (req, res) => {
  const result = await authService.registerBrand(req.body);
  res.json({ success: true, data: result });
};

export const registerArtisan = async (req, res) => {
  const result = await authService.registerArtisan(req.body);
  res.json({ success: true, data: result });
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
};
