const express = require("express");

const {
  getAttendance,
  markAttendance,
  manuallyUpdateAttendance,
  uploadAttendanceSheet
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize(
    "Super Admin",
    "HR Admin",
    "Manager",
    "Client Approver",
    "Payroll Team",
    "Employee"
  ),
  getAttendance
);

router.post(
  "/mark",
  authorize("Employee"),
  markAttendance
);

router.post(
  "/upload-sheet",
  authorize("Employee"),
  uploadAttendanceSheet
);

router.put(
  "/manual",
  authorize("Super Admin", "HR Admin", "Payroll Team"),
  manuallyUpdateAttendance
);

module.exports = router;