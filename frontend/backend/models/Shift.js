const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    startTime: {
      type: String,
      required: true,
      default: "09:00"
    },
    endTime: {
      type: String,
      required: true,
      default: "18:00"
    },
    graceMinutes: {
      type: Number,
      default: 10,
      min: 0
    },
    weeklyOffs: {
      type: [String],
      default: ["Sunday"]
    },
    isNightShift: {
      type: Boolean,
      default: false
    },
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

shiftSchema.index({ client: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Shift", shiftSchema);
