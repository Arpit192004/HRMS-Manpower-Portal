const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
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
    grade: {
      type: String,
      required: true,
      trim: true
    },
    vacancies: {
      type: Number,
      required: true,
      min: 1
    },
    salaryRange: {
      minimum: { type: Number, required: true },
      maximum: { type: Number, required: true }
    },
    experience: {
      minimum: { type: Number, default: 0 },
      maximum: { type: Number, required: true }
    },
    skills: [{
      type: String,
      trim: true
    }],
    description: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Draft", "Open", "On Hold", "Closed"],
      default: "Draft"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);