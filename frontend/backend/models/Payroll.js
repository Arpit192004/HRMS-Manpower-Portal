const mongoose = require("mongoose");

const salaryComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    frequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
      default: "Monthly"
    }
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2000
    },
    totalWorkingDays: {
      type: Number,
      required: true,
      min: 0
    },
    payableDays: {
      type: Number,
      required: true,
      min: 0
    },
    earnings: [salaryComponentSchema],
    deductions: [salaryComponentSchema],
    grossSalary: {
      type: Number,
      required: true,
      min: 0
    },
    attendanceDeduction: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["Draft", "Confirmed", "Paid"],
      default: "Draft"
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    confirmedAt: Date,
    paidAt: Date
  },
  { timestamps: true }
);

payrollSchema.index(
  { employee: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
