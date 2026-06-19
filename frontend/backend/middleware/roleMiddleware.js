const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error("You do not have permission to perform this action")
      );
    }

    next();
  };
};

module.exports = { authorize };