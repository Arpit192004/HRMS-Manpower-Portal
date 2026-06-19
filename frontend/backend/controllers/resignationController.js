const Resignation = require("../models/Resignation");
const Employee = require("../models/Employee");
const Policy = require("../models/Policy");
const User = require("../models/User");

const getEmployeeProfile = async (userId) => {
  return Employee.findOne({ user: userId });
};

const calculateNoticeLastDate = (resignationDate, noticePeriodDays) => {
  const lastWorkingDate = new Date(resignationDate);
  lastWorkingDate.setDate(lastWorkingDate.getDate() + noticePeriodDays);
  return lastWorkingDate;
};

const getResignations = async (req, res, next) => {
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

    const resignations = await Resignation.find(filter)
      .populate({
        path: "employee",
        select: "employeeCode designation department grade status",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("client", "name code")
      .populate("approver", "name email role")
      .populate("actionBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: resignations.length,
      resignations
    });
  } catch (error) {
    next(error);
  }
};

const applyResignation = async (req, res, next) => {
  try {
    const { resignationDate, requestedLastWorkingDate, reason, remarks, approver } =
      req.body;

    if (!reason || !approver) {
      res.status(400);
      throw new Error("Reason and approver are required");
    }

    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    if (employee.status !== "Active") {
      res.status(400);
      throw new Error("Only active employees can submit resignation");
    }

    const existingResignation = await Resignation.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved"] }
    });

    if (existingResignation) {
      res.status(409);
      throw new Error("An active resignation request already exists");
    }

    const effectiveResignationDate = resignationDate
      ? new Date(resignationDate)
      : new Date();

    const resignationPolicy = await Policy.findOne({
      client: employee.client,
      grade: employee.grade,
      type: "Resignation",
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $exists: false } },
        { effectiveTo: { $gte: new Date() } }
      ]
    }).sort({ effectiveFrom: -1 });

    const noticePeriodDays = Number(
      resignationPolicy?.rules?.noticePeriodDays || 30
    );

    const minimumLastWorkingDate = calculateNoticeLastDate(
      effectiveResignationDate,
      noticePeriodDays
    );

    const requestedDate = requestedLastWorkingDate
      ? new Date(requestedLastWorkingDate)
      : minimumLastWorkingDate;

    if (requestedDate < effectiveResignationDate) {
      res.status(400);
      throw new Error(
        "Requested last working date cannot be before resignation date"
      );
    }

    const resignation = await Resignation.create({
      employee: employee._id,
      client: employee.client,
      resignationDate: effectiveResignationDate,
      requestedLastWorkingDate: requestedDate,
      noticePeriodDays,
      reason,
      remarks,
      approver
    });

    res.status(201).json({
      success: true,
      message: "Resignation request submitted successfully",
      resignation
    });
  } catch (error) {
    next(error);
  }
};

const processResignation = async (req, res, next) => {
  try {
    const { decision, approvedLastWorkingDate, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved or Rejected");
    }

    const resignation = await Resignation.findById(req.params.id);

    if (!resignation) {
      res.status(404);
      throw new Error("Resignation request not found");
    }

    const isAssignedApprover =
      resignation.approver.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (!isAssignedApprover && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to process this resignation");
    }

    if (resignation.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending resignations can be processed");
    }

    resignation.status = decision;
    resignation.actionBy = req.user._id;
    resignation.actionRemarks = remarks;
    resignation.actionAt = new Date();

    if (decision === "Approved") {
      resignation.approvedLastWorkingDate = approvedLastWorkingDate
        ? new Date(approvedLastWorkingDate)
        : resignation.requestedLastWorkingDate;
    }

    await resignation.save();

    res.json({
      success: true,
      message: `Resignation ${decision.toLowerCase()} successfully`,
      resignation
    });
  } catch (error) {
    next(error);
  }
};

const withdrawResignation = async (req, res, next) => {
  try {
    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const resignation = await Resignation.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!resignation) {
      res.status(404);
      throw new Error("Resignation request not found");
    }

    if (resignation.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending resignations can be withdrawn");
    }

    resignation.status = "Withdrawn";
    await resignation.save();

    res.json({
      success: true,
      message: "Resignation withdrawn successfully",
      resignation
    });
  } catch (error) {
    next(error);
  }
};

const completeResignation = async (req, res, next) => {
  try {
    const resignation = await Resignation.findById(req.params.id);

    if (!resignation) {
      res.status(404);
      throw new Error("Resignation request not found");
    }

    if (resignation.status !== "Approved") {
      res.status(400);
      throw new Error("Only approved resignations can be completed");
    }

    resignation.status = "Completed";
    await resignation.save();

    const employee = await Employee.findById(resignation.employee);

    if (employee) {
      employee.status = "Resigned";
      await employee.save();

      await User.findByIdAndUpdate(employee.user, {
        isActive: false
      });
    }

    res.json({
      success: true,
      message: "Resignation completed successfully",
      resignation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResignations,
  applyResignation,
  processResignation,
  withdrawResignation,
  completeResignation
};