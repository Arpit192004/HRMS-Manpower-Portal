const mongoose = require("mongoose");

const expenseItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "Travel",
        "Accommodation",
        "Food",
        "Fuel",
        "Medical",
        "Office",
        "Other"
      ],
      required: true
    },
    expenseDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    receiptUrl: String
  },
  { _id: true }
);

const expenseClaimSchema = new mongoose.Schema(
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
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourRequest",
      default: null
    },
    claimNumber: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [expenseItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one expense item is required"
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Processed",
        "Cancelled"
      ],
      default: "Pending"
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    actionRemarks: String,
    actionAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    processedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenseClaim", expenseClaimSchema);