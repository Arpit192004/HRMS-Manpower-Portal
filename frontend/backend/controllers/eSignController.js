const ESignRequest = require("../models/ESignRequest");
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  return forwardedFor ? forwardedFor.split(",")[0].trim() : req.ip;
};

const populateESign = (query) =>
  query
    .populate("client", "name code")
    .populate("candidate", "phone status")
    .populate("employee", "employeeCode designation department")
    .populate("signer", "name email role")
    .populate("createdBy", "name email role");

const getESignRequests = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.documentType) filter.documentType = req.query.documentType;

    if (["Client Approver", "Manager"].includes(req.user.role)) {
      filter.client = req.user.client;
    } else if (req.query.client) {
      filter.client = req.query.client;
    }

    if (req.user.role === "Candidate" || req.user.role === "Employee") {
      filter.signer = req.user._id;
    }

    const requests = await populateESign(
      ESignRequest.find(filter).sort({ createdAt: -1 })
    );

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

const resolveSigner = async ({ signer, candidate, employee }) => {
  if (signer) {
    return User.findById(signer);
  }

  if (candidate) {
    const candidateDoc = await Candidate.findById(candidate).populate("user", "name email");
    return candidateDoc?.user || null;
  }

  if (employee) {
    const employeeDoc = await Employee.findById(employee).populate("user", "name email");
    return employeeDoc?.user || null;
  }

  return null;
};

const createESignRequest = async (req, res, next) => {
  try {
    const {
      title,
      documentType,
      documentUrl,
      client,
      candidate,
      employee,
      signer,
      expiresInDays
    } = req.body;

    if (!title || !documentType || !documentUrl) {
      res.status(400);
      throw new Error("Title, document type and document URL are required");
    }

    const signerUser = await resolveSigner({ signer, candidate, employee });

    if (!signerUser) {
      res.status(400);
      throw new Error("Valid signer, candidate or employee is required");
    }

    const request = await ESignRequest.create({
      title,
      documentType,
      documentUrl,
      client: client || null,
      candidate: candidate || null,
      employee: employee || null,
      signer: signerUser._id,
      signerName: signerUser.name,
      signerEmail: signerUser.email,
      expiresAt: new Date(Date.now() + Number(expiresInDays || 7) * 24 * 60 * 60 * 1000),
      createdBy: req.user._id
    });

    await sendEmail({
      to: signerUser.email,
      subject: `Document signature requested: ${title}`,
      text: `Please login to Niyukti and sign: ${title}.`,
      html: `<p>Please login to Niyukti and sign:</p><p><strong>${title}</strong></p>`
    });

    res.status(201).json({
      success: true,
      message: "E-sign request created successfully",
      request
    });
  } catch (error) {
    next(error);
  }
};

const signESignRequest = async (req, res, next) => {
  try {
    const { signatureText, signatureImageUrl } = req.body;

    if (!signatureText && !signatureImageUrl) {
      res.status(400);
      throw new Error("Signature text or image is required");
    }

    const request = await ESignRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("E-sign request not found");
    }

    if (request.signer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You cannot sign another user's document");
    }

    if (request.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending requests can be signed");
    }

    if (request.expiresAt < new Date()) {
      request.status = "Expired";
      await request.save();
      res.status(400);
      throw new Error("This signature request has expired");
    }

    request.status = "Signed";
    request.signatureText = signatureText || "";
    request.signatureImageUrl = signatureImageUrl || "";
    request.signedDocumentUrl = request.documentUrl;
    request.signedAt = new Date();
    request.signerIp = getRequestIp(req);
    request.signerUserAgent = req.headers["user-agent"] || "";

    await request.save();

    res.json({
      success: true,
      message: "Document signed successfully",
      request
    });
  } catch (error) {
    next(error);
  }
};

const declineESignRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await ESignRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("E-sign request not found");
    }

    if (request.signer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You cannot decline another user's document");
    }

    if (request.status !== "Pending") {
      res.status(400);
      throw new Error("Only pending requests can be declined");
    }

    request.status = "Declined";
    request.declinedReason = reason || "";
    request.signerIp = getRequestIp(req);
    request.signerUserAgent = req.headers["user-agent"] || "";
    await request.save();

    res.json({
      success: true,
      message: "Document declined successfully",
      request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getESignRequests,
  createESignRequest,
  signESignRequest,
  declineESignRequest
};
