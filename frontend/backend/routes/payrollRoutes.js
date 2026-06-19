const express = require("express");

const {
  getPayrolls,
  getPayrollById,
  generatePayroll,
  confirmPayroll,
  markPayrollPaid,
  downloadBankSheet
} = require("../controllers/payrollController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize("Super Admin", "HR Admin", "Payroll Team", "Employee"),
  getPayrolls
);

router.get(
  "/bank-sheet",
  authorize("Super Admin", "Payroll Team"),
  downloadBankSheet
);

router.post(
  "/generate",
  authorize("Super Admin", "Payroll Team"),
  generatePayroll
);

router.patch(
  "/:id/confirm",
  authorize("Super Admin", "Payroll Team"),
  confirmPayroll
);

router.patch(
  "/:id/paid",
  authorize("Super Admin", "Payroll Team"),
  markPayrollPaid
);

router.get(
  "/:id",
  authorize("Super Admin", "HR Admin", "Payroll Team", "Employee"),
  getPayrollById
);

module.exports = router;