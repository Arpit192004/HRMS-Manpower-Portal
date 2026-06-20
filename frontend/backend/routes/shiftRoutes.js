const express = require("express");

const {
  getShifts,
  createShift,
  updateShift,
  assignShiftToEmployee,
  getAttendanceHealth
} = require("../controllers/shiftController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver", "Payroll Team"),
  getShifts
);

router.get(
  "/attendance-health",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver", "Payroll Team"),
  getAttendanceHealth
);

router.post(
  "/",
  authorize("Super Admin", "HR Admin", "Manager"),
  createShift
);

router.patch(
  "/:id",
  authorize("Super Admin", "HR Admin", "Manager"),
  updateShift
);

router.patch(
  "/:id/assign/:employeeId",
  authorize("Super Admin", "HR Admin", "Manager"),
  assignShiftToEmployee
);

module.exports = router;
