const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clientRoutes = require("./routes/clientRoutes");
const policyRoutes = require("./routes/policyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const offerRoutes = require("./routes/offerRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const tourRoutes = require("./routes/tourRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const resignationRoutes = require("./routes/resignationRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const changeLogRoutes = require("./routes/changeLogRoutes");
const reportRoutes = require("./routes/reportRoutes");
const documentRoutes = require("./routes/documentRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://hrmmanpower.vercel.app",
  "https://hrms-manpower-portal.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HRMS Manpower Portal API"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date()
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/resignations", resignationRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/change-logs", changeLogRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/documents", documentRoutes);

// Error middleware hamesha API routes ke baad rahega
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
