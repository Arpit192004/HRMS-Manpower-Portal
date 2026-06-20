const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
      unique: true
    },
    designation: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    grade: {
      type: String,
      required: true
    },
    joiningDate: {
      type: Date,
      required: true
    },
    personalDetails: {
      dateOfBirth: Date,
      gender: String,
      phone: String,
      aadhaar: String,
      pan: String,
      address: String
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String
    },
    dependents: [
      {
        name: String,
        relationship: String,
        dateOfBirth: Date
      }
    ],
    previousCompanies: [
      {
        companyName: String,
        designation: String,
        fromDate: Date,
        toDate: Date
      }
    ],
    qualifications: [
      {
        course: String,
        institute: String,
        passingYear: Number,
        percentage: Number
      }
    ],
    documents: [
      {
        type: {
          type: String,
          enum: [
            "Resume",
            "Offer Letter",
            "Appointment Letter",
            "Salary Slip",
            "Aadhaar",
            "PAN",
            "Qualification",
            "Experience Letter",
            "Other"
          ],
          required: true
        },
        title: {
          type: String,
          required: true,
          trim: true
        },
        url: {
          type: String,
          required: true,
          trim: true
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        },
        verificationStatus: {
          type: String,
          enum: ["Pending", "Verified", "Rejected", "Expired"],
          default: "Pending"
        },
        verificationRemarks: {
          type: String,
          default: "",
          trim: true
        },
        expiryDate: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        verifiedAt: Date
      }
    ],
    roster: {
      type: String,
      default: "General"
    },
    attendancePolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      default: null
    },
    leavePolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      default: null
    },
    approvers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned", "Terminated"],
      default: "Active"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
