const mongoose = require("mongoose");

const clientRequirementSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    vacancies: {
      type: Number,
      required: true,
      min: 1
    },
    requiredBy: {
      type: Date,
      required: true
    },
    budgetMin: {
      type: Number,
      default: 0
    },
    budgetMax: {
      type: Number,
      default: 0
    },
    experienceMin: {
      type: Number,
      default: 0
    },
    experienceMax: {
      type: Number,
      default: 0
    },
    skills: [String],
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Requested", "Approved", "Converted", "Rejected", "Closed"],
      default: "Requested"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium"
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    processedAt: Date,
    remarks: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClientRequirement", clientRequirementSchema);
