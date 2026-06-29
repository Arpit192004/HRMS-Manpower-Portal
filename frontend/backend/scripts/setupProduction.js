const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Client = require("../models/Client");
const CompanySetting = require("../models/CompanySetting");
const User = require("../models/User");

dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for production setup`);
  }
  return value;
};

const optionalUser = (prefix, role, client = null) => {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !password) return null;

  return {
    name: process.env[`${prefix}_NAME`] || role,
    email,
    password,
    role,
    client
  };
};

const ensureUser = async ({ name, email, password, role, client = null }) => {
  let user = await User.findOne({ email: email.toLowerCase() }).select("+password +tokenVersion");

  if (!user) {
    user = new User({ name, email, password, role, client, isActive: true });
  } else {
    user.name = name;
    user.role = role;
    user.client = client;
    user.isActive = true;

    if (password) {
      user.password = password;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
  }

  await user.save();
  console.log(`Ready ${role}: ${email.toLowerCase()}`);
  return user;
};

const setupProduction = async () => {
  try {
    await connectDB();

    const admin = await ensureUser({
      name: process.env.INITIAL_ADMIN_NAME || "Niyukti Administrator",
      email: required("INITIAL_ADMIN_EMAIL"),
      password: required("INITIAL_ADMIN_PASSWORD"),
      role: "Super Admin"
    });

    await CompanySetting.findOneAndUpdate(
      {},
      {
        companyName: process.env.COMPANY_NAME || "Niyukti",
        tagline: process.env.COMPANY_TAGLINE || "From hiring to workforce management",
        email: process.env.COMPANY_EMAIL || process.env.INITIAL_ADMIN_EMAIL,
        phone: process.env.COMPANY_PHONE || "",
        website: process.env.CLIENT_URL || "https://hrms-manpower-portal.vercel.app",
        address: process.env.COMPANY_ADDRESS || "",
        footerText: process.env.COMPANY_FOOTER || "Secure internal HR operations powered by Niyukti.",
        updatedBy: admin._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const managerEmail = process.env.MANAGER_EMAIL;
    let managerClient = null;

    if (managerEmail) {
      managerClient = await Client.findOneAndUpdate(
        { code: process.env.MANAGER_DEPARTMENT_CODE || "DEFAULT" },
        {
          name: process.env.MANAGER_DEPARTMENT_NAME || "Primary Department",
          code: process.env.MANAGER_DEPARTMENT_CODE || "DEFAULT",
          industry: process.env.MANAGER_DEPARTMENT_TYPE || "Internal Department",
          contactPerson: {
            name: process.env.MANAGER_NAME || "Department Manager",
            email: managerEmail,
            phone: process.env.MANAGER_PHONE || ""
          },
          address: {
            city: process.env.COMPANY_CITY || "",
            state: process.env.COMPANY_STATE || "",
            country: "India"
          },
          isActive: true,
          createdBy: admin._id
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    const users = [
      optionalUser("HR", "HR Admin"),
      optionalUser("PAYROLL", "Payroll Team"),
      optionalUser("MANAGER", "Client Approver", managerClient?._id || null),
      optionalUser("EMPLOYEE", "Employee")
    ].filter(Boolean);

    for (const user of users) {
      await ensureUser(user);
    }

    console.log("");
    console.log("Production setup completed.");
    console.log("No sample users or sample operational records were created.");
    console.log("Use Admin > Users & Roles to create real employee, manager and payroll accounts.");
    process.exit(0);
  } catch (error) {
    console.error(`Production setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

setupProduction();
