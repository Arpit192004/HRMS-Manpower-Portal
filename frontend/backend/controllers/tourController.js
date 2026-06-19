const TourRequest = require("../models/TourRequest");
const Employee = require("../models/Employee");
const Policy = require("../models/Policy");

const getEmployeeProfile = async (userId) => {
  return Employee.findOne({ user: userId });
};

const getTourRequests = async (req, res, next) => {
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

    const tourRequests = await TourRequest.find(filter)
      .populate("employee", "employeeCode designation department grade")
      .populate("client", "name code")
      .populate("approver", "name email role")
      .populate("actionBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tourRequests.length,
      tourRequests
    });
  } catch (error) {
    next(error);
  }
};

const applyTour = async (req, res, next) => {
  try {
    const {
      purpose,
      fromLocation,
      destination,
      startDate,
      endDate,
      travelMode,
      estimatedAmount,
      advanceRequired,
      advanceAmount,
      approver
    } = req.body;

    if (
      !purpose ||
      !fromLocation ||
      !destination ||
      !startDate ||
      !endDate ||
      !travelMode ||
      estimatedAmount === undefined ||
      !approver
    ) {
      res.status(400);
      throw new Error("Please provide all required tour details");
    }

    if (new Date(endDate) < new Date(startDate)) {
      res.status(400);
      throw new Error("End date cannot be before start date");
    }

    if (advanceRequired && Number(advanceAmount || 0) <= 0) {
      res.status(400);
      throw new Error("Advance amount is required");
    }

    if (Number(advanceAmount || 0) > Number(estimatedAmount)) {
      res.status(400);
      throw new Error("Advance amount cannot exceed estimated amount");
    }

    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const tourPolicy = await Policy.findOne({
      client: employee.client,
      grade: employee.grade,
      type: "Tour",
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $exists: false } },
        { effectiveTo: { $gte: new Date() } }
      ]
    }).sort({ effectiveFrom: -1 });

    const maximumAmount = tourPolicy?.rules?.maximumAmount;

    if (
      maximumAmount !== undefined &&
      Number(estimatedAmount) > Number(maximumAmount)
    ) {
      res.status(400);
      throw new Error(
        `Estimated amount exceeds grade policy limit of ${maximumAmount}`
      );
    }

    const overlappingTour = await TourRequest.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (overlappingTour) {
      res.status(409);
      throw new Error("A tour request already exists for these dates");
    }

    const tourRequest = await TourRequest.create({
      employee: employee._id,
      client: employee.client,
      purpose,
      fromLocation,
      destination,
      startDate,
      endDate,
      travelMode,
      estimatedAmount,
      advanceRequired: Boolean(advanceRequired),
      advanceAmount: advanceRequired ? advanceAmount : 0,
      approver
    });

    res.status(201).json({
      success: true,
      message: "Tour request submitted successfully",
      tourRequest
    });
  } catch (error) {
    next(error);
  }
};

const processTourRequest = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved or Rejected");
    }

    const tourRequest = await TourRequest.findById(req.params.id);

    if (!tourRequest) {
      res.status(404);
      throw new Error("Tour request not found");
    }

    const isAssignedApprover =
      tourRequest.approver.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (!isAssignedApprover && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to process this request");
    }

    if (tourRequest.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending tour requests can be processed");
    }

    tourRequest.status = decision;
    tourRequest.actionBy = req.user._id;
    tourRequest.actionRemarks = remarks;
    tourRequest.actionAt = new Date();

    await tourRequest.save();

    res.json({
      success: true,
      message: `Tour request ${decision.toLowerCase()} successfully`,
      tourRequest
    });
  } catch (error) {
    next(error);
  }
};

const cancelTourRequest = async (req, res, next) => {
  try {
    const employee = await getEmployeeProfile(req.user._id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found");
    }

    const tourRequest = await TourRequest.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!tourRequest) {
      res.status(404);
      throw new Error("Tour request not found");
    }

    if (tourRequest.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending tour requests can be cancelled");
    }

    tourRequest.status = "Cancelled";
    await tourRequest.save();

    res.json({
      success: true,
      message: "Tour request cancelled successfully",
      tourRequest
    });
  } catch (error) {
    next(error);
  }
};

const completeTourRequest = async (req, res, next) => {
  try {
    const tourRequest = await TourRequest.findById(req.params.id);

    if (!tourRequest) {
      res.status(404);
      throw new Error("Tour request not found");
    }

    if (tourRequest.status !== "Approved") {
      res.status(400);
      throw new Error("Only approved tours can be completed");
    }

    tourRequest.status = "Completed";
    await tourRequest.save();

    res.json({
      success: true,
      message: "Tour marked as completed",
      tourRequest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTourRequests,
  applyTour,
  processTourRequest,
  cancelTourRequest,
  completeTourRequest
};