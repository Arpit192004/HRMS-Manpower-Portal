const mongoose = require("mongoose");

const salaryComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Salary Slip",
        "Appointment Letter",
        "Aadhaar",
        "PAN",
        "Qualification",
        "Other"
      ],
      required: true
    },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      unique: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    joiningDate: {
      type: Date,
      required: true
    },
    earnings: [salaryComponentSchema],
    deductions: [salaryComponentSchema],
    totalEarnings: {
      type: Number,
      required: true
    },
    totalDeductions: {
      type: Number,
      required: true
    },
    netSalary: {
      type: Number,
      required: true
    },
    ctc: {
      type: Number,
      required: true
    },
    documents: [documentSchema],
    requiresInternalApproval: {
      type: Boolean,
      default: false
    },
    internalApprovalStatus: {
      type: String,
      enum: ["Not Required", "Pending", "Approved", "Rejected"],
      default: "Not Required"
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Sent",
        "Accepted",
        "Rejected"
      ],
      default: "Draft"
    },
    candidateRemarks: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);