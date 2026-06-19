const express = require("express");

const {
  getResignations,
  applyResignation,
  processResignation,
  withdrawResignation,
  completeResignation
} = require("../controllers/resignationController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getResignations);

router.post(
  "/",
  authorize("Employee"),
  applyResignation
);

router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processResignation
);

router.patch(
  "/:id/withdraw",
  authorize("Employee"),
  withdrawResignation
);

router.patch(
  "/:id/complete",
  authorize("Super Admin", "HR Admin"),
  completeResignation
);

module.exports = router;