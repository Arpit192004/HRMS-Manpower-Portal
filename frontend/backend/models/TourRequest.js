const mongoose = require("mongoose");

const tourRequestSchema = new mongoose.Schema(
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
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    fromLocation: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    travelMode: {
      type: String,
      enum: ["Flight", "Train", "Bus", "Cab", "Own Vehicle", "Other"],
      required: true
    },
    estimatedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    advanceRequired: {
      type: Boolean,
      default: false
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Completed"],
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

module.exports = mongoose.model("TourRequest", tourRequestSchema);