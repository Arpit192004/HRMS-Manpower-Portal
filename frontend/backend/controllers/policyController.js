const Policy = require("../models/Policy");
const Client = require("../models/Client");

const getPolicies = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const policies = await Policy.find(filter)
      .populate("client", "name code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: policies.length, policies });
  } catch (error) {
    next(error);
  }
};

const getPolicyById = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate("client", "name code")
      .populate("createdBy", "name email");

    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }

    res.json({ success: true, policy });
  } catch (error) {
    next(error);
  }
};

const createPolicy = async (req, res, next) => {
  try {
    const { client, name, type, grade, rules, effectiveFrom } = req.body;

    if (!client || !name || !type || !grade || !rules || !effectiveFrom) {
      res.status(400);
      throw new Error(
        "Client, name, type, grade, rules and effectiveFrom are required"
      );
    }

    const clientExists = await Client.exists({ _id: client });

    if (!clientExists) {
      res.status(404);
      throw new Error("Client not found");
    }

    const policy = await Policy.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Policy created successfully",
      policy
    });
  } catch (error) {
    next(error);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }

    res.json({
      success: true,
      message: "Policy updated successfully",
      policy
    });
  } catch (error) {
    next(error);
  }
};

const deletePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }

    await policy.deleteOne();

    res.json({
      success: true,
      message: "Policy deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy
};