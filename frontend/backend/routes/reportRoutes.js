const express = require("express");

const {
  getDashboardReport,
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getHiringReport
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(
  authorize("Super Admin", "HR Admin", "Payroll Team", "Manager")
);

router.get("/dashboard", getDashboardReport);
router.get("/employees", getEmployeeReport);
router.get("/leaves", getLeaveReport);
router.get("/attendance", getAttendanceReport);
router.get("/payroll", getPayrollReport);
router.get("/hiring", getHiringReport);

module.exports = router;