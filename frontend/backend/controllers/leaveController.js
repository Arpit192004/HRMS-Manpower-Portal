const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");

const getEmployeeProfile = async (userId) => {
  return Employee.findOne({ user: userId });
};

const calculateDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const getLeaveRequests = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.employee) filter.employee = req.query.employee;

    if (req.user.role === "Employee") {
      const employee = await getEmployeeProfile(req.user._id);

      if (!employee) {
        res.status(404);
        throw new Error("Employee profile not found");
      }

      filter.employee = employee._id;
    }

    if (["Manager", "Client Approver"].includes(req.user.role)) {
      filter.approver = req.user._id;
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate("employee", "employeeCode designation department")
      .populate("client", "name code")
      .populate("approver", "name email role")
      .populate("actionBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (error) {
    next(error);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, fromDate, toDate, reason, approver } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason || !approver) {
      res.status(400);
      throw new Error("Please provide all required leave details");
    }

    if (new Date(toDate) < new Date(fromDate)) {
      res.status(400);
      throw new Error("To date cannot be before from date");
    }

    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const overlappingLeave = await LeaveRequest.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved"] },
      fromDate: { $lte: new Date(toDate) },
      toDate: { $gte: new Date(fromDate) }
    });

    if (overlappingLeave) {
      res.status(409);
      throw new Error("A leave request already exists for these dates");
    }

    const leaveRequest = await LeaveRequest.create({
      employee: employee._id,
      client: employee.client,
      leaveType,
      fromDate,
      toDate,
      totalDays: calculateDays(fromDate, toDate),
      reason,
      approver
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

const processLeaveRequest = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved or Rejected");
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      res.status(404);
      throw new Error("Leave request not found");
    }

    const isAssignedApprover =
      leaveRequest.approver.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (!isAssignedApprover && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to process this request");
    }

    if (leaveRequest.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending requests can be processed");
    }

    leaveRequest.status = decision;
    leaveRequest.actionBy = req.user._id;
    leaveRequest.actionRemarks = remarks;
    leaveRequest.actionAt = new Date();

    await leaveRequest.save();

    res.json({
      success: true,
      message: `Leave request ${decision.toLowerCase()} successfully`,
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

const cancelLeaveRequest = async (req, res, next) => {
  try {
    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const leaveRequest = await LeaveRequest.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!leaveRequest) {
      res.status(404);
      throw new Error("Leave request not found");
    }

    if (leaveRequest.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending leave requests can be cancelled");
    }

    leaveRequest.status = "Cancelled";
    await leaveRequest.save();

    res.json({
      success: true,
      message: "Leave request cancelled successfully",
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const usedLeaves = await LeaveRequest.aggregate([
      {
        $match: {
          employee: employee._id,
          status: "Approved",
          fromDate: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: "$leaveType",
          used: { $sum: "$totalDays" }
        }
      }
    ]);

    const allowances = {
      Casual: 12,
      Sick: 12,
      Earned: 18
    };

    const balance = Object.entries(allowances).map(([leaveType, total]) => {
      const used =
        usedLeaves.find((item) => item._id === leaveType)?.used || 0;

      return {
        leaveType,
        total,
        used,
        remaining: total - used
      };
    });

    res.json({ success: true, balance });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaveRequests,
  applyLeave,
  processLeaveRequest,
  cancelLeaveRequest,
  getLeaveBalance
};