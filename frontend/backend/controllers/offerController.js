const Offer = require("../models/Offer");
const Candidate = require("../models/Candidate");

const calculateSalary = (earnings = [], deductions = []) => {
  const totalEarnings = earnings.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const totalDeductions = deductions.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  return {
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions
  };
};

const getOffers = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.client) filter.client = req.query.client;

    if (req.user.role === "Candidate") {
      const applications = await Candidate.find({
        user: req.user._id
      }).select("_id");

      filter.candidate = { $in: applications.map((item) => item._id) };
    }

    const offers = await Offer.find(filter)
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name email" }
      })
      .populate("client", "name code")
      .populate("job", "title department")
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name email" }
      })
      .populate("client", "name code")
      .populate("job", "title department");

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (
      req.user.role === "Candidate" &&
      offer.candidate.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You cannot view this offer");
    }

    res.json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

const createOffer = async (req, res, next) => {
  try {
    const {
      candidate: candidateId,
      designation,
      joiningDate,
      earnings,
      deductions,
      ctc,
      requiresInternalApproval
    } = req.body;

    if (!candidateId || !designation || !joiningDate || !ctc) {
      res.status(400);
      throw new Error(
        "Candidate, designation, joining date and CTC are required"
      );
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      res.status(404);
      throw new Error("Candidate not found");
    }

    if (candidate.status !== "Pre-Offer") {
      res.status(400);
      throw new Error("Candidate must be in Pre-Offer status");
    }

    const existingOffer = await Offer.findOne({ candidate: candidateId });

    if (existingOffer) {
      res.status(409);
      throw new Error("Offer already exists for this candidate");
    }

    const salary = calculateSalary(earnings, deductions);

    const offer = await Offer.create({
      candidate: candidate._id,
      client: candidate.client,
      job: candidate.job,
      designation,
      joiningDate,
      earnings,
      deductions,
      ctc,
      ...salary,
      requiresInternalApproval: Boolean(requiresInternalApproval),
      internalApprovalStatus: requiresInternalApproval
        ? "Pending"
        : "Not Required",
      status: requiresInternalApproval ? "Pending Approval" : "Approved",
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer
    });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const { type, url } = req.body;

    if (!type || !url) {
      res.status(400);
      throw new Error("Document type and URL are required");
    }

    const offer = await Offer.findById(req.params.id).populate("candidate");

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (
      req.user.role === "Candidate" &&
      offer.candidate.user.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You cannot upload documents for this offer");
    }

    offer.documents.push({ type, url });
    await offer.save();

    res.json({
      success: true,
      message: "Document added successfully",
      offer
    });
  } catch (error) {
    next(error);
  }
};

const approveOffer = async (req, res, next) => {
  try {
    const { decision } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Approved or Rejected");
    }

    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    offer.internalApprovalStatus = decision;
    offer.status = decision;
    offer.approvedBy = req.user._id;

    await offer.save();

    res.json({
      success: true,
      message: `Offer ${decision.toLowerCase()} successfully`,
      offer
    });
  } catch (error) {
    next(error);
  }
};

const sendOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (offer.status !== "Approved") {
      res.status(400);
      throw new Error("Only approved offers can be sent");
    }

    offer.status = "Sent";
    await offer.save();

    const candidate = await Candidate.findById(offer.candidate);

    if (candidate) {
      candidate.status = "Offered";
      await candidate.save();
    }

    res.json({
      success: true,
      message: "Offer sent successfully",
      offer
    });
  } catch (error) {
    next(error);
  }
};

const respondToOffer = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Accepted", "Rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Decision must be Accepted or Rejected");
    }

    const offer = await Offer.findById(req.params.id).populate("candidate");

    if (!offer) {
      res.status(404);
      throw new Error("Offer not found");
    }

    if (offer.candidate.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You cannot respond to this offer");
    }

    if (offer.status !== "Sent") {
      res.status(400);
      throw new Error("This offer is not awaiting candidate response");
    }

    offer.status = decision;
    offer.candidateRemarks = remarks;
    await offer.save();

    if (decision === "Rejected") {
      await Candidate.findByIdAndUpdate(offer.candidate._id, {
        status: "Rejected"
      });
    }

    res.json({
      success: true,
      message: `Offer ${decision.toLowerCase()} successfully`,
      offer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  uploadDocument,
  approveOffer,
  sendOffer,
  respondToOffer
};