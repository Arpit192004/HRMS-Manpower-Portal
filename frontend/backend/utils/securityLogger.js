const SecurityLog = require("../models/SecurityLog");

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || "";
};

const logSecurityEvent = async (req, payload) => {
  try {
    await SecurityLog.create({
      user: payload.user || null,
      email: payload.email,
      role: payload.role,
      event: payload.event,
      status: payload.status,
      ipAddress: getRequestIp(req),
      userAgent: req.headers["user-agent"] || "",
      details: payload.details || {}
    });
  } catch (error) {
    console.error("Security log write failed:", error.message);
  }
};

module.exports = logSecurityEvent;
