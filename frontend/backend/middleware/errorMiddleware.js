const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode >= 500
      ? "Something went wrong. Please contact support with the request ID."
      : error.message;

  if (statusCode >= 500) {
    console.error("Server error:", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      message: error.message,
      stack: error.stack
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.id,
    stack: isProduction ? undefined : error.stack
  });
};

module.exports = { notFound, errorHandler };
