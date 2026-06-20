const ClientRequirement = require("../models/ClientRequirement");
const Job = require("../models/Job");
const createAuditLog = require("../utils/auditLog");
const createNotification = require("../utils/createNotification");

const getRequirements = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "Client Approver") {
      filter.client = req.user.client;
    } else if (req.query.client) {
      filter.client = req.query.client;
    }

    if (req.query.status) filter.status = req.query.status;

    const requirements = await ClientRequirement.find(filter)
      .populate("client", "name code")
      .populate("job", "title status")
      .populate("requestedBy", "name email role")
      .populate("processedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requirements.length, requirements });
  } catch (error) {
    next(error);
  }
};

const createRequirement = async (req, res, next) => {
  try {
    const client = req.user.role === "Client Approver" ? req.user.client : req.body.client;
    const {
      title,
      department,
      location,
      vacancies,
      requiredBy,
      budgetMin,
      budgetMax,
      experienceMin,
      experienceMax,
      skills,
      description,
      priority
    } = req.body;

    if (!client || !title || !department || !location || !vacancies || !requiredBy || !description) {
      res.status(400);
      throw new Error("Client, title, department, location, vacancies, required by and description are required");
    }

    const requirement = await ClientRequirement.create({
      client,
      title,
      department,
      location,
      vacancies,
      requiredBy,
      budgetMin,
      budgetMax,
      experienceMin,
      experienceMax,
      skills: Array.isArray(skills) ? skills : String(skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
      description,
      priority,
      requestedBy: req.user._id
    });

    await createNotification({
      title: "New client requirement",
      message: `${title} requirement submitted for ${vacancies} opening(s).`,
      type: "Lead",
      link: "/admin/requirements",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "ClientRequirement",
      entityId: requirement._id
    });

    res.status(201).json({
      success: true,
      message: "Requirement submitted successfully",
      requirement
    });
  } catch (error) {
    next(error);
  }
};

const updateRequirement = async (req, res, next) => {
  try {
    const requirement = await ClientRequirement.findById(req.params.id);

    if (!requirement) {
      res.status(404);
      throw new Error("Requirement not found");
    }

    if (
      req.user.role === "Client Approver" &&
      requirement.client.toString() !== req.user.client?.toString()
    ) {
      res.status(403);
      throw new Error("You cannot update another client's requirement");
    }

    const oldData = requirement.toObject();
    const allowedFields =
      req.user.role === "Client Approver"
        ? ["title", "department", "location", "vacancies", "requiredBy", "budgetMin", "budgetMax", "experienceMin", "experienceMax", "skills", "description", "priority"]
        : ["status", "remarks", "priority"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        requirement[field] =
          field === "skills" && !Array.isArray(req.body[field])
            ? String(req.body[field]).split(",").map((skill) => skill.trim()).filter(Boolean)
            : req.body[field];
      }
    });

    requirement.processedBy = req.user._id;
    requirement.processedAt = new Date();
    await requirement.save();

    await createAuditLog({
      entityType: "ClientRequirement",
      entityId: requirement._id,
      action: "Update",
      oldData,
      newData: requirement.toObject(),
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: "Requirement updated successfully",
      requirement
    });
  } catch (error) {
    next(error);
  }
};

const convertRequirementToJob = async (req, res, next) => {
  try {
    const requirement = await ClientRequirement.findById(req.params.id);

    if (!requirement) {
      res.status(404);
      throw new Error("Requirement not found");
    }

    if (requirement.job) {
      res.status(409);
      throw new Error("Requirement is already converted to a job");
    }

    const oldData = requirement.toObject();
    const job = await Job.create({
      client: requirement.client,
      title: requirement.title,
      department: requirement.department,
      grade: req.body.grade || "General",
      vacancies: requirement.vacancies,
      salaryRange: {
        minimum: Number(requirement.budgetMin || 0),
        maximum: Number(requirement.budgetMax || 0)
      },
      experience: {
        minimum: Number(requirement.experienceMin || 0),
        maximum: Number(requirement.experienceMax || 0)
      },
      skills: requirement.skills,
      description: requirement.description,
      location: requirement.location,
      status: "Open",
      createdBy: req.user._id
    });

    requirement.status = "Converted";
    requirement.job = job._id;
    requirement.processedBy = req.user._id;
    requirement.processedAt = new Date();
    await requirement.save();

    await createAuditLog({
      entityType: "ClientRequirement",
      entityId: requirement._id,
      action: "Status Change",
      oldData,
      newData: requirement.toObject(),
      updatedBy: req.user._id
    });

    await createNotification({
      title: "Requirement converted to job",
      message: `${requirement.title} is now open for candidate applications.`,
      type: "Hiring",
      link: "/admin/jobs",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "Job",
      entityId: job._id
    });

    res.json({
      success: true,
      message: "Requirement converted to open job successfully",
      job,
      requirement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRequirements,
  createRequirement,
  updateRequirement,
  convertRequirementToJob
};
