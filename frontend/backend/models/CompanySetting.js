const mongoose = require("mongoose");

const companySettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: "Niyukti",
      trim: true
    },
    tagline: {
      type: String,
      default: "From hiring to workforce management",
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
      default: "Thank you for choosing Niyukti workforce services.",
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
