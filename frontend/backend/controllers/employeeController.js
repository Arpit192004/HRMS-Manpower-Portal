const Employee = require("../models/Employee");
const Offer = require("../models/Offer");
const Candidate = require("../models/Candidate");
const Client = require("../models/Client");
const User = require("../models/User");

const generateEmployeeCode = async (clientId) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  const count = await Employee.countDocuments({ client: clientId });

  return `${client.code}-EMP-${String(count + 1).padStart(4, "0")}`;
};

const getEmployees = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.grade) filter.grade = req.query.grade;

    if (req.user.role === "Employee") {
      filter.user = req.user._id;
    }

    if (req.user.role === "Client Approver") {
      filter.client = req.user.client;
    }

    const employees = await Employee.find(filter)
      .populate("user", "name email role")
      .populate("client", "name code")
      .populate("attendancePolicy", "name type grade")
      .populate("leavePolicy", "name type grade")
      .populate("approvers", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("user", "name email role")
      .populate("client", "name code")
      .populate("offer")
      .populate("attendancePolicy", "name type grade")
      .populate("leavePolicy", "name type grade")
      .populate("approvers", "name email role");

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    if (
      req.user.role === "Employee" &&
      employee.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You cannot view this employee record");
    }

    res.json({ success: true, employee });
  } catch (error) {
    next(error);
  }
};

const createEmployeeFromOffer = async (req, res, next) => {
  try {
    const {
      offer: offerId,
      department,
      grade,
      personalDetails,
      bankDetails,
      dependents,
      previousCompanies,
      qualifications,
      roster,
      attendancePolicy,
      leavePolicy,
      approvers
    } = req.body;

    if (!offerId || !department || !grade) {
      res.status(400);
      throw new Error("Offer, department and grade are required");
    }

    const offer = await Offer.findById(offerId).populate("candidate");

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (offer.status !== "Accepted") {
      res.status(400);
      throw new Error("Only accepted offers can be converted to employees");
    }

    const existingEmployee = await Employee.findOne({ offer: offerId });

    if (existingEmployee) {
      res.status(409);
      throw new Error("Employee already created from this offer");
    }

    const candidate = await Candidate.findById(offer.candidate._id);

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate record not found");
    }

    const employeeCode = await generateEmployeeCode(offer.client);

    const employee = await Employee.create({
      employeeCode,
      user: candidate.user,
      client: offer.client,
      offer: offer._id,
      designation: offer.designation,
      department,
      grade,
      joiningDate: offer.joiningDate,
      personalDetails,
      bankDetails,
      dependents,
      previousCompanies,
      qualifications,
      roster,
      attendancePolicy: attendancePolicy || null,
      leavePolicy: leavePolicy || null,
      approvers: approvers || [],
      createdBy: req.user._id
    });

    candidate.status = "Joined";
    await candidate.save();

    await User.findByIdAndUpdate(candidate.user, {
      role: "Employee",
      client: offer.client
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const protectedFields = [
      "employeeCode",
      "user",
      "client",
      "offer",
      "createdBy"
    ];

    protectedFields.forEach((field) => delete req.body[field]);

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    res.json({
      success: true,
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive", "Resigned", "Terminated"].includes(status)) {
      res.status(400);
      throw new Error("Invalid employee status");
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    employee.status = status;
    await employee.save();

    await User.findByIdAndUpdate(employee.user, {
      isActive: status === "Active"
    });

    res.json({
      success: true,
      message: "Employee status updated successfully",
      employee
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployeeFromOffer,
  updateEmployee,
  updateEmployeeStatus
};
