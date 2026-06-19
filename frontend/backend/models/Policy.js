const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ["Attendance", "Leave", "Tour", "Claim", "Resignation"]
    },
    grade: {
      type: String,
      required: true,
      trim: true
    },
    rules: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    effectiveFrom: {
      type: Date,
      required: true
    },
    effectiveTo: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

policySchema.index({ client: 1, type: 1, grade: 1 });

module.exports = mongoose.model("Policy", policySchema);