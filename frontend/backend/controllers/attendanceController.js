const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const getEmployeeFromUser = async (userId) => {
  return Employee.findOne({ user: userId });
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
      .populate("employee", "employeeCode designation department")
      .populate("client", "name code")
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
    const { date, checkIn, checkOut, status, remarks } = req.body;

    const employee = await getEmployeeFromUser(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    if (!date || !status) {
      res.status(400);
      throw new Error("Date and status are required");
    }

    let workingHours = 0;

    if (checkIn && checkOut) {
      workingHours =
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60);

      workingHours = Math.max(0, Number(workingHours.toFixed(2)));
    }

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
        workingHours,
        status,
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
    const { employee: employeeId, date, status, checkIn, checkOut, remarks } =
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

    let workingHours = 0;

    if (checkIn && checkOut) {
      workingHours =
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60);

      workingHours = Math.max(0, Number(workingHours.toFixed(2)));
    }

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
        workingHours,
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