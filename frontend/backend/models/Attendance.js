const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true
    },
    checkIn: Date,
    checkOut: Date,
    workingHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Half Day",
        "Leave",
        "Holiday",
        "Weekly Off"
      ],
      required: true
    },
    source: {
      type: String,
      enum: ["Employee", "Manual Upload", "Payroll Team"],
      default: "Employee"
    },
    attendanceSheetUrl: String,
    remarks: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);