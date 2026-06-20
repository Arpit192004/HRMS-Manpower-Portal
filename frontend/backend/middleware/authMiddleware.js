const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Authentication token is required");
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+tokenVersion");

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("User not found or inactive");
    }

    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      res.status(401);
      throw new Error("Session expired. Please login again");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.status(401);
      return next(new Error("Invalid authentication token"));
    }

    if (error.name === "TokenExpiredError") {
      res.status(401);
      return next(new Error("Authentication token expired"));
    }

    next(error);
  }
};

module.exports = { protect };
