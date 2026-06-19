const express = require("express");

const {
  addEmployeeDocument,
  downloadAppointmentLetter,
  downloadOfferLetter,
  downloadPayslip,
  getEmployeeDocuments
} = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get(
  "/payslip/:id",
  authorize("Super Admin", "HR Admin", "Payroll Team", "Employee"),
  downloadPayslip
);

router.get(
  "/offer/:id",
  authorize("Super Admin", "HR Admin", "Candidate"),
  downloadOfferLetter
);

router.get(
  "/appointment/:id",
  authorize("Super Admin", "HR Admin", "Employee", "Client Approver"),
  downloadAppointmentLetter
);

router
  .route("/employees/:employeeId")
  .get(
    authorize("Super Admin", "HR Admin", "Employee", "Client Approver"),
    getEmployeeDocuments
  )
  .post(
    authorize("Super Admin", "HR Admin", "Employee"),
    addEmployeeDocument
  );

module.exports = router;
