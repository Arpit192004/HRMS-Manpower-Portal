const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    phone: { type: String, required: true },
    currentCompany: String,
    currentDesignation: String,
    totalExperience: { type: Number, default: 0 },
    currentSalary: { type: Number, default: 0 },
    expectedSalary: { type: Number, default: 0 },
    noticePeriod: String,
    skills: [String],
    resumeUrl: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Interview",
        "Pre-Offer",
        "Offered",
        "Joined"
      ],
      default: "Applied"
    },
    shortlistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    shortlistedAt: Date
  },
  { timestamps: true }
);

candidateSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Candidate", candidateSchema);