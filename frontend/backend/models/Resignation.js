const mongoose = require("mongoose");

const resignationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    resignationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    requestedLastWorkingDate: {
      type: Date,
      required: true
    },
    approvedLastWorkingDate: {
      type: Date,
      default: null
    },
    noticePeriodDays: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    remarks: String,
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Withdrawn",
        "Completed"
      ],
      default: "Pending"
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    actionRemarks: String,
    actionAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resignation", resignationSchema);