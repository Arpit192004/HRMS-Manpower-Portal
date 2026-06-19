const Lead = require("../models/Lead");
const sendEmail = require("../utils/sendEmail");
const createAuditLog = require("../utils/auditLog");

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

module.exports = {
  createLead,
  getLeads,
  updateLead
};
