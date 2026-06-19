const express = require("express");

const {
  getExpenseClaims,
  createExpenseClaim,
  processExpenseClaim,
  markClaimProcessed,
  cancelExpenseClaim
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getExpenseClaims);

router.post(
  "/",
  authorize("Employee"),
  createExpenseClaim
);

router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processExpenseClaim
);

router.patch(
  "/:id/pay",
  authorize("Super Admin", "Payroll Team"),
  markClaimProcessed
);

router.patch(
  "/:id/cancel",
  authorize("Employee"),
  cancelExpenseClaim
);

module.exports = router;