const Integration = require("../models/Integration");
const createAuditLog = require("../utils/auditLog");

const getIntegrations = async (req, res, next) => {
  try {
    const integrations = await Integration.find()
      .populate("owner", "name email role")
      .sort({ status: 1, category: 1, provider: 1 });

    const summary = {
      total: integrations.length,
      connected: integrations.filter((item) => item.status === "Connected").length,
      attention: integrations.filter((item) => item.status === "Needs Attention").length,
      recordsSynced: integrations.reduce((sum, item) => sum + (item.recordsSynced || 0), 0)
    };

    res.json({
      success: true,
      summary,
      integrations
    });
  } catch (error) {
    next(error);
  }
};

const createIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.create({
      ...req.body,
      owner: req.user._id
    });

    await createAuditLog({
      entityType: "Integration",
      entityId: integration._id,
      action: "Create",
      newData: integration.toObject(),
      updatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Integration created successfully",
      integration
    });
  } catch (error) {
    next(error);
  }
};

const updateIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.findById(req.params.id);

    if (!integration) {
      res.status(404);
      throw new Error("Integration not found");
    }

    const oldData = integration.toObject();

    [
      "name",
      "provider",
      "category",
      "status",
      "environment",
      "baseUrl",
      "webhookUrl",
      "authType",
      "maskedCredential",
      "syncDirection",
      "objects",
      "nextSyncAt",
      "syncStatus",
      "errorRate",
      "config"
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        integration[field] = req.body[field];
      }
    });

    await integration.save();

    await createAuditLog({
      entityType: "Integration",
      entityId: integration._id,
      action: "Update",
      oldData,
      newData: integration.toObject(),
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: "Integration updated successfully",
      integration
    });
  } catch (error) {
    next(error);
  }
};

const runIntegrationSync = async (req, res, next) => {
  try {
    const integration = await Integration.findById(req.params.id);

    if (!integration) {
      res.status(404);
      throw new Error("Integration not found");
    }

    const recordsProcessed = Math.floor(Math.random() * 70) + 18;
    const durationMs = Math.floor(Math.random() * 1800) + 400;
    const failed = integration.status === "Disconnected";

    integration.lastSyncAt = new Date();
    integration.nextSyncAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    integration.recordsSynced += failed ? 0 : recordsProcessed;
    integration.syncStatus = failed ? "Failed" : "Healthy";
    integration.status = failed ? "Needs Attention" : "Connected";
    integration.errorRate = failed ? 12 : Math.max(0, Number((Math.random() * 1.8).toFixed(2)));
    integration.syncLogs.unshift({
      status: failed ? "Failed" : "Success",
      message: failed
        ? "Connection rejected. Check credentials or provider access."
        : `${recordsProcessed} records synced with ${integration.provider}.`,
      recordsProcessed: failed ? 0 : recordsProcessed,
      durationMs,
      ranBy: req.user._id
    });

    integration.syncLogs = integration.syncLogs.slice(0, 8);
    await integration.save();

    await createAuditLog({
      entityType: "Integration",
      entityId: integration._id,
      action: "Sync",
      newData: {
        provider: integration.provider,
        status: integration.syncStatus,
        recordsProcessed
      },
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: failed ? "Sync failed. Check integration credentials." : "Integration sync completed",
      integration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIntegrations,
  createIntegration,
  updateIntegration,
  runIntegrationSync
};
