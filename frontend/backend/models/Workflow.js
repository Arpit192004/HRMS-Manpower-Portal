const mongoose = require("mongoose");

const workflowStepSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Skipped"],
      default: "Pending"
    },
    remarks: String,
    actionAt: Date
  },
  { _id: true }
);

const workflowSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    requestType: {
      type: String,
      enum: ["Leave", "Tour", "Expense", "Offer", "Resignation", "Other"],
      required: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "requestModel"
    },
    requestModel: {
      type: String,
      enum: [
        "LeaveRequest",
        "TourRequest",
        "ExpenseClaim",
        "Offer",
        "Resignation"
      ],
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    steps: {
      type: [workflowStepSchema],
      validate: {
        validator: (steps) => steps.length > 0,
        message: "At least one approval step is required"
      }
    },
    currentStep: {
      type: Number,
      default: 1
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    slaHours: {
      type: Number,
      default: 24
    },
    dueAt: {
      type: Date,
      default: null
    },
    escalatedAt: Date,
    escalationLevel: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

workflowSchema.index(
  { requestModel: 1, requestId: 1 },
  { unique: true }
);
workflowSchema.index({ status: 1, dueAt: 1 });
workflowSchema.index({ "steps.approver": 1, status: 1 });

module.exports = mongoose.model("Workflow", workflowSchema);
