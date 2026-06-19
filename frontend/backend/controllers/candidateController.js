const Candidate = require("../models/Candidate");
const Job = require("../models/Job");

const getCandidates = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.job) filter.job = req.query.job;
    if (req.query.client) filter.client = req.query.client;

    if (req.user.role === "Candidate") {
      filter.user = req.user._id;
    }

    const candidates = await Candidate.find(filter)
      .populate("user", "name email")
      .populate("job", "title department grade")
      .populate("client", "name code")
      .populate("shortlistedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    next(error);
  }
};

const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "name email")
      .populate("job", "title department grade")
      .populate("client", "name code");

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate application not found");
    }

    if (
      req.user.role === "Candidate" &&
      candidate.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You cannot view this application");
    }

    res.json({ success: true, candidate });
  } catch (error) {
    next(error);
  }
};

const applyForJob = async (req, res, next) => {
  try {
    const { job: jobId, phone, resumeUrl } = req.body;

    if (!jobId || !phone || !resumeUrl) {
      res.status(400);
      throw new Error("Job, phone and resume URL are required");
    }

    const job = await Job.findById(jobId);

    if (!job || job.status !== "Open") {
      res.status(400);
      throw new Error("This job is not open for applications");
    }

    const existingApplication = await Candidate.findOne({
      user: req.user._id,
      job: jobId
    });

    if (existingApplication) {
      res.status(409);
      throw new Error("You have already applied for this job");
    }

    const candidate = await Candidate.create({
      ...req.body,
      user: req.user._id,
      job: job._id,
      client: job.client
    });

    res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      candidate
    });
  } catch (error) {
    next(error);
  }
};

const updateCandidateStatus = async (req, res, next) => {
  try {
    const allowedStatuses = [
      "Applied",
      "Shortlisted",
      "Rejected",
      "Interview",
      "Pre-Offer",
      "Offered",
      "Joined"
    ];

    if (!allowedStatuses.includes(req.body.status)) {
      res.status(400);
      throw new Error("Invalid candidate status");
    }

    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate application not found");
    }

    candidate.status = req.body.status;

    if (req.body.status === "Shortlisted") {
      candidate.shortlistedBy = req.user._id;
      candidate.shortlistedAt = new Date();
    }

    await candidate.save();

    res.json({
      success: true,
      message: "Candidate status updated successfully",
      candidate
    });
  } catch (error) {
    next(error);
  }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!candidate) {
      res.status(404);
      throw new Error("Application not found");
    }

    await candidate.deleteOne();

    res.json({
      success: true,
      message: "Application withdrawn successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  applyForJob,
  updateCandidateStatus,
  withdrawApplication
};