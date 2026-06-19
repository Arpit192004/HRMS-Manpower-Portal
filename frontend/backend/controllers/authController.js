const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  client: user.client,
  isActive: user.isActive
});

const registerCandidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      res.status(409);
      throw new Error("User already exists with this email");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Candidate"
    });

    await sendEmail({
      to: user.email,
      subject: "Welcome to HRMS Manpower Portal",
      text: `Hi ${user.name}, your candidate account has been created. You can now apply for jobs and track applications.`,
      html: `<p>Hi ${user.name},</p><p>Your candidate account has been created. You can now apply for jobs and track applications.</p>`
    });

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account is inactive");
    }

    res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    user: formatUserResponse(req.user)
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    if (!user) {
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been sent"
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your HRMS password",
      text: `Use this link to reset your HRMS password: ${resetUrl}. This link expires in 15 minutes.`,
      html: `<p>Use this link to reset your HRMS password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>`
    });

    res.json({
      success: true,
      message: "If this email exists, a reset link has been sent"
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error("New password is required");
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      res.status(400);
      throw new Error("Password reset link is invalid or expired");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCandidate,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
