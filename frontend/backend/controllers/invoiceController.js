const PDFDocument = require("pdfkit");

const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const Employee = require("../models/Employee");
const createAuditLog = require("../utils/auditLog");
const createNotification = require("../utils/createNotification");

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

const generateInvoiceNumber = () => {
  const date = new Date();
  return `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${Date.now().toString().slice(-5)}`;
};

const calculateTotals = (items, taxRate = 18) => {
  const mappedItems = items.map((item) => {
    const quantity = Number(item.quantity || 1);
    const rate = Number(item.rate || 0);
    return {
      description: item.description,
      quantity,
      rate,
      amount: quantity * rate
    };
  });

  const subTotal = mappedItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subTotal * Number(taxRate || 0)) / 100;

  return {
    items: mappedItems,
    subTotal,
    taxAmount,
    totalAmount: subTotal + taxAmount
  };
};

const getInvoices = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "Client Approver") {
      filter.client = req.user.client;
    } else if (req.query.client) {
      filter.client = req.query.client;
    }

    const invoices = await Invoice.find(filter)
      .populate("client", "name code contactPerson")
      .populate("generatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { client, month, year, dueDate, items, taxRate, notes } = req.body;

    if (!client || !month || !year) {
      res.status(400);
      throw new Error("Client, month and year are required");
    }

    const clientExists = await Client.findById(client);

    if (!clientExists) {
      res.status(404);
      throw new Error("Client not found");
    }

    let invoiceItems = items;

    if (!invoiceItems || invoiceItems.length === 0) {
      const activeEmployees = await Employee.countDocuments({ client, status: "Active" });
      invoiceItems = [
        {
          description: `Manpower service charges for ${monthNames[Number(month)]} ${year}`,
          quantity: Math.max(activeEmployees, 1),
          rate: Number(req.body.defaultRate || 15000)
        }
      ];
    }

    const totals = calculateTotals(invoiceItems, taxRate ?? 18);
    let invoiceNumber = generateInvoiceNumber();

    while (await Invoice.findOne({ invoiceNumber })) {
      invoiceNumber = generateInvoiceNumber();
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      client,
      month,
      year,
      dueDate,
      items: totals.items,
      subTotal: totals.subTotal,
      taxRate: taxRate ?? 18,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes,
      generatedBy: req.user._id
    });

    await createAuditLog({
      entityType: "Invoice",
      entityId: invoice._id,
      action: "Create",
      oldData: {},
      newData: invoice.toObject(),
      updatedBy: req.user._id
    });

    await createNotification({
      title: "Invoice generated",
      message: `${invoice.invoiceNumber} generated for ${clientExists.name}.`,
      type: "Payroll",
      link: "/admin/invoices",
      audienceRoles: ["Super Admin", "HR Admin", "Payroll Team"],
      entityType: "Invoice",
      entityId: invoice._id
    });

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      invoice
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Draft", "Sent", "Paid", "Cancelled"].includes(status)) {
      res.status(400);
      throw new Error("Invalid invoice status");
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const oldData = invoice.toObject();
    invoice.status = status;
    await invoice.save();

    await createAuditLog({
      entityType: "Invoice",
      entityId: invoice._id,
      action: "Status Change",
      oldData,
      newData: invoice.toObject(),
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: "Invoice status updated successfully",
      invoice
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "name code contactPerson address gstNumber")
      .populate("generatedBy", "name email");

    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    if (
      req.user.role === "Client Approver" &&
      invoice.client._id.toString() !== req.user.client?.toString()
    ) {
      res.status(403);
      throw new Error("You cannot access this invoice");
    }

    const doc = new PDFDocument({ margin: 48, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);
    doc.fontSize(22).fillColor("#172033").text("Niyukti", { align: "center" });
    doc.fontSize(14).fillColor("#475569").text("Tax Invoice", { align: "center" });
    doc.moveDown(1.4).fillColor("#172033");

    doc.font("Helvetica-Bold").text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.font("Helvetica").text(`Billing Period: ${monthNames[invoice.month]} ${invoice.year}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}`);
    doc.moveDown(1);

    doc.font("Helvetica-Bold").text("Bill To");
    doc.font("Helvetica").text(invoice.client?.name || "-");
    doc.text(invoice.client?.contactPerson?.email || "-");
    doc.text(invoice.client?.contactPerson?.phone || "-");
    doc.moveDown(1);

    doc.font("Helvetica-Bold").text("Items");
    doc.moveDown(0.5);
    invoice.items.forEach((item, index) => {
      doc
        .font("Helvetica")
        .text(`${index + 1}. ${item.description}`, { continued: true })
        .text(`Rs. ${Number(item.amount || 0).toFixed(2)}`, { align: "right" });
      doc.fontSize(9).fillColor("#64748b").text(`Qty: ${item.quantity} | Rate: Rs. ${item.rate}`);
      doc.fillColor("#172033").fontSize(11).moveDown(0.3);
    });

    doc.moveDown(1);
    doc.font("Helvetica-Bold").text(`Subtotal: Rs. ${invoice.subTotal.toFixed(2)}`, { align: "right" });
    doc.text(`GST (${invoice.taxRate}%): Rs. ${invoice.taxAmount.toFixed(2)}`, { align: "right" });
    doc.fontSize(15).text(`Total: Rs. ${invoice.totalAmount.toFixed(2)}`, { align: "right" });

    if (invoice.notes) {
      doc.moveDown(1).font("Helvetica").fontSize(10).text(`Notes: ${invoice.notes}`);
    }

    doc.moveDown(2).fontSize(9).fillColor("#64748b").text("This is a system-generated invoice.", { align: "center" });
    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  downloadInvoice
};
