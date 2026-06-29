const PDFDocument = require("pdfkit");

const Employee = require("../models/Employee");
const Offer = require("../models/Offer");
const Payroll = require("../models/Payroll");

const monthNames = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const streamPdf = (res, filename, build) => {
  const doc = new PDFDocument({ margin: 48, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  doc.pipe(res);
  build(doc);
  doc.end();
};

const drawHeader = (doc, title) => {
  doc
    .fontSize(20)
    .fillColor("#172033")
    .text("Niyukti", { align: "center" })
    .moveDown(0.35)
    .fontSize(13)
    .fillColor("#475569")
    .text(title, { align: "center" })
    .moveDown(1.4)
    .moveTo(48, doc.y)
    .lineTo(547, doc.y)
    .strokeColor("#dbe5f4")
    .stroke()
    .moveDown(1.2)
    .fillColor("#172033");
};

const drawRow = (doc, label, value) => {
  const y = doc.y;
  doc.font("Helvetica-Bold").text(label, 48, y, { width: 180 });
  doc.font("Helvetica").text(value || "-", 235, y, { width: 310 });
  doc.moveDown(0.7);
};

const drawComponentTable = (doc, title, rows = []) => {
  doc.moveDown(0.7).font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.4);

  rows.forEach((row) => {
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(row.name, 65, doc.y, { width: 260, continued: true })
      .text(`Rs. ${Number(row.amount || 0).toFixed(2)}`, { align: "right" });
  });
};

const ensureEmployeeAccess = async (req, employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate("user", "name email")
    .populate("client", "name code")
    .populate("offer");

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    req.user.role === "Employee" &&
    employee.user._id.toString() !== req.user._id.toString()
  ) {
    const error = new Error("You cannot access this employee document");
    error.statusCode = 403;
    throw error;
  }

  if (
    ["Client Approver", "Manager"].includes(req.user.role) &&
    employee.client._id.toString() !== req.user.client?.toString()
  ) {
    const error = new Error("You cannot access this client employee document");
    error.statusCode = 403;
    throw error;
  }

  return employee;
};

const downloadPayslip = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: "employee",
        populate: [
          { path: "user", select: "name email" },
          { path: "client", select: "name code" }
        ]
      })
      .populate("client", "name code");

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    await ensureEmployeeAccess(req, payroll.employee._id);

    streamPdf(
      res,
      `payslip-${payroll.employee.employeeCode}-${payroll.month}-${payroll.year}.pdf`,
      (doc) => {
        drawHeader(doc, "Salary Slip");
        drawRow(doc, "Employee Name", payroll.employee.user?.name);
        drawRow(doc, "Employee Code", payroll.employee.employeeCode);
        drawRow(doc, "Designation", payroll.employee.designation);
        drawRow(doc, "Department", payroll.employee.department);
        drawRow(doc, "Client", payroll.client?.name);
        drawRow(doc, "Payroll Month", `${monthNames[payroll.month]} ${payroll.year}`);
        drawRow(doc, "Payable Days", String(payroll.payableDays));
        drawRow(doc, "Status", payroll.status);

        drawComponentTable(doc, "Earnings", payroll.earnings);
        drawComponentTable(doc, "Deductions", payroll.deductions);

        doc.moveDown(1);
        drawRow(doc, "Gross Salary", `Rs. ${payroll.grossSalary.toFixed(2)}`);
        drawRow(doc, "Attendance Deduction", `Rs. ${payroll.attendanceDeduction.toFixed(2)}`);
        drawRow(doc, "Total Deductions", `Rs. ${payroll.totalDeductions.toFixed(2)}`);
        doc
          .moveDown(0.5)
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(`Net Salary: Rs. ${payroll.netSalary.toFixed(2)}`, { align: "right" });

        doc
          .moveDown(2)
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#64748b")
          .text("This is a system-generated salary slip.", { align: "center" });
      }
    );
  } catch (error) {
    next(error);
  }
};

const downloadOfferLetter = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name email" }
      })
      .populate("client", "name code")
      .populate("job", "title department");

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (
      req.user.role === "Candidate" &&
      offer.candidate.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You cannot access this offer letter");
    }

    streamPdf(res, `offer-letter-${offer._id}.pdf`, (doc) => {
      drawHeader(doc, "Offer Letter");
      doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
      doc.moveDown(1);
      doc.text(`Dear ${offer.candidate.user?.name || "Candidate"},`);
      doc.moveDown(1);
      doc.text(
        `We are pleased to offer you the position of ${offer.designation} for ${offer.client?.name || "our client"}. Your joining date is ${new Date(offer.joiningDate).toLocaleDateString()}.`
      );
      doc.moveDown(1);
      drawRow(doc, "Job", offer.job?.title);
      drawRow(doc, "Department", offer.job?.department);
      drawRow(doc, "CTC", `Rs. ${Number(offer.ctc || 0).toFixed(2)}`);
      drawRow(doc, "Net Monthly Salary", `Rs. ${Number(offer.netSalary || 0).toFixed(2)}`);

      drawComponentTable(doc, "Salary Earnings", offer.earnings);
      drawComponentTable(doc, "Salary Deductions", offer.deductions);

      doc.moveDown(1);
      doc.text(
        "This offer is subject to successful verification of documents and completion of joining formalities."
      );
      doc.moveDown(2);
      doc.font("Helvetica-Bold").text("Authorized Signatory");
      doc.text("Niyukti");
    });
  } catch (error) {
    next(error);
  }
};

