const mongoose = require("mongoose");

const companySettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: "HRMS Manpower Portal",
      trim: true
    },
    tagline: {
      type: String,
      default: "Complete HRMS and manpower services platform",
      trim: true
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    website: {
      type: String,
      default: "",
      trim: true
    },
    address: {
      type: String,
      default: "",
      trim: true
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true
    },
    cinNumber: {
      type: String,
      default: "",
      trim: true
    },
    footerText: {
      type: String,
      default: "Thank you for choosing our HRMS manpower services.",
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySetting", companySettingSchema);
