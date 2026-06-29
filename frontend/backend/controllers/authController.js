const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const validatePassword = require("../utils/validatePassword");
const logSecurityEvent = require("../utils/securityLogger");

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  client: user.client,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  passwordChangedAt: user.passwordChangedAt
});

const registerCandidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
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
      role: "Candidate",
      emailVerified: false
    });

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Niyukti account",
      text: `Hi ${user.name}, verify your Niyukti account using this link: ${verificationUrl}. This link expires in 24 hours.`,
      html: `<p>Hi ${user.name},</p><p>Please verify your Niyukti account before signing in:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in 24 hours.</p>`
    });

    res.status(201).json({
      success: true,
      message: "Account created. Please verify your email before login."
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      res.status(400);
      throw new Error("Email verification link is invalid or expired");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "EMAIL_VERIFIED",
      status: "Success"
    });

    res.json({
      success: true,
      message: "Email verified successfully. You can login now."
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user || user.emailVerified) {
      return res.json({
        success: true,
        message: "If verification is required, a new link has been sent"
      });
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Niyukti account",
      text: `Verify your Niyukti account using this link: ${verificationUrl}. This link expires in 24 hours.`,
      html: `<p>Please verify your Niyukti account:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in 24 hours.</p>`
    });

    res.json({
      success: true,
      message: "If verification is required, a new link has been sent"
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
    }).select("+password +loginAttempts +lockUntil +tokenVersion");

    if (!user) {
      await logSecurityEvent(req, {
        email: email.toLowerCase(),
        event: "LOGIN_FAILED",
        status: "Failed",
        details: { reason: "User not found" }
      });
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (user.isLocked()) {
      await logSecurityEvent(req, {
        user: user._id,
        email: user.email,
        role: user.role,
        event: "ACCOUNT_LOCKED",
        status: "Warning",
        details: { lockUntil: user.lockUntil }
      });
      res.status(423);
      throw new Error("Account temporarily locked. Please try again after 15 minutes or reset your password");
    }

    if (!(await user.comparePassword(password))) {
      await user.registerFailedLogin();
      await logSecurityEvent(req, {
        user: user._id,
        email: user.email,
        role: user.role,
        event: user.loginAttempts >= 5 ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
        status: user.loginAttempts >= 5 ? "Warning" : "Failed",
        details: {
          reason: "Invalid password",
          loginAttempts: user.loginAttempts,
          lockUntil: user.lockUntil
        }
      });
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account is inactive");
    }

    if (user.emailVerified === false) {
      res.status(403);
      throw new Error("Please verify your email before login");
    }

    await user.registerSuccessfulLogin();
    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "LOGIN_SUCCESS",
      status: "Success"
    });

    res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
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

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Current password and new password are required");
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const user = await User.findById(req.user._id).select("+password +tokenVersion");

    if (!user || !(await user.comparePassword(currentPassword))) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    if (await user.comparePassword(newPassword)) {
      res.status(400);
      throw new Error("New password must be different from current password");
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "PASSWORD_CHANGED",
      status: "Success"
    });

    res.json({
      success: true,
      message: "Password changed successfully. Please login again"
    });
  } catch (error) {
    next(error);
  }
};

const logoutAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+tokenVersion");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateBeforeSave: false });

    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "LOGOUT_ALL_SESSIONS",
      status: "Success"
    });

    res.json({
      success: true,
      message: "All sessions have been logged out"
    });
  } catch (error) {
    next(error);
  }
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

    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "PASSWORD_RESET_REQUEST",
      status: "Success"
    });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Niyukti password",
      text: `Use this link to reset your Niyukti password: ${resetUrl}. This link expires in 15 minutes.`,
      html: `<p>Use this link to reset your Niyukti password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>`
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

    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select("+passwordResetToken +passwordResetExpires +password +tokenVersion");

    if (!user) {
      res.status(400);
      throw new Error("Password reset link is invalid or expired");
    }

    user.password = password;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await logSecurityEvent(req, {
      user: user._id,
      email: user.email,
      role: user.role,
      event: "PASSWORD_RESET_SUCCESS",
      status: "Success"
    });

    res.json({
      success: true,
      message: "Password reset successful",
      token: generateToken(user),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCandidate,
  verifyEmail,
  resendVerification,
  login,
  getCurrentUser,
  changePassword,
  logoutAllSessions,
  forgotPassword,
  resetPassword
};
