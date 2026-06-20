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
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.overdue === "true") {
      filter.status = "Pending";
      filter.dueAt = { $lt: new Date() };
    }

    if (!["Super Admin", "HR Admin"].includes(req.user.role)) {
      filter.$or = [
        { requestedBy: req.user._id },
        { "steps.approver": req.user._id }
      ];
    }

    if (req.query.mine === "true") {
      filter.status = "Pending";
      filter.steps = {
        $elemMatch: {
          approver: req.user._id,
          status: "Pending"
        }
      };
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

const getWorkflowSummary = async (req, res, next) => {
  try {
    const baseFilter = {};

    if (req.query.client) baseFilter.client = req.query.client;

    if (!["Super Admin", "HR Admin"].includes(req.user.role)) {
      baseFilter.$or = [
        { requestedBy: req.user._id },
        { "steps.approver": req.user._id }
      ];
    }

    const now = new Date();

    const [pending, approved, rejected, overdue, highPriority, myPending] =
      await Promise.all([
        Workflow.countDocuments({ ...baseFilter, status: "Pending" }),
        Workflow.countDocuments({ ...baseFilter, status: "Approved" }),
        Workflow.countDocuments({ ...baseFilter, status: "Rejected" }),
        Workflow.countDocuments({
          ...baseFilter,
          status: "Pending",
          dueAt: { $lt: now }
        }),
        Workflow.countDocuments({
          ...baseFilter,
          status: "Pending",
          priority: { $in: ["High", "Critical"] }
        }),
        Workflow.countDocuments({
          ...baseFilter,
          status: "Pending",
          steps: {
            $elemMatch: {
              approver: req.user._id,
              status: "Pending"
            }
          }
        })
      ]);

    res.json({
      success: true,
      summary: {
        pending,
        approved,
        rejected,
        overdue,
        highPriority,
        myPending
      }
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
      approvers,
      priority,
      slaHours
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
      steps,
      priority: priority || "Medium",
      slaHours: Number(slaHours || 24),
      dueAt: new Date(Date.now() + Number(slaHours || 24) * 60 * 60 * 1000)
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

    if (workflow.status !== "Pending") {
      workflow.escalationLevel = 0;
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

const escalateWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      res.status(404);
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending workflows can be escalated");
    }

    workflow.escalationLevel = (workflow.escalationLevel || 0) + 1;
    workflow.escalatedAt = new Date();
    workflow.priority =
      workflow.priority === "Critical"
        ? "Critical"
        : workflow.priority === "High"
          ? "Critical"
          : "High";

    await workflow.save();

    res.json({
      success: true,
      message: "Workflow escalated successfully",
      workflow
    });
  } catch (error) {
    next(error);
  }
};

const seedDemoWorkflows = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const demoClient = req.user.client || req.body.client;

    if (!demoClient) {
      res.status(400);
      throw new Error("Client is required to create demo workflows");
    }

    const samples = [
      ["Leave", "LeaveRequest", "665000000000000000000001", "High", 8],
      ["Expense", "ExpenseClaim", "665000000000000000000002", "Critical", 4],
      ["Tour", "TourRequest", "665000000000000000000003", "Medium", 24]
    ];

    const created = [];

    for (const [requestType, requestModel, requestId, priority, slaHours] of samples) {
      const existing = await Workflow.findOne({ requestModel, requestId });

      if (!existing) {
        const workflow = await Workflow.create({
          client: demoClient,
          requestType,
          requestId,
          requestModel,
          requestedBy: req.user._id,
          priority,
          slaHours,
          dueAt: new Date(Date.now() + slaHours * 60 * 60 * 1000),
          steps: [
            {
              sequence: 1,
              approver: currentUser._id
            }
          ]
        });
        created.push(workflow);
      }
    }

    res.status(201).json({
      success: true,
      message: "Demo approval workflows ready",
      created
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkflows,
  getWorkflowSummary,
  getWorkflowById,
  createWorkflow,
  processWorkflowStep,
  cancelWorkflow,
  escalateWorkflow,
  seedDemoWorkflows
};
