import * as service from "./auth.service.js";

export const registerBrand = async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const result = await service.registerBrand(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

export const registerArtisan = async (req, res) => {
  try {
    // Pass both the text data and the files to the service
    const result = await service.registerArtisan(req.body, req.files);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

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

//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         error: "Email and password are required",
//       });
//     }

//     const result = await service.login(req.body);

//     res.json({
//       success: true,
//       data: result,
//     });
//   } catch (err) {
//     res.status(401).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// In your auth.controller.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation before hitting the service
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
    // Default to 401 Unauthorized for general login failures
    let statusCode = 401;

    // Handle the specific "Awaiting approval" case
    if (err.message === "Awaiting admin approval") {
      statusCode = 403; // Forbidden
    }

    // Handle the case where the account might be rejected
    else if (err.message.includes("rejected")) {
      statusCode = 403; // Forbidden
    }

    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await service.getMe(req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

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