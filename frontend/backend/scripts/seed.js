const dotenv = require("dotenv");

const connectDB = require("../config/db");
const User = require("../models/User");

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

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        await User.create(userData);
        console.log(`Created: ${userData.email}`);
      } else {
        console.log(`Already exists: ${userData.email}`);
      }
    }

    console.log("Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();