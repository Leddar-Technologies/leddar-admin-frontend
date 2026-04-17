import * as service from "./auth.service.js";

//////////////////////
// REGISTER BRAND
//////////////////////
export const registerBrand = async (req, res) => {
  try {
    // DEBUG: Log incoming request data to terminal
    console.log("--- DEBUG: Register Brand Attempt ---");
    console.log("Body received:", JSON.stringify(req.body, null, 2));

    const { email, password, businessName, acceptedTerms } = req.body;

    // Validation Check
    if (!email || !password || !businessName || acceptedTerms !== true) {
      console.warn("Validation failed: Missing fields or T&C not accepted");
      return res.status(400).json({
        success: false,
        error: !acceptedTerms
          ? "You must accept the terms and conditions"
          : "Missing required fields (email, password, or business name)",
      });
    }

    const result = await service.registerBrand(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("--- DEBUG: Register Brand ERROR ---");
    console.error("Message:", err.message);

    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//////////////////////
// REGISTER ARTISAN
//////////////////////
export const registerArtisan = async (req, res) => {
  try {
    console.log("--- DEBUG: Register Artisan Attempt ---");
    const { acceptedTerms } = req.body;

    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions",
      });
    }

    // Passes req.body (data) and req.files (portfolio images)
    const result = await service.registerArtisan(req.body, req.files);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("--- DEBUG: Register Artisan ERROR ---");
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//////////////////////
// LOGIN
//////////////////////
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const result = await service.login(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    let statusCode = 401; // Unauthorized

    // Handle specific status-based blocks
    if (
      err.message === "Awaiting admin approval" ||
      err.message.includes("rejected")
    ) {
      statusCode = 403; // Forbidden
    }

    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }
};

//////////////////////
// VERIFY EMAIL
//////////////////////
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    const result = await service.verifyEmail(token);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//////////////////////
// PASSWORD MANAGEMENT
//////////////////////
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }
    const result = await service.forgotPassword(email);
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Token and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Password must be at least 8 characters",
        });
    }

    const result = await service.resetPassword(token, password);
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

//////////////////////
// UTILS
//////////////////////
export const getMe = async (req, res) => {
  try {
    const result = await service.getMe(req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};
