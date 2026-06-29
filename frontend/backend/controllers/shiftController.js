const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Shift = require("../models/Shift");

const getShiftFilter = (req) => {
  const filter = {};

  if (["Client Approver", "Manager"].includes(req.user.role)) {
    filter.client = req.user.client;
  } else if (req.query.client) {
    filter.client = req.query.client;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  return filter;
};

const getShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find(getShiftFilter(req))
      .populate("client", "name code")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: shifts.length,
      shifts
    });
  } catch (error) {
    next(error);
  }
};

const createShift = async (req, res, next) => {
  try {
    const {
      client,
      name,
      code,
      startTime,
      endTime,
      graceMinutes,
      weeklyOffs,
      isNightShift
    } = req.body;

    if (!name || !code || !startTime || !endTime) {
      res.status(400);
      throw new Error("Name, code, start time and end time are required");
    }

    const shift = await Shift.create({
      client: client || null,
      name,
      code,
      startTime,
      endTime,
      graceMinutes,
      weeklyOffs,
      isNightShift,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      shift
    });
  } catch (error) {
    next(error);
  }
};

const updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      res.status(404);
      throw new Error("Shift not found");
    }

    const allowed = [
      "client",
      "name",
      "code",
      "startTime",
      "endTime",
      "graceMinutes",
      "weeklyOffs",
      "isNightShift",
      "isActive"
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        shift[field] = req.body[field];
      }
    });

    await shift.save();

    res.json({
      success: true,
      message: "Shift updated successfully",
      shift
    });
  } catch (error) {
    next(error);
  }
};

const assignShiftToEmployee = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      res.status(404);
      throw new Error("Shift not found");
    }

    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    if (
      shift.client &&
      employee.client.toString() !== shift.client.toString()
    ) {
      res.status(400);
      throw new Error("Shift and employee belong to different clients");
    }

    employee.shift = shift._id;
    employee.roster = shift.name;
    await employee.save();

    res.json({
      success: true,
      message: "Shift assigned successfully",
      employee
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceHealth = async (req, res, next) => {
  try {
    const client =
      ["Client Approver", "Manager"].includes(req.user.role) ? req.user.client : req.query.client;

    const employeeFilter = { status: "Active" };
    const attendanceFilter = {};

    if (client) {
      employeeFilter.client = client;
      attendanceFilter.client = client;
    }

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    attendanceFilter.date = { $gte: start, $lte: end };

    const [activeEmployees, attendance] = await Promise.all([
      Employee.find(employeeFilter)
        .populate("client", "name code")
        .populate("shift", "name code startTime endTime graceMinutes")
        .select("employeeCode designation department roster client shift"),
      Attendance.find(attendanceFilter)
        .populate("employee", "employeeCode designation department roster")
        .populate("client", "name code")
        .populate("shift", "name code startTime endTime graceMinutes")
        .sort({ lateMinutes: -1, overtimeMinutes: -1 })
    ]);

    const markedEmployeeIds = new Set(
      attendance.map((item) => item.employee?._id?.toString()).filter(Boolean)
    );

    const present = attendance.filter((item) =>
      ["Present", "Half Day"].includes(item.status)
    ).length;
    const leave = attendance.filter((item) =>
      ["Leave", "Holiday", "Weekly Off"].includes(item.status)
    ).length;
    const absentMarked = attendance.filter((item) => item.status === "Absent").length;
    const notMarked = activeEmployees.filter(
      (employee) => !markedEmployeeIds.has(employee._id.toString())
    ).length;

    const summary = {
      activeEmployees: activeEmployees.length,
      present,
      leave,
      absent: absentMarked + notMarked,
      late: attendance.filter((item) => item.lateMinutes > 0).length,
      overtime: attendance.filter((item) => item.overtimeMinutes > 0).length,
      notMarked
    };

    res.json({
      success: true,
      date: start,
      summary,
      attendance,
      unmarkedEmployees: activeEmployees.filter(
        (employee) => !markedEmployeeIds.has(employee._id.toString())
      )
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  assignShiftToEmployee,
  getAttendanceHealth
};
