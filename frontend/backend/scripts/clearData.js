const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Attendance = require("../models/Attendance");
const Candidate = require("../models/Candidate");
const ChangeLog = require("../models/ChangeLog");
const Client = require("../models/Client");
const ClientRequirement = require("../models/ClientRequirement");
const CompanySetting = require("../models/CompanySetting");
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
const User = require("../models/User");
const Workflow = require("../models/Workflow");

dotenv.config();

const coreUsers = [
  {
    name: "Super Admin",
    email: "admin@hrms.com",
    password: "Admin@123",
    role: "Super Admin"
  },
  {
    name: "HR Administrator",
    email: "hr@hrms.com",
    password: "Hr@12345",
    role: "HR Admin"
  },
  {
    name: "Payroll User",
    email: "payroll@hrms.com",
    password: "Payroll@123",
    role: "Payroll Team"
  },
  {
    name: "Client Approver",
    email: "client@hrms.com",
    password: "Client@123",
    role: "Client Approver"
  },
  {
    name: "Employee User",
    email: "employee@hrms.com",
    password: "Employee@123",
    role: "Employee"
  },
  {
    name: "Candidate User",
    email: "candidate1@hrms.com",
    password: "Candidate@123",
    role: "Candidate"
  }
];

const wipeCollections = async () => {
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

  for (const Model of models) {
    const result = await Model.deleteMany({});
    console.log(`Cleared ${Model.modelName}: ${result.deletedCount}`);
  }
};

const ensureUser = async ({ name, email, password, role, client = null }) => {
  let user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil +tokenVersion");

  if (!user) {
    user = new User({ name, email, password, role, client, isActive: true });
  } else {
    user.name = name;
    user.password = password;
    user.role = role;
    user.client = client;
    user.isActive = true;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  await user.save();
  console.log(`Ready user: ${email}`);
  return user;
};

const clearData = async () => {
  try {
    await connectDB();

    await wipeCollections();

    const coreEmails = coreUsers.map((user) => user.email);
    const removedUsers = await User.deleteMany({ email: { $nin: coreEmails } });
    console.log(`Removed non-core users: ${removedUsers.deletedCount}`);

    const adminUser = await ensureUser(coreUsers[0]);
    await ensureUser(coreUsers[1]);
    await ensureUser(coreUsers[2]);

    await Client.deleteMany({});
    const defaultClient = await Client.create({
      name: "Niyukti Demo Client",
      code: "NDC",
      industry: "Workforce Services",
      contactPerson: {
        name: "Client Approver",
        email: "client@hrms.com",
        phone: "9999999999"
      },
      address: {
        line1: "Delhi NCR",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India"
      },
      gstNumber: "07NDC1234F1Z1",
      isActive: true,
      createdBy: adminUser._id
    });

    await ensureUser({ ...coreUsers[3], client: defaultClient._id });
    await ensureUser(coreUsers[4]);
    await ensureUser(coreUsers[5]);

    await CompanySetting.findOneAndUpdate(
      {},
      {
        companyName: "Niyukti",
        tagline: "From hiring to workforce management",
        email: "hello@niyukti.example",
        phone: "+91 98765 43210",
        website: "https://hrms-manpower-portal.vercel.app",
        address: "Delhi NCR, India",
        footerText: "Thank you for choosing Niyukti workforce services.",
        updatedBy: adminUser._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("");
    console.log("Clean portal data ready.");
    console.log("All operational records are cleared.");
    console.log("Only core login users and one blank client account remain.");
    console.log("");
    console.log("Admin: admin@hrms.com / Admin@123");
    console.log("HR: hr@hrms.com / Hr@12345");
    console.log("Payroll: payroll@hrms.com / Payroll@123");
    console.log("Client: client@hrms.com / Client@123");
    console.log("Employee: employee@hrms.com / Employee@123");
    console.log("Candidate: candidate1@hrms.com / Candidate@123");
    process.exit(0);
  } catch (error) {
    console.error(`Clear data failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

clearData();
