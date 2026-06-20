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
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null
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
    scheduledStart: Date,
    scheduledEnd: Date,
    graceMinutes: {
      type: Number,
      default: 0
    },
    workMinutes: {
      type: Number,
      default: 0
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    earlyLeaveMinutes: {
      type: Number,
      default: 0
    },
    overtimeMinutes: {
      type: Number,
      default: 0
    },
    smartStatus: {
      type: String,
      enum: ["On Time", "Late", "Early Leave", "Overtime", "Absent", "Manual"],
      default: "Manual"
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
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
