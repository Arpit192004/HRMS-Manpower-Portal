const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload =
    typeof user === "object"
      ? { id: user._id, tokenVersion: user.tokenVersion || 0 }
      : { id: user, tokenVersion: 0 };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

module.exports = generateToken;
