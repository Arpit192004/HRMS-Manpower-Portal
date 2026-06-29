const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const calculateCandidateMatch = require("../utils/candidateMatch");
const createNotification = require("../utils/createNotification");

const getCandidates = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.job) filter.job = req.query.job;
    if (req.query.client) filter.client = req.query.client;

    if (req.user.role === "Candidate") {
      filter.user = req.user._id;
    }

    if (["Client Approver", "Manager"].includes(req.user.role)) {
      filter.client = req.user.client;
    }

    const candidates = await Candidate.find(filter)
      .populate("user", "name email")
      .populate("job", "title department grade location skills salaryRange experience")
      .populate("client", "name code")
      .populate("shortlistedBy", "name email")
      .populate("submittedToClientBy", "name email")
      .populate("clientReviewedBy", "name email")
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

    const match = calculateCandidateMatch(candidate, job);
    candidate.matchScore = match.score;
    candidate.matchRecommendation = match.recommendation;
    candidate.matchedSkills = match.matchedSkills;
    candidate.missingSkills = match.missingSkills;
    candidate.matchBreakdown = match.breakdown;
    candidate.matchSummary = match.summary;
    candidate.matchCalculatedAt = new Date();
    await candidate.save();

    const hrUsers = await User.find({
      role: { $in: ["Super Admin", "HR Admin"] },
      isActive: true
    }).select("email name");

    await Promise.all(
      hrUsers.map((user) =>
        sendEmail({
          to: user.email,
          subject: "New candidate application received",
          text: `${req.user.name} applied for ${job.title}.`,
          html: `<p><strong>${req.user.name}</strong> applied for <strong>${job.title}</strong>.</p>`
        })
      )
    );

    await sendEmail({
      to: req.user.email,
      subject: "Application submitted successfully",
      text: `Your application for ${job.title} has been submitted successfully.`,
      html: `<p>Your application for <strong>${job.title}</strong> has been submitted successfully.</p>`
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
      "Submitted to Client",
      "Client Shortlisted",
      "Client Rejected",
      "More Profiles Requested",
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

const submitCandidateToClient = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "name email")
      .populate("job", "title")
      .populate("client", "name code");

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate application not found");
    }

    if (!["Shortlisted", "Interview", "Pre-Offer"].includes(candidate.status)) {
      res.status(400);
      throw new Error("Only internally shortlisted candidates can be submitted to client");
    }

    candidate.status = "Submitted to Client";
    candidate.submittedToClientBy = req.user._id;
    candidate.submittedToClientAt = new Date();
    candidate.clientReviewRemarks = "";
    await candidate.save();

    await createNotification({
      title: "Candidate submitted to client",
      message: `${candidate.user?.name || "Candidate"} submitted to ${candidate.client?.name || "client"} for review.`,
      type: "Hiring",
      link: "/admin/pipeline",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "Candidate",
      entityId: candidate._id
    });

    res.json({
      success: true,
      message: "Candidate submitted to client successfully",
      candidate
    });
  } catch (error) {
    next(error);
  }
};

const reviewCandidateByClient = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;
    const allowedDecisions = ["Client Shortlisted", "Client Rejected", "More Profiles Requested"];

    if (!allowedDecisions.includes(decision)) {
      res.status(400);
      throw new Error("Invalid client review decision");
    }

    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "name email")
      .populate("job", "title")
      .populate("client", "name code");

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate application not found");
    }

    if (candidate.client._id.toString() !== req.user.client?.toString()) {
      res.status(403);
      throw new Error("You cannot review another client's candidate");
    }

    if (candidate.status !== "Submitted to Client") {
      res.status(400);
      throw new Error("Candidate is not pending client review");
    }

    candidate.status = decision;
    candidate.clientReviewRemarks = remarks || "";
    candidate.clientReviewedBy = req.user._id;
    candidate.clientReviewedAt = new Date();
    await candidate.save();

    await createNotification({
      title: "Client reviewed candidate",
      message: `${candidate.client?.name || "Client"} marked ${candidate.user?.name || "candidate"} as ${decision}.`,
      type: "Hiring",
      link: "/admin/pipeline",
      audienceRoles: ["Super Admin", "HR Admin"],
      entityType: "Candidate",
      entityId: candidate._id
    });

    res.json({
      success: true,
      message: "Candidate review submitted successfully",
      candidate
    });
  } catch (error) {
    next(error);
  }
};

const refreshCandidateMatch = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate("job");

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate application not found");
    }

    const match = calculateCandidateMatch(candidate, candidate.job);
    candidate.matchScore = match.score;
    candidate.matchRecommendation = match.recommendation;
    candidate.matchedSkills = match.matchedSkills;
    candidate.missingSkills = match.missingSkills;
    candidate.matchBreakdown = match.breakdown;
    candidate.matchSummary = match.summary;
    candidate.matchCalculatedAt = new Date();
    await candidate.save();

    res.json({
      success: true,
      message: "Candidate match refreshed successfully",
      match,
      candidate
    });
  } catch (error) {
    next(error);
  }
};

const refreshAllCandidateMatches = async (req, res, next) => {
  try {
    const candidates = await Candidate.find().populate("job");
    let updated = 0;

    for (const candidate of candidates) {
      if (!candidate.job) continue;

      const match = calculateCandidateMatch(candidate, candidate.job);
      candidate.matchScore = match.score;
      candidate.matchRecommendation = match.recommendation;
      candidate.matchedSkills = match.matchedSkills;
      candidate.missingSkills = match.missingSkills;
      candidate.matchBreakdown = match.breakdown;
      candidate.matchSummary = match.summary;
      candidate.matchCalculatedAt = new Date();
      await candidate.save();
      updated += 1;
    }

    res.json({
      success: true,
      message: `${updated} candidate match score(s) refreshed`,
      updated
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
  submitCandidateToClient,
  reviewCandidateByClient,
  refreshCandidateMatch,
  refreshAllCandidateMatches,
  withdrawApplication
};