const downloadAppointmentLetter = async (req, res, next) => {
  try {
    const employee = await ensureEmployeeAccess(req, req.params.id);

    streamPdf(res, `appointment-letter-${employee.employeeCode}.pdf`, (doc) => {
      drawHeader(doc, "Appointment Letter");
      doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
      doc.moveDown(1);
      doc.text(`Dear ${employee.user?.name || "Employee"},`);
      doc.moveDown(1);
      doc.text(
        `This confirms your appointment as ${employee.designation} in the ${employee.department} department for ${employee.client?.name || "our client"}.`
      );
      doc.moveDown(1);
      drawRow(doc, "Employee Code", employee.employeeCode);
      drawRow(doc, "Grade", employee.grade);
      drawRow(doc, "Joining Date", new Date(employee.joiningDate).toLocaleDateString());
      drawRow(doc, "Roster", employee.roster);
      drawRow(doc, "Status", employee.status);
      doc.moveDown(1);
      doc.text(
        "You are expected to follow all company policies, attendance requirements, confidentiality obligations and assigned responsibilities."
      );
      doc.moveDown(2);
      doc.font("Helvetica-Bold").text("Authorized Signatory");
      doc.text("Niyukti");
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeDocuments = async (req, res, next) => {
  try {
    const employee = await ensureEmployeeAccess(req, req.params.employeeId);

    res.json({
      success: true,
      count: employee.documents.length,
      documents: employee.documents
    });
  } catch (error) {
    next(error);
  }
};

const addEmployeeDocument = async (req, res, next) => {
  try {
    const { type, title, url, expiryDate } = req.body;

    if (!type || !title || !url) {
      res.status(400);
      throw new Error("Document type, title and URL are required");
    }

    const employee = await ensureEmployeeAccess(req, req.params.employeeId);

    employee.documents.push({
      type,
      title,
      url,
      uploadedBy: req.user._id,
      expiryDate: expiryDate || undefined
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee document added successfully",
      documents: employee.documents
    });
  } catch (error) {
    next(error);
  }
};

const getComplianceReport = async (req, res, next) => {
  try {
    const filter = {};

    if (["Client Approver", "Manager"].includes(req.user.role)) {
      filter.client = req.user.client;
    } else if (req.query.client) {
      filter.client = req.query.client;
    }

    const employees = await Employee.find(filter)
      .populate("user", "name email")
      .populate("client", "name code")
      .populate("documents.uploadedBy", "name email")
      .populate("documents.verifiedBy", "name email")
      .sort({ createdAt: -1 });

    const today = new Date();
    const rows = employees.map((employee) => {
      const documents = employee.documents.map((document) => {
        const doc = document.toObject();
        const isExpired =
          doc.expiryDate &&
          new Date(doc.expiryDate) < today &&
          doc.verificationStatus !== "Rejected";

        return {
          ...doc,
          effectiveStatus: isExpired ? "Expired" : doc.verificationStatus
        };
      });

      const total = documents.length;
      const verified = documents.filter((doc) => doc.effectiveStatus === "Verified").length;
      const pending = documents.filter((doc) => doc.effectiveStatus === "Pending").length;
      const rejected = documents.filter((doc) => doc.effectiveStatus === "Rejected").length;
      const expired = documents.filter((doc) => doc.effectiveStatus === "Expired").length;

      return {
        employee: {
          id: employee._id,
          employeeCode: employee.employeeCode,
          name: employee.user?.name,
          email: employee.user?.email,
          designation: employee.designation,
          client: employee.client
        },
        score: total ? Math.round((verified / total) * 100) : 0,
        total,
        verified,
        pending,
        rejected,
        expired,
        documents
      };
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.totalDocuments += row.total;
        acc.verified += row.verified;
        acc.pending += row.pending;
        acc.rejected += row.rejected;
        acc.expired += row.expired;
        return acc;
      },
      { totalDocuments: 0, verified: 0, pending: 0, rejected: 0, expired: 0 }
    );

    summary.score = summary.totalDocuments
      ? Math.round((summary.verified / summary.totalDocuments) * 100)
      : 0;

    res.json({
      success: true,
      summary,
      employees: rows
    });
  } catch (error) {
    next(error);
  }
};

const updateDocumentVerification = async (req, res, next) => {
  try {
    const { status, remarks, expiryDate } = req.body;

    if (!["Pending", "Verified", "Rejected", "Expired"].includes(status)) {
      res.status(400);
      throw new Error("Invalid verification status");
    }

    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    const document = employee.documents.id(req.params.documentId);

    if (!document) {
      res.status(404);
      throw new Error("Document not found");
    }

    document.verificationStatus = status;
    document.verificationRemarks = remarks || "";
    document.expiryDate = expiryDate || document.expiryDate;
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: "Document verification updated successfully",
      document
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadPayslip,
  downloadOfferLetter,
  downloadAppointmentLetter,
  getEmployeeDocuments,
  addEmployeeDocument,
  getComplianceReport,
  updateDocumentVerification
};
