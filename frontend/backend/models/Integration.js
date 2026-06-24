const mongoose = require("mongoose");

const syncLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Success", "Warning", "Failed"],
      default: "Success"
    },
    message: String,
    recordsProcessed: {
      type: Number,
      default: 0
    },
    durationMs: {
      type: Number,
      default: 0
    },
    ranBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Payroll", "Accounting", "ATS", "Communication", "Background Verification", "Storage", "BI"],
      required: true
    },
    status: {
      type: String,
      enum: ["Connected", "Needs Attention", "Disconnected", "Draft"],
      default: "Draft"
    },
    environment: {
      type: String,
      enum: ["Production", "Sandbox"],
      default: "Production"
    },
    baseUrl: String,
    webhookUrl: String,
    authType: {
      type: String,
      enum: ["API Key", "OAuth", "Webhook Secret", "None"],
      default: "API Key"
    },
    maskedCredential: {
      type: String,
      default: "Configured"
    },
    syncDirection: {
      type: String,
      enum: ["Import", "Export", "Two-way"],
      default: "Two-way"
    },
    objects: [String],
    lastSyncAt: Date,
    nextSyncAt: Date,
    syncStatus: {
      type: String,
      enum: ["Healthy", "Delayed", "Failed", "Not Configured"],
      default: "Not Configured"
    },
    recordsSynced: {
      type: Number,
      default: 0
    },
    errorRate: {
      type: Number,
      default: 0
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    syncLogs: [syncLogSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Integration", integrationSchema);
