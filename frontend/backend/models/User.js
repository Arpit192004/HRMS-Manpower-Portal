const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const roles = [
  "Super Admin",
  "HR Admin",
  "Client Approver",
  "Manager",
  "Employee",
  "Payroll Team",
  "Candidate"
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: roles,
      default: "Candidate"
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false
    },
    lastLoginAt: Date,
    lastFailedLoginAt: {
      type: Date,
      select: false
    },
    passwordChangedAt: Date,
    tokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.registerFailedLogin = async function () {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  this.lastFailedLoginAt = new Date();

  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.registerSuccessfulLogin = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
