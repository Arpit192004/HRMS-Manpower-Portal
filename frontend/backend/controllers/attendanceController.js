const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Shift = require("../models/Shift");

const getEmployeeFromUser = async (userId) => {
  return Employee.findOne({ user: userId }).populate("shift");
};

const buildDateWithTime = (date, time) => {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
};

const calculateSmartAttendance = ({ date, checkIn, checkOut, status, shift }) => {
  const smart = {
    shift: shift?._id || shift || null,
    scheduledStart: undefined,
    scheduledEnd: undefined,
    graceMinutes: shift?.graceMinutes || 0,
    workingHours: 0,
    workMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    overtimeMinutes: 0,
    smartStatus: status === "Absent" ? "Absent" : "Manual"
  };

  if (checkIn && checkOut) {
    const diffMinutes =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60);
    smart.workMinutes = Math.max(0, Math.round(diffMinutes));
    smart.workingHours = Math.max(0, Number((smart.workMinutes / 60).toFixed(2)));
  }

  if (!shift || !checkIn) {
    return smart;
  }

  const scheduledStart = buildDateWithTime(date, shift.startTime);
  const scheduledEnd = buildDateWithTime(date, shift.endTime);

  if (shift.isNightShift || scheduledEnd <= scheduledStart) {
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }

  smart.scheduledStart = scheduledStart;
  smart.scheduledEnd = scheduledEnd;

  const checkInDate = new Date(checkIn);
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const graceEnd = new Date(scheduledStart.getTime() + smart.graceMinutes * 60 * 1000);

  smart.lateMinutes = Math.max(
    0,
    Math.round((checkInDate.getTime() - graceEnd.getTime()) / (1000 * 60))
  );

  if (checkOutDate) {
    smart.earlyLeaveMinutes = Math.max(
      0,
      Math.round((scheduledEnd.getTime() - checkOutDate.getTime()) / (1000 * 60))
    );
    smart.overtimeMinutes = Math.max(
      0,
      Math.round((checkOutDate.getTime() - scheduledEnd.getTime()) / (1000 * 60))
    );
  }

  if (status === "Absent") smart.smartStatus = "Absent";
  else if (smart.lateMinutes > 0) smart.smartStatus = "Late";
  else if (smart.earlyLeaveMinutes > 0) smart.smartStatus = "Early Leave";
  else if (smart.overtimeMinutes > 0) smart.smartStatus = "Overtime";
  else smart.smartStatus = "On Time";

  return smart;
};

const getAttendance = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    if (req.query.fromDate || req.query.toDate) {
      filter.date = {};

      if (req.query.fromDate) {
        filter.date.$gte = new Date(req.query.fromDate);
      }

      if (req.query.toDate) {
        filter.date.$lte = new Date(req.query.toDate);
      }
    }

    if (req.user.role === "Employee") {
      const employee = await getEmployeeFromUser(req.user._id);

      if (!employee) {
        res.status(404);
        throw new Error("Employee profile not found");
      }

      filter.employee = employee._id;
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "employeeCode designation department roster")
      .populate("client", "name code")
      .populate("shift", "name code startTime endTime graceMinutes")
      .populate("updatedBy", "name email role")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const { date, checkIn, checkOut, status, remarks, location } = req.body;

    const employee = await getEmployeeFromUser(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    if (!date || !status) {
      res.status(400);
      throw new Error("Date and status are required");
    }

    const shift = employee.shift || (employee.shift ? await Shift.findById(employee.shift) : null);
    const smartAttendance = calculateSmartAttendance({
      date,
      checkIn,
      checkOut,
      status,
      shift
    });

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: employee._id,
        date: new Date(date)
      },
      {
        employee: employee._id,
        client: employee.client,
        date,
        checkIn,
        checkOut,
        ...smartAttendance,
        status,
        location,
        remarks,
        source: "Employee",
        updatedBy: req.user._id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Attendance marked successfully",
      attendance
    });
  } catch (error) {
    next(error);
  }
};

const manuallyUpdateAttendance = async (req, res, next) => {
  try {
    const { employee: employeeId, date, status, checkIn, checkOut, remarks, shift: shiftId } =
      req.body;

    if (!employeeId || !date || !status) {
      res.status(400);
      throw new Error("Employee, date and status are required");
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    const shift = shiftId
      ? await Shift.findById(shiftId)
      : employee.shift
        ? await Shift.findById(employee.shift)
        : null;

    const smartAttendance = calculateSmartAttendance({
      date,
      checkIn,
      checkOut,
      status,
      shift
    });

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: employee._id,
        date: new Date(date)
      },
      {
        employee: employee._id,
        client: employee.client,
        date,
        status,
        checkIn,
        checkOut,
        ...smartAttendance,
        remarks,
        source: "Payroll Team",
        updatedBy: req.user._id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Attendance updated successfully",
      attendance
    });
  } catch (error) {
    next(error);
  }
};

const uploadAttendanceSheet = async (req, res, next) => {
  try {
    const { month, year, attendanceSheetUrl } = req.body;

    if (!month || !year || !attendanceSheetUrl) {
      res.status(400);
      throw new Error("Month, year and attendance sheet URL are required");
    }

    const employee = await getEmployeeFromUser(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    res.status(201).json({
      success: true,
      message: "Attendance sheet submitted successfully",
      upload: {
        employee: employee._id,
        client: employee.client,
        month,
        year,
        attendanceSheetUrl,
        uploadedBy: req.user._id
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  manuallyUpdateAttendance,
  uploadAttendanceSheet
};
