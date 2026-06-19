const express = require("express");

const {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  processWorkflowStep,
  cancelWorkflow
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

router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processWorkflowStep
);

router.patch("/:id/cancel", cancelWorkflow);

router.get("/:id", getWorkflowById);

module.exports = router;