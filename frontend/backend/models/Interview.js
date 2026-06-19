const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true
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
    roundNumber: {
      type: Number,
      required: true,
      min: 1
    },
    roundName: {
      type: String,
      required: true,
      trim: true
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    mode: {
      type: String,
      enum: ["Online", "In-Person", "Phone"],
      required: true
    },
    meetingLinkOrLocation: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Skipped", "Cancelled"],
      default: "Scheduled"
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      recommendation: {
        type: String,
        enum: ["Recommended", "Not Recommended", "Hold"]
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

interviewSchema.index(
  { candidate: 1, roundNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Interview", interviewSchema);