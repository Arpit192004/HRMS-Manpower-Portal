const ExpenseClaim = require("../models/ExpenseClaim");
const Employee = require("../models/Employee");
const TourRequest = require("../models/TourRequest");
const Policy = require("../models/Policy");
const sendEmail = require("../utils/sendEmail");

const getEmployeeProfile = async (userId) => {
  return Employee.findOne({ user: userId });
};

const generateClaimNumber = async () => {
  const year = new Date().getFullYear();
  const count = await ExpenseClaim.countDocuments();

  return `CLM-${year}-${String(count + 1).padStart(5, "0")}`;
};

const calculateTotal = (items = []) => {
  return items.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );
};

const getExpenseClaims = async (req, res, next) => {
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

    const claims = await ExpenseClaim.find(filter)
      .populate("employee", "employeeCode designation department grade")
      .populate("client", "name code")
      .populate("tour", "purpose destination startDate endDate")
      .populate("approver", "name email role")
      .populate("actionBy", "name email role")
      .populate("processedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (error) {
    next(error);
  }
};

const createExpenseClaim = async (req, res, next) => {
  try {
    const { title, items, tour, approver } = req.body;

    if (!title || !Array.isArray(items) || !items.length || !approver) {
      res.status(400);
      throw new Error("Title, expense items and approver are required");
    }

    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    if (tour) {
      const tourRequest = await TourRequest.findOne({
        _id: tour,
        employee: employee._id,
        status: { $in: ["Approved", "Completed"] }
      });

      if (!tourRequest) {
        res.status(400);
        throw new Error("Valid approved or completed tour not found");
      }
    }

    const totalAmount = calculateTotal(items);

    const claimPolicy = await Policy.findOne({
      client: employee.client,
      grade: employee.grade,
      type: "Claim",
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $exists: false } },
        { effectiveTo: { $gte: new Date() } }
      ]
    }).sort({ effectiveFrom: -1 });

    const maximumAmount = claimPolicy?.rules?.maximumAmount;

    if (
      maximumAmount !== undefined &&
      totalAmount > Number(maximumAmount)
    ) {
      res.status(400);
      throw new Error(
        `Claim amount exceeds grade policy limit of ${maximumAmount}`
      );
    }

    const claim = await ExpenseClaim.create({
      employee: employee._id,
      client: employee.client,
      tour: tour || null,
      claimNumber: await generateClaimNumber(),
      title,
      items,
      totalAmount,
      approver
    });

    res.status(201).json({
      success: true,
      message: "Expense claim submitted successfully",
      claim
    });
  } catch (error) {
    next(error);
  }
};

const processExpenseClaim = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved or Rejected");
    }

    const claim = await ExpenseClaim.findById(req.params.id).populate({
      path: "employee",
      populate: { path: "user", select: "name email" }
    });

    if (!claim) {
      res.status(404);
      throw new Error("Expense claim not found");
    }

    const isAssignedApprover =
      claim.approver.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (!isAssignedApprover && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to process this claim");
    }

    if (claim.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending claims can be processed");
    }

    claim.status = decision;
    claim.actionBy = req.user._id;
    claim.actionRemarks = remarks;
    claim.actionAt = new Date();

    await claim.save();

    await sendEmail({
      to: claim.employee?.user?.email,
      subject: `Expense claim ${decision}`,
      text: `Your expense claim ${claim.claimNumber} has been ${decision.toLowerCase()}.`,
      html: `<p>Your expense claim <strong>${claim.claimNumber}</strong> has been <strong>${decision.toLowerCase()}</strong>.</p>`
    });

    res.json({
      success: true,
      message: `Expense claim ${decision.toLowerCase()} successfully`,
      claim
    });
  } catch (error) {
    next(error);
  }
};

const markClaimProcessed = async (req, res, next) => {
  try {
    const claim = await ExpenseClaim.findById(req.params.id).populate({
      path: "employee",
      populate: { path: "user", select: "name email" }
    });

    if (!claim) {
      res.status(404);
      throw new Error("Expense claim not found");
    }

    if (claim.status !== "Approved") {
      res.status(400);
      throw new Error("Only approved claims can be processed");
    }

    claim.status = "Processed";
    claim.processedBy = req.user._id;
    claim.processedAt = new Date();

    await claim.save();

    await sendEmail({
      to: claim.employee?.user?.email,
      subject: "Expense claim processed",
      text: `Your expense claim ${claim.claimNumber} has been processed.`,
      html: `<p>Your expense claim <strong>${claim.claimNumber}</strong> has been processed.</p>`
    });

    res.json({
      success: true,
      message: "Expense claim marked as processed",
      claim
    });
  } catch (error) {
    next(error);
  }
};

const cancelExpenseClaim = async (req, res, next) => {
  try {
    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const claim = await ExpenseClaim.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!claim) {
      res.status(404);
      throw new Error("Expense claim not found");
    }

    if (claim.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending claims can be cancelled");
    }

    claim.status = "Cancelled";
    await claim.save();

    res.json({
      success: true,
      message: "Expense claim cancelled successfully",
      claim
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenseClaims,
  createExpenseClaim,
  processExpenseClaim,
  markClaimProcessed,
  cancelExpenseClaim
};
