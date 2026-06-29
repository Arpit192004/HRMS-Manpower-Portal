const Attendance = require("../models/Attendance");
const Candidate = require("../models/Candidate");
const ClientRequirement = require("../models/ClientRequirement");
const Employee = require("../models/Employee");
const Invoice = require("../models/Invoice");
const Payroll = require("../models/Payroll");
const Workflow = require("../models/Workflow");

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const getClientFilter = (req) => {
  if (["Client Approver", "Manager"].includes(req.user.role)) {
    return { client: req.user.client };
  }

  return req.query.client ? { client: req.query.client } : {};
};

const buildInsightContext = async (req) => {
  const clientFilter = getClientFilter(req);
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [
    employees,
    candidates,
    joined,
    pendingApprovals,
    overdueApprovals,
    outstandingInvoices,
    overdueInvoices,
    openRequirements,
    attendance,
    payroll,
    missingDocs
  ] = await Promise.all([
    Employee.countDocuments({ ...clientFilter, status: "Active" }),
    Candidate.countDocuments(clientFilter),
    Candidate.countDocuments({ ...clientFilter, status: "Joined" }),
    Workflow.countDocuments({ ...clientFilter, status: "Pending" }),
    Workflow.countDocuments({
      ...clientFilter,
      status: "Pending",
      dueAt: { $lt: today }
    }),
    Invoice.aggregate([
      {
        $match: {
          ...clientFilter,
          status: { $nin: ["Paid", "Cancelled"] }
        }
      },
      { $group: { _id: null, amount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]),
    Invoice.countDocuments({
      ...clientFilter,
      status: { $nin: ["Paid", "Cancelled"] },
      dueDate: { $lt: today }
    }),
    ClientRequirement.countDocuments({
      ...clientFilter,
      status: { $in: ["Open", "In Progress"] }
    }),
    Attendance.aggregate([
      {
        $match: {
          ...clientFilter,
          date: { $gte: dayStart, $lte: dayEnd }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          late: { $sum: { $cond: [{ $gt: ["$lateMinutes", 0] }, 1, 0] } },
          overtime: { $sum: { $cond: [{ $gt: ["$overtimeMinutes", 0] }, 1, 0] } }
        }
      }
    ]),
    Payroll.aggregate([
      {
        $match: {
          ...clientFilter,
          year: today.getFullYear(),
          month: today.getMonth() + 1
        }
      },
      {
        $group: {
          _id: null,
          netSalary: { $sum: "$netSalary" },
          grossSalary: { $sum: "$grossSalary" },
          headcount: { $sum: 1 }
        }
      }
    ]),
    Employee.countDocuments({
      ...clientFilter,
      status: "Active",
      $or: [
        { documents: { $exists: false } },
        { documents: { $size: 0 } },
        { "documents.verificationStatus": { $in: ["Pending", "Rejected", "Expired"] } }
      ]
    })
  ]);

  const attendanceSummary = attendance.reduce(
    (acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      acc.late += item.late || 0;
      acc.overtime += item.overtime || 0;
      return acc;
    },
    { late: 0, overtime: 0 }
  );

  return {
    employees,
    candidates,
    joined,
    pendingApprovals,
    overdueApprovals,
    outstandingInvoices: outstandingInvoices[0] || { amount: 0, count: 0 },
    overdueInvoices,
    openRequirements,
    attendance: attendanceSummary,
    payroll: payroll[0] || { netSalary: 0, grossSalary: 0, headcount: 0 },
    missingDocs
  };
};

const answerQuestion = (question, context, role) => {
  const q = question.toLowerCase();

  if (q.includes("invoice") || q.includes("payment") || q.includes("revenue")) {
    return {
      title: "Invoice and revenue snapshot",
      answer: `There are ${context.outstandingInvoices.count} outstanding invoices worth ${currency(
        context.outstandingInvoices.amount
      )}. ${context.overdueInvoices} invoices are overdue.`,
      actions: [
        { label: ["Client Approver", "Manager"].includes(role) ? "Open Manager Invoices" : "Open Invoices", path: ["Client Approver", "Manager"].includes(role) ? "/client/invoices" : "/admin/invoices" }
      ]
    };
  }

  if (q.includes("approval") || q.includes("pending") || q.includes("overdue")) {
    return {
      title: "Approval workload",
      answer: `There are ${context.pendingApprovals} pending approvals. ${context.overdueApprovals} are overdue against SLA.`,
      actions: [
        { label: "Open Approval Center", path: "/admin/approvals" }
      ]
    };
  }

  if (q.includes("attendance") || q.includes("late") || q.includes("overtime") || q.includes("absent")) {
    return {
      title: "Attendance health today",
      answer: `Today attendance has ${context.attendance.Present || 0} present, ${
        context.attendance.Absent || 0
      } absent, ${context.attendance.late || 0} late arrivals and ${
        context.attendance.overtime || 0
      } overtime cases.`,
      actions: [
        { label: ["Client Approver", "Manager"].includes(role) ? "Open Attendance Health" : "Open Shift Roster", path: ["Client Approver", "Manager"].includes(role) ? "/client/attendance-health" : "/admin/shifts" }
      ]
    };
  }

  if (q.includes("candidate") || q.includes("hiring") || q.includes("joined")) {
    return {
      title: "Hiring pipeline",
      answer: `There are ${context.candidates} candidates in the pipeline and ${context.joined} joined candidates. Open requirements: ${context.openRequirements}.`,
      actions: [
        { label: ["Client Approver", "Manager"].includes(role) ? "Open Candidates" : "Open Pipeline", path: ["Client Approver", "Manager"].includes(role) ? "/client/candidates" : "/admin/pipeline" }
      ]
    };
  }

  if (q.includes("payroll") || q.includes("salary") || q.includes("cost")) {
    return {
      title: "Payroll cost",
      answer: `This month's payroll covers ${context.payroll.headcount} records with net salary ${currency(
        context.payroll.netSalary
      )} and gross salary ${currency(context.payroll.grossSalary)}.`,
      actions: [
        { label: "Open Analytics", path: ["Client Approver", "Manager"].includes(role) ? "/client/analytics" : "/admin/analytics" }
      ]
    };
  }

  if (q.includes("document") || q.includes("compliance") || q.includes("missing")) {
    return {
      title: "Document compliance",
      answer: `${context.missingDocs} active employees have missing, pending, rejected or expired documents.`,
      actions: [
        { label: "Open Compliance", path: ["Client Approver", "Manager"].includes(role) ? "/client/compliance" : "/admin/compliance" }
      ]
    };
  }

  return {
    title: "HRMS business snapshot",
    answer: `Current snapshot: ${context.employees} active employees, ${context.candidates} candidates, ${context.pendingApprovals} pending approvals, ${context.openRequirements} open requirements and ${currency(
      context.outstandingInvoices.amount
    )} outstanding invoices.`,
    actions: [
      { label: "Open Executive Analytics", path: ["Client Approver", "Manager"].includes(role) ? "/client/analytics" : "/admin/analytics" }
    ]
  };
};

const askCopilot = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question) {
      res.status(400);
      throw new Error("Question is required");
    }

    const context = await buildInsightContext(req);
    const response = answerQuestion(question, context, req.user.role);

    res.json({
      success: true,
      question,
      response,
      context
    });
  } catch (error) {
    next(error);
  }
};

const getCopilotSuggestions = async (req, res, next) => {
  try {
    const suggestions =
      ["Client Approver", "Manager"].includes(req.user.role)
        ? [
            "Summarize my attendance health today",
            "Do I have overdue invoices?",
            "How many candidates are in pipeline?",
            "Show compliance risks"
          ]
        : [
            "What needs attention today?",
            "Show overdue approvals",
            "Summarize attendance health today",
            "Which invoices are outstanding?",
            "How is the hiring pipeline performing?",
            "Show payroll cost this month",
            "Who has missing documents?"
          ];

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

module.exports = { askCopilot, getCopilotSuggestions };
