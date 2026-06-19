const ChangeLog = require("../models/ChangeLog");

const getChangeLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.client) filter.client = req.query.client;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.entityId) filter.entityId = req.query.entityId;
    if (req.query.action) filter.action = req.query.action;

    const logs = await ChangeLog.find(filter)
      .populate("client", "name code")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getChangeLogs };