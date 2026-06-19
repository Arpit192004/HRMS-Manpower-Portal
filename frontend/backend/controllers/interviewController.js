const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");

const getInterviews = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.candidate) filter.candidate = req.query.candidate;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.client) filter.client = req.query.client;

    if (req.user.role === "Manager") {
      filter.interviewer = req.user._id;
    }

    const interviews = await Interview.find(filter)
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name email" }
      })
      .populate("client", "name code")
      .populate("job", "title department")
      .populate("interviewer", "name email role")
      .populate("createdBy", "name email")
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (error) {
    next(error);
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name email" }
      })
      .populate("client", "name code")
      .populate("job", "title department")
      .populate("interviewer", "name email role");

    if (!interview) {
      res.status(404);
      throw new Error("Interview not found");
    }

    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

const scheduleInterview = async (req, res, next) => {
  try {
    const {
      candidate: candidateId,
      roundNumber,
      roundName,
      interviewer,
      scheduledAt,
      mode
    } = req.body;

    if (
      !candidateId ||
      !roundNumber ||
      !roundName ||
      !interviewer ||
      !scheduledAt ||
      !mode
    ) {
      res.status(400);
      throw new Error("Please provide all required interview details");
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate not found");
    }

    const existingRound = await Interview.findOne({
      candidate: candidateId,
      roundNumber
    });

    if (existingRound) {
      res.status(409);
      throw new Error("This interview round already exists");
    }

    const interview = await Interview.create({
      ...req.body,
      client: candidate.client,
      job: candidate.job,
      createdBy: req.user._id
    });

    candidate.status = "Interview";
    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview
    });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comments, recommendation } = req.body;

    if (!rating || !recommendation) {
      res.status(400);
      throw new Error("Rating and recommendation are required");
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      res.status(404);
      throw new Error("Interview not found");
    }

    if (
      req.user.role === "Manager" &&
      interview.interviewer.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("Only the assigned interviewer can submit feedback");
    }

    interview.feedback = { rating, comments, recommendation };
    interview.status = "Completed";
    await interview.save();

    const candidate = await Candidate.findById(interview.candidate);

    if (candidate) {
      if (recommendation === "Recommended") {
        candidate.status = "Pre-Offer";
      } else if (recommendation === "Not Recommended") {
        candidate.status = "Rejected";
      }

      await candidate.save();
    }

    res.json({
      success: true,
      message: "Interview feedback submitted successfully",
      interview
    });
  } catch (error) {
    next(error);
  }
};

const skipInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      res.status(404);
      throw new Error("Interview not found");
    }

    if (interview.status !== "Scheduled") {
      res.status(400);
      throw new Error("Only scheduled interviews can be skipped");
    }

    interview.status = "Skipped";
    await interview.save();

    res.json({
      success: true,
      message: "Interview round skipped successfully",
      interview
    });
  } catch (error) {
    next(error);
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!interview) {
      res.status(404);
      throw new Error("Interview not found");
    }

    res.json({
      success: true,
      message: "Interview updated successfully",
      interview
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  scheduleInterview,
  submitFeedback,
  skipInterview,
  updateInterview
};