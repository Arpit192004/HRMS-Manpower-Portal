const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    role: String,
    event: {
      type: String,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "ACCOUNT_LOCKED",
        "PASSWORD_RESET_REQUEST",
        "PASSWORD_RESET_SUCCESS",
        "PASSWORD_CHANGED",
        "LOGOUT_ALL_SESSIONS"
      ],
      required: true
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "Warning"],
      required: true
    },
    ipAddress: String,
    userAgent: String,
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ user: 1, createdAt: -1 });
securityLogSchema.index({ email: 1, createdAt: -1 });
securityLogSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model("SecurityLog", securityLogSchema);
