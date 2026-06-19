const express = require("express");

const {
  getLeaveRequests,
  applyLeave,
  processLeaveRequest,
  cancelLeaveRequest,
  getLeaveBalance
} = require("../controllers/leaveController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// View leave requests
router.get("/", getLeaveRequests);

// Employee leave balance
router.get("/balance", authorize("Employee"), getLeaveBalance);

// Employee applies for leave
router.post("/", authorize("Employee"), applyLeave);

// Manager, client approver or admin approves/rejects leave
router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processLeaveRequest
);

// Employee cancels pending leave
router.patch("/:id/cancel", authorize("Employee"), cancelLeaveRequest);

module.exports = router;