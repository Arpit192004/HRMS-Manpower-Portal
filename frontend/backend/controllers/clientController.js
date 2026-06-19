const Client = require("../models/Client");

const getClients = async (req, res, next) => {
  try {
    const clients = await Client.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: clients.length, clients });
  } catch (error) {
    next(error);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }

    res.json({ success: true, client });
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  try {
    const { name, code, industry, contactPerson } = req.body;

    if (!name || !code || !industry || !contactPerson) {
      res.status(400);
      throw new Error("Name, code, industry and contact person are required");
    }

    const existingClient = await Client.findOne({
      code: code.toUpperCase()
    });

    if (existingClient) {
      res.status(409);
      throw new Error("Client code already exists");
    }

    const client = await Client.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client
    });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }

    res.json({
      success: true,
      message: "Client updated successfully",
      client
    });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }

    await client.deleteOne();

    res.json({
      success: true,
      message: "Client deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};