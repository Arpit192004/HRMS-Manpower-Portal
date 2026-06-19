const Job = require("../models/Job");
const Client = require("../models/Client");

const getJobs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;

    const jobs = await Job.find(filter)
      .populate("client", "name code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("client", "name code")
      .populate("createdBy", "name email");

    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const {
      client,
      title,
      department,
      grade,
      vacancies,
      salaryRange,
      experience,
      description,
      location
    } = req.body;

    if (
      !client ||
      !title ||
      !department ||
      !grade ||
      !vacancies ||
      !salaryRange ||
      !experience ||
      !description ||
      !location
    ) {
      res.status(400);
      throw new Error("Please provide all required job details");
    }

    const clientExists = await Client.exists({ _id: client });

    if (!clientExists) {
      res.status(404);
      throw new Error("Client not found");
    }

    if (salaryRange.minimum > salaryRange.maximum) {
      res.status(400);
      throw new Error("Minimum salary cannot exceed maximum salary");
    }

    const job = await Job.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job
    });
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    res.json({
      success: true,
      message: "Job updated successfully",
      job
    });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: "Job deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};