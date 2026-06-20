const express = require("express");

const {
  getWorkflows,
  getWorkflowSummary,
  getWorkflowById,
  createWorkflow,
  processWorkflowStep,
  cancelWorkflow,
  escalateWorkflow,
  seedDemoWorkflows
} = require("../controllers/workflowController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getWorkflows)
  .post(
    authorize(
      "Super Admin",
      "HR Admin",
      "Manager",
      "Client Approver",
      "Employee"
    ),
    createWorkflow
  );

router.get("/summary", getWorkflowSummary);

router.post(
  "/demo",
  authorize("Super Admin", "HR Admin"),
  seedDemoWorkflows
);

router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processWorkflowStep
);

router.patch(
  "/:id/escalate",
  authorize("Super Admin", "HR Admin", "Manager"),
  escalateWorkflow
);

router.patch("/:id/cancel", cancelWorkflow);

router.get("/:id", getWorkflowById);

module.exports = router;
