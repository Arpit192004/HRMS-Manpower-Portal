const Client = require("../models/Client");
const Employee = require("../models/Employee");
const Candidate = require("../models/Candidate");
const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");

const getDashboardReport = async (req, res, next) => {
  try {
    const clientFilter = req.query.client
      ? { client: req.query.client }
      : {};

    const [
      totalClients,
      totalEmployees,
      totalCandidates,
      pendingLeaves,
      payrollSummary
    ] = await Promise.all([
      Client.countDocuments({ isActive: true }),
      Employee.countDocuments({ ...clientFilter, status: "Active" }),
      Candidate.countDocuments(clientFilter),
      LeaveRequest.countDocuments({
        ...clientFilter,
        status: "Pending"
      }),
      Payroll.aggregate([
        { $match: clientFilter },
        {
          $group: {
            _id: null,
            totalGrossSalary: { $sum: "$grossSalary" },
            totalNetSalary: { $sum: "$netSalary" }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      report: {
        totalClients,
        totalEmployees,
        totalCandidates,
        pendingLeaves,
        payrollSummary: payrollSummary[0] || {
          totalGrossSalary: 0,
          totalNetSalary: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    const employees = await Employee.find(filter)
      .populate("user", "name email")
      .populate("client", "name code")
      .sort({ employeeCode: 1 });

    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    next(error);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    const leaves = await LeaveRequest.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;

    if (req.query.fromDate || req.query.toDate) {
      filter.date = {};
      if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    next(error);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const payroll = await Payroll.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: payroll.length, payroll });
  } catch (error) {
    next(error);
  }
};

const getHiringReport = async (req, res, next) => {
  try {
    const match = {};
    if (req.query.client) match.client = req.query.client;

    const hiring = await Candidate.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, hiring });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardReport,
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getHiringReport
};