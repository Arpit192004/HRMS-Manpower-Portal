const dotenv = require("dotenv");

const connectDB = require("../config/db");
const User = require("../models/User");
const Client = require("../models/Client");
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");
const Offer = require("../models/Offer");
const Employee = require("../models/Employee");
const Payroll = require("../models/Payroll");

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    const users = [
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
      }
    ];

    let adminUser = null;

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        const createdUser = await User.create(userData);
        console.log(`Created: ${userData.email}`);

        if (userData.email === "admin@hrms.com") {
          adminUser = createdUser;
        }
      } else {
        console.log(`Already exists: ${userData.email}`);

        if (userData.email === "admin@hrms.com") {
          adminUser = existingUser;
        }
      }
    }

    const client = await Client.findOneAndUpdate(
      { code: "DEMO" },
      {
        name: "Demo Manpower Client",
        code: "DEMO",
        industry: "IT Services",
        contactPerson: {
          name: "Demo Client HR",
          email: "client.hr@demo.com",
          phone: "9999999999"
        },
        address: {
          city: "Noida",
          state: "Uttar Pradesh",
          country: "India"
        },
        gstNumber: "09DEMO1234F1Z5",
        createdBy: adminUser._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    const job = await Job.findOneAndUpdate(
      { title: "Employee Portal Test Role", client: client._id },
      {
        client: client._id,
        title: "Employee Portal Test Role",
        department: "Operations",
        grade: "A",
        vacancies: 2,
        salaryRange: {
          minimum: 30000,
          maximum: 60000
        },
        experience: {
          minimum: 1,
          maximum: 5
        },
        skills: ["HRMS", "Operations", "Excel"],
        description: "Demo open role for testing candidate and employee portal.",
        location: "Noida",
        status: "Open",
        createdBy: adminUser._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    const employeeUser = await User.findOne({ email: "employee@hrms.com" });
    let activeEmployeeUser = employeeUser;

    if (!activeEmployeeUser) {
      activeEmployeeUser = await User.create({
        name: "Test Employee",
        email: "employee@hrms.com",
        password: "Employee@123",
        role: "Employee",
        client: client._id
      });

      console.log("Created: employee@hrms.com");
    } else {
      activeEmployeeUser.role = "Employee";
      activeEmployeeUser.client = client._id;
      activeEmployeeUser.isActive = true;
      await activeEmployeeUser.save();
      console.log("Already exists: employee@hrms.com");
    }

    const candidate = await Candidate.findOneAndUpdate(
      { user: activeEmployeeUser._id, job: job._id },
      {
        user: activeEmployeeUser._id,
        job: job._id,
        client: client._id,
        phone: "9876543210",
        currentCompany: "Demo Company",
        currentDesignation: "Associate",
        totalExperience: 2,
        currentSalary: 28000,
        expectedSalary: 42000,
        noticePeriod: "Immediate",
        skills: ["HRMS", "Operations", "Excel"],
        resumeUrl: "https://example.com/test-employee-resume.pdf",
        status: "Joined",
        shortlistedBy: adminUser._id,
        shortlistedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    const earnings = [
      { name: "Basic", amount: 25000 },
      { name: "HRA", amount: 10000 },
      { name: "Special Allowance", amount: 7000 }
    ];

    const deductions = [
      { name: "PF", amount: 1800 },
      { name: "Professional Tax", amount: 200 }
    ];

    const offer = await Offer.findOneAndUpdate(
      { candidate: candidate._id },
      {
        candidate: candidate._id,
        client: client._id,
        job: job._id,
        designation: "Operations Executive",
        joiningDate: new Date(),
        earnings,
        deductions,
        totalEarnings: 42000,
        totalDeductions: 2000,
        netSalary: 40000,
        ctc: 504000,
        status: "Accepted",
        internalApprovalStatus: "Not Required",
        requiresInternalApproval: false,
        createdBy: adminUser._id,
        approvedBy: adminUser._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    const employee = await Employee.findOneAndUpdate(
      { user: activeEmployeeUser._id },
      {
        employeeCode: "DEMO-EMP-0001",
        user: activeEmployeeUser._id,
        client: client._id,
        offer: offer._id,
        designation: "Operations Executive",
        department: "Operations",
        grade: "A",
        joiningDate: offer.joiningDate,
        personalDetails: {
          phone: "9876543210",
          aadhaar: "123412341234",
          pan: "ABCDE1234F",
          address: "Noida, Uttar Pradesh"
        },
        bankDetails: {
          accountHolderName: "Test Employee",
          accountNumber: "1234567890",
          bankName: "HDFC Bank",
          ifscCode: "HDFC0001234"
        },
        roster: "General",
        approvers: [adminUser._id],
        status: "Active",
        createdBy: adminUser._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    await Payroll.findOneAndUpdate(
      {
        employee: employee._id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      },
      {
        employee: employee._id,
        client: client._id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        totalWorkingDays: 30,
        payableDays: 30,
        earnings,
        deductions,
        grossSalary: 42000,
        attendanceDeduction: 0,
        totalDeductions: 2000,
        netSalary: 40000,
        status: "Paid",
        isLocked: true,
        generatedBy: adminUser._id,
        confirmedBy: adminUser._id,
        confirmedAt: new Date(),
        paidAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    console.log("Demo employee portal user ready: employee@hrms.com / Employee@123");

    console.log("Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
