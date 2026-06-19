const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["Info", "Lead", "Approval", "Hiring", "Payroll", "System"],
      default: "Info"
    },
    link: {
      type: String,
      default: "",
      trim: true
    },
    audienceRoles: [
      {
        type: String,
        enum: [
          "Super Admin",
          "HR Admin",
          "Client Approver",
          "Manager",
          "Employee",
          "Payroll Team",
          "Candidate"
        ]
      }
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    entityType: {
      type: String,
      default: "",
      trim: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
