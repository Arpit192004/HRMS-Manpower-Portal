const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Attendance = require("../models/Attendance");
const Candidate = require("../models/Candidate");
const ChangeLog = require("../models/ChangeLog");
const ClientRequirement = require("../models/ClientRequirement");
const Employee = require("../models/Employee");
const ESignRequest = require("../models/ESignRequest");
const ExpenseClaim = require("../models/ExpenseClaim");
const Integration = require("../models/Integration");
const Interview = require("../models/Interview");
const Invoice = require("../models/Invoice");
const Job = require("../models/Job");
const Lead = require("../models/Lead");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const Offer = require("../models/Offer");
const Payroll = require("../models/Payroll");
const Policy = require("../models/Policy");
const Resignation = require("../models/Resignation");
const SecurityLog = require("../models/SecurityLog");
const Shift = require("../models/Shift");
const TourRequest = require("../models/TourRequest");
const Workflow = require("../models/Workflow");

dotenv.config();

const models = [
  Attendance,
  Candidate,
  ChangeLog,
  ClientRequirement,
  Employee,
  ESignRequest,
  ExpenseClaim,
  Integration,
  Interview,
  Invoice,
  Job,
  Lead,
  LeaveRequest,
  Notification,
  Offer,
  Payroll,
  Policy,
  Resignation,
  SecurityLog,
  Shift,
  TourRequest,
  Workflow
];

const clearData = async () => {
  try {
    await connectDB();

    for (const Model of models) {
      const result = await Model.deleteMany({});
      console.log(`Cleared ${Model.modelName}: ${result.deletedCount}`);
    }

    console.log("");
    console.log("Operational data cleared.");
    console.log("Existing real users and departments were preserved.");
    console.log("Run npm run seed only when you need to create/update the initial real admin user.");
    process.exit(0);
  } catch (error) {
    console.error(`Clear data failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

clearData();
