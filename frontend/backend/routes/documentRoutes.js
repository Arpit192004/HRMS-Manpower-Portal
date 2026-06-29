const express = require("express");

const {
  addEmployeeDocument,
  downloadAppointmentLetter,
  downloadOfferLetter,
  downloadPayslip,
  getEmployeeDocuments,
  getComplianceReport,
  updateDocumentVerification
} = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get(
  "/compliance",
  authorize("Super Admin", "HR Admin", "Client Approver", "Manager"),
  getComplianceReport
);

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
  authorize("Super Admin", "HR Admin", "Employee", "Client Approver", "Manager"),
  downloadAppointmentLetter
);

router
  .route("/employees/:employeeId")
  .get(
    authorize("Super Admin", "HR Admin", "Employee", "Client Approver", "Manager"),
    getEmployeeDocuments
  )
  .post(
    authorize("Super Admin", "HR Admin", "Employee"),
    addEmployeeDocument
  );

router.patch(
  "/employees/:employeeId/:documentId/verify",
  authorize("Super Admin", "HR Admin"),
  updateDocumentVerification
);

module.exports = router;
