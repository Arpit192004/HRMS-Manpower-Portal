const SecurityLog = require("../models/SecurityLog");

const getSecurityLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.event) filter.event = req.query.event;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.email) filter.email = req.query.email.toLowerCase();

    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate);
    }

    const limit = Math.min(Number(req.query.limit || 100), 250);

    const logs = await SecurityLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit);

    const summary = await SecurityLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$event",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      count: logs.length,
      summary: summary.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSecurityLogs };
