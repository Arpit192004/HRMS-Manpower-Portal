const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
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
      required: true
    },
    dueDate: Date,
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        rate: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    subTotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 18
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Cancelled"],
      default: "Draft"
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
