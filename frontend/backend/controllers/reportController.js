const Client = require("../models/Client");
const Employee = require("../models/Employee");
const Candidate = require("../models/Candidate");
const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const ClientRequirement = require("../models/ClientRequirement");
const Invoice = require("../models/Invoice");
const Workflow = require("../models/Workflow");

const getClientScopedFilter = (req) => {
  const filter = {};

  if (req.user.role === "Client Approver") {
    filter.client = req.user.client;
  } else if (req.query.client) {
    filter.client = req.query.client;
  }

  return filter;
};

const getDashboardReport = async (req, res, next) => {
  try {
    const clientFilter = req.query.client
      ? { client: req.query.client }
      : {};

    const [
      totalClients,
      totalEmployees,
      totalCandidates,
      pendingLeaves,
      payrollSummary
    ] = await Promise.all([
      Client.countDocuments({ isActive: true }),
      Employee.countDocuments({ ...clientFilter, status: "Active" }),
      Candidate.countDocuments(clientFilter),
      LeaveRequest.countDocuments({
        ...clientFilter,
        status: "Pending"
      }),
      Payroll.aggregate([
        { $match: clientFilter },
        {
          $group: {
            _id: null,
            totalGrossSalary: { $sum: "$grossSalary" },
            totalNetSalary: { $sum: "$netSalary" }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      report: {
        totalClients,
        totalEmployees,
        totalCandidates,
        pendingLeaves,
        payrollSummary: payrollSummary[0] || {
          totalGrossSalary: 0,
          totalNetSalary: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    const employees = await Employee.find(filter)
      .populate("user", "name email")
      .populate("client", "name code")
      .sort({ employeeCode: 1 });

    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    next(error);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;

    const leaves = await LeaveRequest.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;

    if (req.query.fromDate || req.query.toDate) {
      filter.date = {};
      if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    next(error);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const payroll = await Payroll.find(filter)
      .populate("employee", "employeeCode designation")
      .populate("client", "name code");

    res.json({ success: true, count: payroll.length, payroll });
  } catch (error) {
    next(error);
  }
};

const getHiringReport = async (req, res, next) => {
  try {
    const match = {};
    if (req.query.client) match.client = req.query.client;

    const hiring = await Candidate.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, hiring });
  } catch (error) {
    next(error);
  }
};

const getSlaReport = async (req, res, next) => {
  try {
    const clientFilter = {};

    if (req.user.role === "Client Approver") {
      clientFilter.client = req.user.client;
    } else if (req.query.client) {
      clientFilter.client = req.query.client;
    }

    const [requirements, invoices] = await Promise.all([
      ClientRequirement.find(clientFilter)
        .populate("client", "name code")
        .populate("job", "title status")
        .sort({ createdAt: -1 }),
      Invoice.find(clientFilter)
        .populate("client", "name code")
        .sort({ dueDate: 1, createdAt: -1 })
    ]);

    const today = new Date();
    const requirementRows = await Promise.all(
      requirements.map(async (requirement) => {
        const candidateFilter = { client: requirement.client._id };

        if (requirement.job) {
          candidateFilter.job = requirement.job._id;
        }

        const [submitted, shortlisted, joined] = await Promise.all([
          Candidate.countDocuments(candidateFilter),
          Candidate.countDocuments({
            ...candidateFilter,
            status: { $in: ["Shortlisted", "Interview", "Pre-Offer", "Offered", "Joined"] }
          }),
          Candidate.countDocuments({
            ...candidateFilter,
            status: "Joined"
          })
        ]);

        const createdAt = new Date(requirement.createdAt);
        const requiredBy = new Date(requirement.requiredBy);
        const daysOpen = Math.max(0, Math.ceil((today - createdAt) / (1000 * 60 * 60 * 24)));
        const daysLeft = Math.ceil((requiredBy - today) / (1000 * 60 * 60 * 24));
        const pendingJoining = Math.max(0, requirement.vacancies - joined);

        let slaStatus = "On Track";
        if (["Rejected", "Closed", "Converted"].includes(requirement.status) && pendingJoining === 0) {
          slaStatus = "Closed";
        } else if (daysLeft < 0 && pendingJoining > 0) {
          slaStatus = "Delayed";
        } else if (daysLeft <= 3 && pendingJoining > 0) {
          slaStatus = "At Risk";
        }

        return {
          id: requirement._id,
          client: requirement.client,
          title: requirement.title,
          status: requirement.status,
          priority: requirement.priority,
          vacancies: requirement.vacancies,
          requiredBy,
          daysOpen,
          daysLeft,
          submitted,
          shortlisted,
          joined,
          pendingJoining,
          slaStatus
        };
      })
    );

    const invoiceRows = invoices.map((invoice) => {
      const isOutstanding = !["Paid", "Cancelled"].includes(invoice.status);
      const isOverdue =
        isOutstanding && invoice.dueDate && new Date(invoice.dueDate) < today;

      return {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        client: invoice.client,
        period: `${invoice.month}/${invoice.year}`,
        dueDate: invoice.dueDate,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        isOutstanding,
        isOverdue
      };
    });

    const summary = {
      totalRequirements: requirementRows.length,
      atRisk: requirementRows.filter((row) => row.slaStatus === "At Risk").length,
      delayed: requirementRows.filter((row) => row.slaStatus === "Delayed").length,
      joined: requirementRows.reduce((sum, row) => sum + row.joined, 0),
      outstandingAmount: invoiceRows
        .filter((row) => row.isOutstanding)
        .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
      overdueAmount: invoiceRows
        .filter((row) => row.isOverdue)
        .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
      overdueInvoices: invoiceRows.filter((row) => row.isOverdue).length
    };

    res.json({
      success: true,
      summary,
      requirements: requirementRows,
      invoices: invoiceRows
    });
  } catch (error) {
    next(error);
  }
};

const getExecutiveAnalytics = async (req, res, next) => {
  try {
    const clientFilter = getClientScopedFilter(req);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const [
      totalClients,
      activeEmployees,
      candidateFunnel,
      attendanceToday,
      payrollCost,
      invoiceRevenue,
      pendingApprovals,
      overdueApprovals,
      openRequirements,
      clientManpower,
      documentCompliance,
      monthlyHiringTrend,
      monthlyRevenueTrend
    ] = await Promise.all([
      Client.countDocuments({ isActive: true }),
      Employee.countDocuments({ ...clientFilter, status: "Active" }),
      Candidate.aggregate([
        { $match: clientFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
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
            grossSalary: { $sum: "$grossSalary" },
            netSalary: { $sum: "$netSalary" },
            headcount: { $sum: 1 }
          }
        }
      ]),
      Invoice.aggregate([
        { $match: clientFilter },
        {
          $group: {
            _id: "$status",
            amount: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ]),
      Workflow.countDocuments({ ...clientFilter, status: "Pending" }),
      Workflow.countDocuments({
        ...clientFilter,
        status: "Pending",
        dueAt: { $lt: today }
      }),
      ClientRequirement.countDocuments({
        ...clientFilter,
        status: { $in: ["Open", "In Progress"] }
      }),
      Employee.aggregate([
        { $match: { ...clientFilter, status: "Active" } },
        { $group: { _id: "$client", employees: { $sum: 1 } } },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client"
          }
        },
        { $unwind: "$client" },
        {
          $project: {
            _id: 0,
            clientId: "$client._id",
            name: "$client.name",
            code: "$client.code",
            employees: 1
          }
        },
        { $sort: { employees: -1 } },
        { $limit: 8 }
      ]),
      Employee.aggregate([
        { $match: { ...clientFilter, status: "Active" } },
        { $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$documents.verificationStatus",
            count: { $sum: 1 }
          }
        }
      ]),
      Candidate.aggregate([
        {
          $match: {
            ...clientFilter,
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1),
              $lte: monthEnd
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            candidates: { $sum: 1 },
            joined: { $sum: { $cond: [{ $eq: ["$status", "Joined"] }, 1, 0] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Invoice.aggregate([
        {
          $match: {
            ...clientFilter,
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1),
              $lte: monthEnd
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);

    const funnelMap = candidateFunnel.reduce((acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      return acc;
    }, {});

    const totalCandidates = Object.values(funnelMap).reduce((sum, value) => sum + value, 0);
    const shortlisted = [
      "Shortlisted",
      "Interview",
      "Pre-Offer",
      "Offered",
      "Joined",
      "Submitted to Client",
      "Client Shortlisted"
    ].reduce((sum, key) => sum + (funnelMap[key] || 0), 0);

    const attendanceSummary = attendanceToday.reduce(
      (acc, item) => {
        acc.byStatus[item._id || "Unknown"] = item.count;
        acc.late += item.late || 0;
        acc.overtime += item.overtime || 0;
        return acc;
      },
      { byStatus: {}, late: 0, overtime: 0 }
    );

    const invoiceSummary = invoiceRevenue.reduce(
      (acc, item) => {
        acc.byStatus[item._id || "Unknown"] = {
          amount: item.amount,
          count: item.count
        };
        acc.total += item.amount || 0;
        if (!["Paid", "Cancelled"].includes(item._id)) {
          acc.outstanding += item.amount || 0;
        }
        return acc;
      },
      { total: 0, outstanding: 0, byStatus: {} }
    );

    const complianceSummary = documentCompliance.reduce(
      (acc, item) => {
        const key = item._id || "Missing";
        acc[key] = item.count;
        return acc;
      },
      {}
    );

    const monthLabel = (item) =>
      `${String(item._id.month).padStart(2, "0")}/${String(item._id.year).slice(-2)}`;

    const hiringTrend = monthlyHiringTrend.map((item) => ({
      month: monthLabel(item),
      candidates: item.candidates,
      joined: item.joined
    }));

    const revenueTrend = monthlyRevenueTrend.map((item) => ({
      month: monthLabel(item),
      revenue: item.revenue
    }));

    res.json({
      success: true,
      analytics: {
        scope: req.user.role === "Client Approver" ? "Client" : "Admin",
        generatedAt: new Date(),
        kpis: {
          totalClients: req.user.role === "Client Approver" ? 1 : totalClients,
          activeEmployees,
          totalCandidates,
          openRequirements,
          pendingApprovals,
          overdueApprovals,
          payrollCost: payrollCost[0] || { grossSalary: 0, netSalary: 0, headcount: 0 },
          invoiceRevenue: invoiceSummary
        },
        hiringFunnel: [
          { label: "Applications", value: totalCandidates },
          { label: "Shortlisted+", value: shortlisted },
          { label: "Interviews", value: funnelMap.Interview || 0 },
          { label: "Offered", value: funnelMap.Offered || 0 },
          { label: "Joined", value: funnelMap.Joined || 0 }
        ],
        attendance: attendanceSummary,
        clientManpower,
        compliance: complianceSummary,
        trends: {
          hiring: hiringTrend,
          revenue: revenueTrend
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardReport,
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getHiringReport,
  getSlaReport,
  getExecutiveAnalytics
};
