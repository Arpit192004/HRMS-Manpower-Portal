const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Offer = require("../models/Offer");

const sumComponents = (components = []) =>
  components.reduce((total, item) => total + Number(item.amount || 0), 0);

const getPayrolls = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === "Employee") {
      const employee = await Employee.findOne({ user: req.user._id });

      if (!employee) {
        res.status(404);
        throw new Error("Employee profile not found");
      }

      filter.employee = employee._id;
    }

    const payrolls = await Payroll.find(filter)
      .populate({
        path: "employee",
        select: "employeeCode designation department bankDetails",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("client", "name code")
      .populate("generatedBy", "name email")
      .populate("confirmedBy", "name email")
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      count: payrolls.length,
      payrolls
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("client", "name code");

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    if (req.user.role === "Employee") {
      const employee = await Employee.findOne({ user: req.user._id });

      if (
        !employee ||
        payroll.employee._id.toString() !== employee._id.toString()
      ) {
        res.status(403);
        throw new Error("You cannot view this payroll record");
      }
    }

    res.json({ success: true, payroll });
  } catch (error) {
    next(error);
  }
};

const generatePayroll = async (req, res, next) => {
  try {
    const {
      employee: employeeId,
      month,
      year,
      totalWorkingDays,
      earnings,
      deductions
    } = req.body;

    if (!employeeId || !month || !year || !totalWorkingDays) {
      res.status(400);
      throw new Error(
        "Employee, month, year and total working days are required"
      );
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayroll?.isLocked) {
      res.status(400);
      throw new Error("Payroll is already confirmed and locked");
    }

    const offer = await Offer.findById(employee.offer);

    const salaryEarnings = earnings || offer?.earnings || [];
    const salaryDeductions = deductions || offer?.deductions || [];

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    let payableDays = Number(totalWorkingDays);

    attendanceRecords.forEach((record) => {
      if (record.status === "Absent") payableDays -= 1;
      if (record.status === "Half Day") payableDays -= 0.5;
      if (record.status === "Unpaid") payableDays -= 1;
    });

    payableDays = Math.max(0, payableDays);

    const grossSalary = sumComponents(salaryEarnings);
    const normalDeductions = sumComponents(salaryDeductions);

    const attendanceDeduction =
      grossSalary -
      (grossSalary * payableDays) / Number(totalWorkingDays);

    const totalDeductions = normalDeductions + attendanceDeduction;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const payrollData = {
      employee: employee._id,
      client: employee.client,
      month: Number(month),
      year: Number(year),
      totalWorkingDays: Number(totalWorkingDays),
      payableDays,
      earnings: salaryEarnings,
      deductions: salaryDeductions,
      grossSalary: Number(grossSalary.toFixed(2)),
      attendanceDeduction: Number(attendanceDeduction.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      generatedBy: req.user._id
    };

    const payroll = existingPayroll
      ? await Payroll.findByIdAndUpdate(existingPayroll._id, payrollData, {
          new: true,
          runValidators: true
        })
      : await Payroll.create(payrollData);

    res.status(existingPayroll ? 200 : 201).json({
      success: true,
      message: existingPayroll
        ? "Payroll recalculated successfully"
        : "Payroll generated successfully",
      payroll
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    if (payroll.isLocked) {
      res.status(400);
      throw new Error("Payroll is already locked");
    }

    payroll.status = "Confirmed";
    payroll.isLocked = true;
    payroll.confirmedBy = req.user._id;
    payroll.confirmedAt = new Date();

    await payroll.save();

    res.json({
      success: true,
      message: "Payroll confirmed and locked successfully",
      payroll
    });
  } catch (error) {
    next(error);
  }
};

const markPayrollPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    if (payroll.status !== "Confirmed") {
      res.status(400);
      throw new Error("Only confirmed payroll can be marked as paid");
    }

    payroll.status = "Paid";
    payroll.paidAt = new Date();

    await payroll.save();

    res.json({
      success: true,
      message: "Payroll marked as paid",
      payroll
    });
  } catch (error) {
    next(error);
  }
};

const downloadBankSheet = async (req, res, next) => {
  try {
    const { client, month, year } = req.query;

    if (!client || !month || !year) {
      res.status(400);
      throw new Error("Client, month and year are required");
    }

    const payrolls = await Payroll.find({
      client,
      month: Number(month),
      year: Number(year),
      status: { $in: ["Confirmed", "Paid"] }
    }).populate({
      path: "employee",
      select: "employeeCode bankDetails",
      populate: {
        path: "user",
        select: "name"
      }
    });

    const rows = [
      [
        "Employee Code",
        "Employee Name",
        "Bank Name",
        "Account Number",
        "IFSC Code",
        "Net Salary"
      ]
    ];

    payrolls.forEach((payroll) => {
      rows.push([
        payroll.employee.employeeCode,
        payroll.employee.user?.name || "",
        payroll.employee.bankDetails?.bankName || "",
        payroll.employee.bankDetails?.accountNumber || "",
        payroll.employee.bankDetails?.ifscCode || "",
        payroll.netSalary
      ]);
    });

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bank-sheet-${month}-${year}.csv`
    );

    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayrolls,
  getPayrollById,
  generatePayroll,
  confirmPayroll,
  markPayrollPaid,
  downloadBankSheet
};