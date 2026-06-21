const mongoose = require("mongoose");

const eSignRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    documentType: {
      type: String,
      enum: ["Offer Letter", "Appointment Letter", "Policy", "Agreement", "Other"],
      required: true
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true
    },
    signedDocumentUrl: {
      type: String,
      default: "",
      trim: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    signerName: {
      type: String,
      required: true,
      trim: true
    },
    signerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Signed", "Declined", "Expired"],
      default: "Pending"
    },
    signatureText: {
      type: String,
      default: "",
      trim: true
    },
    signatureImageUrl: {
      type: String,
      default: "",
      trim: true
    },
    declinedReason: {
      type: String,
      default: "",
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    signedAt: Date,
    signerIp: String,
    signerUserAgent: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

eSignRequestSchema.index({ signer: 1, status: 1 });
eSignRequestSchema.index({ client: 1, status: 1 });
eSignRequestSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model("ESignRequest", eSignRequestSchema);
