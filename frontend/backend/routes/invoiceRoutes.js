const express = require("express");
const {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  downloadInvoice
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", authorize("Super Admin", "HR Admin", "Payroll Team", "Client Approver", "Manager"), getInvoices);
router.post("/", authorize("Super Admin", "HR Admin", "Payroll Team"), createInvoice);
router.get("/:id/pdf", authorize("Super Admin", "HR Admin", "Payroll Team", "Client Approver", "Manager"), downloadInvoice);
router.patch("/:id/status", authorize("Super Admin", "HR Admin", "Payroll Team"), updateInvoiceStatus);

module.exports = router;
