const Workflow = require("../models/Workflow");
const User = require("../models/User");

const allowedModels = [
  "LeaveRequest",
  "TourRequest",
  "ExpenseClaim",
  "Offer",
  "Resignation"
];

const getWorkflows = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.requestType) filter.requestType = req.query.requestType;
    if (req.query.status) filter.status = req.query.status;

    if (!["Super Admin", "HR Admin"].includes(req.user.role)) {
      filter.$or = [
        { requestedBy: req.user._id },
        { "steps.approver": req.user._id }
      ];
    }

    const workflows = await Workflow.find(filter)
      .populate("client", "name code")
      .populate("requestedBy", "name email role")
      .populate("steps.approver", "name email role")
      .populate("requestId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workflows.length,
      workflows
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate("client", "name code")
      .populate("requestedBy", "name email role")
      .populate("steps.approver", "name email role")
      .populate("requestId");

    if (!workflow) {
      res.status(404);
      throw new Error("Workflow not found");
    }

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    const isRequester =
      workflow.requestedBy._id.toString() === req.user._id.toString();

    const isApprover = workflow.steps.some(
      (step) => step.approver._id.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isRequester && !isApprover) {
      res.status(403);
      throw new Error("You cannot view this workflow");
    }

    res.json({ success: true, workflow });
  } catch (error) {
    next(error);
  }
};

const createWorkflow = async (req, res, next) => {
  try {
    const {
      client,
      requestType,
      requestId,
      requestModel,
      approvers
    } = req.body;

    if (
      !client ||
      !requestType ||
      !requestId ||
      !requestModel ||
      !Array.isArray(approvers) ||
      approvers.length === 0
    ) {
      res.status(400);
      throw new Error("Please provide all required workflow details");
    }

    if (!allowedModels.includes(requestModel)) {
      res.status(400);
      throw new Error("Invalid request model");
    }

    const uniqueApprovers = [...new Set(approvers)];

    const validApproverCount = await User.countDocuments({
      _id: { $in: uniqueApprovers },
      isActive: true
    });

    if (validApproverCount !== uniqueApprovers.length) {
      res.status(400);
      throw new Error("One or more approvers are invalid or inactive");
    }

    const existingWorkflow = await Workflow.findOne({
      requestModel,
      requestId
    });

    if (existingWorkflow) {
      res.status(409);
      throw new Error("Workflow already exists for this request");
    }

    const steps = uniqueApprovers.map((approver, index) => ({
      sequence: index + 1,
      approver
    }));

    const workflow = await Workflow.create({
      client,
      requestType,
      requestId,
      requestModel,
      requestedBy: req.user._id,
      steps
    });

    res.status(201).json({
      success: true,
      message: "Approval workflow created successfully",
      workflow
    });
  } catch (error) {
    next(error);
  }
};

const processWorkflowStep = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Approved", "Rejected", "Skipped"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved, Rejected or Skipped");
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      res.status(404);
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "Pending") {
      res.status(400);
      throw new Error("Workflow is no longer pending");
    }

    const currentStep = workflow.steps.find(
      (step) => step.sequence === workflow.currentStep
    );

    if (!currentStep) {
      res.status(400);
      throw new Error("Current workflow step not found");
    }

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (
      currentStep.approver.toString() !== req.user._id.toString() &&
      !isAdmin
    ) {
      res.status(403);
      throw new Error("You are not the current approver");
    }

    currentStep.status = decision;
    currentStep.remarks = remarks;
    currentStep.actionAt = new Date();

    if (decision === "Rejected") {
      workflow.status = "Rejected";
    } else {
      const nextStep = workflow.steps.find(
        (step) => step.sequence === workflow.currentStep + 1
      );

      if (nextStep) {
        workflow.currentStep += 1;
      } else {
        workflow.status = "Approved";
      }
    }

    await workflow.save();

    res.json({
      success: true,
      message: `Workflow step ${decision.toLowerCase()} successfully`,
      workflow
    });
  } catch (error) {
    next(error);
  }
};

const cancelWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      res.status(404);
      throw new Error("Workflow not found");
    }

    const isAdmin = ["Super Admin", "HR Admin"].includes(req.user.role);

    if (
      workflow.requestedBy.toString() !== req.user._id.toString() &&
      !isAdmin
    ) {
      res.status(403);
      throw new Error("You cannot cancel this workflow");
    }

    if (workflow.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending workflows can be cancelled");
    }

    workflow.status = "Cancelled";
    await workflow.save();

    res.json({
      success: true,
      message: "Workflow cancelled successfully",
      workflow
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  processWorkflowStep,
  cancelWorkflow
};