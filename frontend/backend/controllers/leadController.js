const Lead = require("../models/Lead");
const Client = require("../models/Client");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const createAuditLog = require("../utils/auditLog");
const createNotification = require("../utils/createNotification");
const validatePassword = require("../utils/validatePassword");

const createLead = async (req, res, next) => {
  try {
    const { name, company, email, phone, requirement } = req.body;

    if (!name || !company || !email || !phone || !requirement) {
      res.status(400);
      throw new Error("Name, company, email, phone and requirement are required");
    }

    const lead = await Lead.create({
      name,
      company,
      email,
      phone,
      requirement
    });

    await createNotification({
      title: "New website lead",
      message: `${company} submitted a manpower requirement.`,
      type: "Lead",
      link: "/admin/leads",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "Lead",
      entityId: lead._id
    });

    if (process.env.LEAD_NOTIFY_EMAIL) {
      await sendEmail({
        to: process.env.LEAD_NOTIFY_EMAIL,
        subject: `New manpower lead from ${company}`,
        text: `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nRequirement: ${requirement}`,
        html: `
          <h3>New manpower enquiry</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Requirement:</strong> ${requirement}</p>
        `
      });
    }

    res.status(201).json({
      success: true,
      message: "Requirement submitted successfully. Our team will contact you shortly.",
      lead
    });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    const oldData = lead.toObject();
    const { status, notes, assignedTo } = req.body;

    if (status !== undefined) lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    if (assignedTo !== undefined) lead.assignedTo = assignedTo || null;

    await lead.save();

    await createAuditLog({
      entityType: "Lead",
      entityId: lead._id,
      action: "Update",
      oldData,
      newData: lead.toObject(),
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: "Lead updated successfully",
      lead
    });
  } catch (error) {
    next(error);
  }
};

const buildClientCode = (company) => {
  const base = company
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase() || "CLNT";

  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
};

const buildTemporaryPassword = () => {
  return `Client${Math.floor(100000 + Math.random() * 900000)}A`;
};

const convertLeadToClient = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    if (lead.status === "Converted") {
      res.status(409);
      throw new Error("Lead is already converted");
    }

    const existingUser = await User.findOne({ email: lead.email.toLowerCase() });
    const existingClient = await Client.findOne({
      "contactPerson.email": lead.email.toLowerCase()
    });

    if (existingUser || existingClient) {
      res.status(409);
      throw new Error("A client or user already exists with this lead email");
    }

    let code = buildClientCode(lead.company);
    while (await Client.findOne({ code })) {
      code = buildClientCode(lead.company);
    }

    const client = await Client.create({
      name: lead.company,
      code,
      industry: req.body.industry || "Manpower Services",
      contactPerson: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone
      },
      address: {
        country: "India"
      },
      createdBy: req.user._id
    });

    const temporaryPassword = req.body.password || buildTemporaryPassword();
    const passwordError = validatePassword(temporaryPassword);

    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const clientUser = await User.create({
      name: lead.name,
      email: lead.email,
      password: temporaryPassword,
      role: "Client Approver",
      client: client._id
    });

    const oldData = lead.toObject();
    lead.status = "Converted";
    lead.notes = `${lead.notes || ""}\nConverted to client ${client.code}`.trim();
    await lead.save();

    await createAuditLog({
      entityType: "Lead",
      entityId: lead._id,
      action: "Status Change",
      oldData,
      newData: lead.toObject(),
      updatedBy: req.user._id
    });

    await createAuditLog({
      entityType: "Client",
      entityId: client._id,
      action: "Create",
      oldData: {},
      newData: client.toObject(),
      updatedBy: req.user._id
    });

    await createNotification({
      title: "Lead converted to client",
      message: `${lead.company} is now an active client.`,
      type: "Lead",
      link: "/admin/clients",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "Client",
      entityId: client._id
    });

    await sendEmail({
      to: clientUser.email,
      subject: "Your HRMS client portal is ready",
      text: `Hi ${clientUser.name}, your client portal has been created.\nLogin: ${clientUser.email}\nTemporary password: ${temporaryPassword}\nPlease login and reset your password.`,
      html: `
        <p>Hi ${clientUser.name},</p>
        <p>Your client portal has been created.</p>
        <p><strong>Login:</strong> ${clientUser.email}</p>
        <p><strong>Temporary password:</strong> ${temporaryPassword}</p>
        <p>Please login and reset your password.</p>
      `
    });

    res.json({
      success: true,
      message: "Lead converted to client successfully",
      client,
      user: {
        id: clientUser._id,
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  updateLead,
  convertLeadToClient
};
