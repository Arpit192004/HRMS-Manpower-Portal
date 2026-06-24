const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Attendance = require("../models/Attendance");
const Candidate = require("../models/Candidate");
const Client = require("../models/Client");
const ClientRequirement = require("../models/ClientRequirement");
const Employee = require("../models/Employee");
const ESignRequest = require("../models/ESignRequest");
const ExpenseClaim = require("../models/ExpenseClaim");
const Invoice = require("../models/Invoice");
const Integration = require("../models/Integration");
const Job = require("../models/Job");
const LeaveRequest = require("../models/LeaveRequest");
const Offer = require("../models/Offer");
const Payroll = require("../models/Payroll");
const Shift = require("../models/Shift");
const User = require("../models/User");
const Workflow = require("../models/Workflow");

dotenv.config();

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const atTime = (baseDate, hours, minutes = 0) => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const ensureUser = async ({ name, email, password, role, client = null }) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ name, email, password, role, client });
    console.log(`Created user: ${email}`);
  } else {
    user.name = name;
    user.role = role;
    user.client = client;
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
    console.log(`Ready user: ${email}`);
  }

  return user;
};

const upsertByKey = async (Model, filter, payload) => {
  return Model.findOneAndUpdate(filter, payload, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
  });
};

const seed = async () => {
  try {
    await connectDB();

    const adminUser = await ensureUser({
      name: "Super Admin",
      email: "admin@hrms.com",
      password: "Admin@123",
      role: "Super Admin"
    });

    const hrUser = await ensureUser({
      name: "HR Administrator",
      email: "hr@hrms.com",
      password: "Hr@12345",
      role: "HR Admin"
    });

    const payrollUser = await ensureUser({
      name: "Payroll User",
      email: "payroll@hrms.com",
      password: "Payroll@123",
      role: "Payroll Team"
    });

    const clients = [];
    const clientSeeds = [
      {
        name: "Apex Digital Services Pvt. Ltd.",
        code: "APEX",
        industry: "IT Services & BPO",
        contactPerson: { name: "Aarav Mehta", email: "aarav.mehta@apexdigital.example", phone: "9876500011" },
        address: { line1: "Tower B, Sector 62", city: "Noida", state: "Uttar Pradesh", postalCode: "201301" },
        gstNumber: "09APEX1234F1Z5"
      },
      {
        name: "NorthGate Logistics India Pvt. Ltd.",
        code: "NGL",
        industry: "Logistics & Warehousing",
        contactPerson: { name: "Nisha Kapoor", email: "nisha.kapoor@northgate.example", phone: "9876500022" },
        address: { line1: "NH-48 Fulfilment Hub", city: "Gurugram", state: "Haryana", postalCode: "122001" },
        gstNumber: "06NGL1234F1Z7"
      },
      {
        name: "UrbanKart Retail Network Ltd.",
        code: "UKR",
        industry: "Retail & E-Commerce",
        contactPerson: { name: "Kabir Suri", email: "kabir.suri@urbankart.example", phone: "9876500033" },
        address: { line1: "Connaught Place", city: "Delhi", state: "Delhi", postalCode: "110001" },
        gstNumber: "07UKR1234F1Z9"
      },
      {
        name: "MetroCare Hospital Services Pvt. Ltd.",
        code: "MCH",
        industry: "Healthcare Staffing",
        contactPerson: { name: "Dr. Rhea Bansal", email: "rhea.bansal@metrocare.example", phone: "9876500044" },
        address: { line1: "Medicentre Road, Sector 14", city: "Faridabad", state: "Haryana", postalCode: "121007" },
        gstNumber: "06MCH1234F1Z6"
      },
      {
        name: "Zenith Facility Management Pvt. Ltd.",
        code: "ZFM",
        industry: "Facility Management",
        contactPerson: { name: "Manav Arora", email: "manav.arora@zenithfm.example", phone: "9876500055" },
        address: { line1: "Industrial Area Phase II", city: "Ghaziabad", state: "Uttar Pradesh", postalCode: "201010" },
        gstNumber: "09ZFM1234F1Z8"
      }
    ];

    for (const clientData of clientSeeds) {
      const client = await upsertByKey(Client, { code: clientData.code }, {
        ...clientData,
        isActive: true,
        createdBy: adminUser._id
      });
      clients.push(client);
    }

    const clientUser = await ensureUser({
      name: "Apex Client Approver",
      email: "client@hrms.com",
      password: "Client@123",
      role: "Client Approver",
      client: clients[0]._id
    });

    const shifts = [];
    const shiftSeeds = [
      { client: clients[0], name: "General Shift", code: "GEN", startTime: "09:30", endTime: "18:30", graceMinutes: 10 },
      { client: clients[1], name: "Warehouse Morning", code: "MORN", startTime: "08:00", endTime: "17:00", graceMinutes: 15 },
      { client: clients[2], name: "Retail Evening", code: "EVE", startTime: "12:00", endTime: "21:00", graceMinutes: 10 },
      { client: clients[3], name: "Hospital Day Shift", code: "HOSP-D", startTime: "07:00", endTime: "16:00", graceMinutes: 10 },
      { client: clients[4], name: "Facility General", code: "FAC-G", startTime: "08:30", endTime: "17:30", graceMinutes: 15 }
    ];

    for (const item of shiftSeeds) {
      const shift = await upsertByKey(
        Shift,
        { client: item.client._id, code: item.code },
        {
          client: item.client._id,
          name: item.name,
          code: item.code,
          startTime: item.startTime,
          endTime: item.endTime,
          graceMinutes: item.graceMinutes,
          weeklyOffs: ["Sunday"],
          isNightShift: false,
          isActive: true,
          createdBy: adminUser._id
        }
      );
      shifts.push(shift);
    }

    const jobs = [];
    const jobSeeds = [
      { client: clients[0], title: "React Frontend Developer", department: "Engineering", grade: "A", vacancies: 4, location: "Noida", skills: ["React", "JavaScript", "REST API"], min: 45000, max: 90000 },
      { client: clients[0], title: "HR Operations Executive", department: "Operations", grade: "A", vacancies: 3, location: "Noida", skills: ["HRMS", "Excel", "Payroll"], min: 30000, max: 55000 },
      { client: clients[0], title: "Customer Support Associate", department: "BPO Operations", grade: "B", vacancies: 15, location: "Noida", skills: ["CRM", "Email Support", "English Communication"], min: 22000, max: 38000 },
      { client: clients[1], title: "Warehouse Supervisor", department: "Logistics", grade: "B", vacancies: 6, location: "Gurugram", skills: ["Inventory", "Team Handling", "Shift Planning"], min: 28000, max: 52000 },
      { client: clients[1], title: "Picker Packer", department: "Warehouse", grade: "C", vacancies: 30, location: "Gurugram", skills: ["Barcode Scanning", "Packing", "Dispatch"], min: 16000, max: 24000 },
      { client: clients[2], title: "Store Associate", department: "Retail", grade: "C", vacancies: 12, location: "Delhi", skills: ["Customer Service", "POS", "Sales"], min: 18000, max: 32000 },
      { client: clients[2], title: "Retail Floor Supervisor", department: "Retail", grade: "B", vacancies: 5, location: "Delhi", skills: ["Visual Merchandising", "Team Handling", "Sales"], min: 28000, max: 45000 },
      { client: clients[3], title: "Patient Care Assistant", department: "Nursing Support", grade: "C", vacancies: 18, location: "Faridabad", skills: ["Patient Care", "Vitals", "Ward Support"], min: 19000, max: 30000 },
      { client: clients[3], title: "Hospital Front Desk Executive", department: "Administration", grade: "B", vacancies: 4, location: "Faridabad", skills: ["OPD Desk", "Billing", "Patient Coordination"], min: 24000, max: 38000 },
      { client: clients[4], title: "Facility Supervisor", department: "Operations", grade: "B", vacancies: 7, location: "Ghaziabad", skills: ["Housekeeping", "Vendor Coordination", "Checklist Audit"], min: 26000, max: 42000 },
      { client: clients[4], title: "Security Coordinator", department: "Security", grade: "B", vacancies: 8, location: "Ghaziabad", skills: ["Patrolling", "Incident Reporting", "Shift Rostering"], min: 24000, max: 38000 }
    ];

    for (const jobData of jobSeeds) {
      const job = await upsertByKey(
        Job,
        { title: jobData.title, client: jobData.client._id },
        {
          client: jobData.client._id,
          title: jobData.title,
          department: jobData.department,
          grade: jobData.grade,
          vacancies: jobData.vacancies,
          salaryRange: { minimum: jobData.min, maximum: jobData.max },
          experience: { minimum: 1, maximum: 6 },
          skills: jobData.skills,
          description: `${jobData.title} requirement for ${jobData.client.name}.`,
          location: jobData.location,
          status: "Open",
          createdBy: adminUser._id
        }
      );
      jobs.push(job);
    }

    for (const job of jobs) {
      await upsertByKey(
        ClientRequirement,
        { client: job.client, title: job.title },
        {
          client: job.client,
          title: job.title,
          department: job.department,
          location: job.location,
          vacancies: job.vacancies,
          requiredBy: daysFromNow(job.title.includes("Store") ? 7 : 14),
          budgetMin: job.salaryRange.minimum,
          budgetMax: job.salaryRange.maximum,
          experienceMin: job.experience.minimum,
          experienceMax: job.experience.maximum,
          skills: job.skills,
          description: `Need ${job.vacancies} ${job.title} profiles with quick turnaround.`,
          status: "Converted",
          priority: job.vacancies >= 6 ? "Urgent" : "High",
          job: job._id,
          requestedBy: clientUser._id,
          processedBy: adminUser._id,
          processedAt: new Date(),
          remarks: "Converted into live job for demo pipeline."
        }
      );
    }

    const employeeSeeds = [
      ["employee@hrms.com", "Test Employee", clients[0], jobs[1], shifts[0], "Operations Executive", "Operations", "A", 42000],
      ["priya.sharma@hrms.com", "Priya Sharma", clients[0], jobs[0], shifts[0], "Frontend Developer", "Engineering", "A", 68000],
      ["rahul.verma@hrms.com", "Rahul Verma", clients[0], jobs[0], shifts[0], "Frontend Developer", "Engineering", "A", 72000],
      ["neha.gupta@hrms.com", "Neha Gupta", clients[0], jobs[1], shifts[0], "HR Operations Executive", "Operations", "A", 48000],
      ["farhan.ali@hrms.com", "Farhan Ali", clients[0], jobs[2], shifts[0], "Customer Support Associate", "BPO Operations", "B", 31000],
      ["sana.khan@hrms.com", "Sana Khan", clients[1], jobs[3], shifts[1], "Warehouse Supervisor", "Logistics", "B", 46000],
      ["vikram.singh@hrms.com", "Vikram Singh", clients[1], jobs[3], shifts[1], "Shift Lead", "Logistics", "B", 39000],
      ["rohit.kumar@hrms.com", "Rohit Kumar", clients[1], jobs[4], shifts[1], "Picker Packer", "Warehouse", "C", 22000],
      ["kavita.yadav@hrms.com", "Kavita Yadav", clients[1], jobs[4], shifts[1], "Dispatch Associate", "Warehouse", "C", 23000],
      ["manoj.patel@hrms.com", "Manoj Patel", clients[1], jobs[4], shifts[1], "Inventory Associate", "Warehouse", "C", 24000],
      ["isha.malhotra@hrms.com", "Isha Malhotra", clients[2], jobs[5], shifts[2], "Store Associate", "Retail", "C", 26000],
      ["ankit.batra@hrms.com", "Ankit Batra", clients[2], jobs[5], shifts[2], "Cashier", "Retail", "C", 25000],
      ["simran.kaur@hrms.com", "Simran Kaur", clients[2], jobs[6], shifts[2], "Retail Floor Supervisor", "Retail", "B", 39000],
      ["deepak.rawat@hrms.com", "Deepak Rawat", clients[2], jobs[6], shifts[2], "Visual Merchandiser", "Retail", "B", 36000],
      ["meera.joshi@hrms.com", "Meera Joshi", clients[2], jobs[5], shifts[2], "Customer Service Associate", "Retail", "C", 27000],
      ["anjali.mehra@hrms.com", "Anjali Mehra", clients[3], jobs[7], shifts[3], "Patient Care Assistant", "Nursing Support", "C", 28000],
      ["suresh.pal@hrms.com", "Suresh Pal", clients[3], jobs[7], shifts[3], "Ward Assistant", "Nursing Support", "C", 24000],
      ["rhea.singh@hrms.com", "Rhea Singh", clients[3], jobs[8], shifts[3], "Front Desk Executive", "Administration", "B", 34000],
      ["arjun.nair@hrms.com", "Arjun Nair", clients[3], jobs[8], shifts[3], "Billing Coordinator", "Administration", "B", 36000],
      ["pooja.saini@hrms.com", "Pooja Saini", clients[3], jobs[7], shifts[3], "Patient Coordinator", "Nursing Support", "C", 29000],
      ["sandeep.yadav@hrms.com", "Sandeep Yadav", clients[4], jobs[9], shifts[4], "Facility Supervisor", "Operations", "B", 38000],
      ["lata.mishra@hrms.com", "Lata Mishra", clients[4], jobs[9], shifts[4], "Housekeeping Supervisor", "Operations", "B", 32000],
      ["nitin.chauhan@hrms.com", "Nitin Chauhan", clients[4], jobs[10], shifts[4], "Security Coordinator", "Security", "B", 35000],
      ["geeta.rana@hrms.com", "Geeta Rana", clients[4], jobs[9], shifts[4], "Checklist Auditor", "Operations", "B", 33000],
      ["aman.tyagi@hrms.com", "Aman Tyagi", clients[4], jobs[10], shifts[4], "Shift Security Lead", "Security", "B", 34000]
    ];

    const employees = [];
    const offers = [];

    for (let index = 0; index < employeeSeeds.length; index += 1) {
      const [email, name, client, job, shift, designation, department, grade, salary] = employeeSeeds[index];
      const user = await ensureUser({
        name,
        email,
        password: email === "employee@hrms.com" ? "Employee@123" : "Employee@123",
        role: "Employee",
        client: client._id
      });

      const candidate = await upsertByKey(
        Candidate,
        { user: user._id, job: job._id },
        {
          user: user._id,
          job: job._id,
          client: client._id,
          phone: `98765432${String(index).padStart(2, "0")}`,
          currentCompany: "Demo Previous Employer",
          currentDesignation: designation,
          totalExperience: 2 + index,
          currentSalary: Math.round(salary * 0.75),
          expectedSalary: salary,
          noticePeriod: index % 2 === 0 ? "Immediate" : "15 Days",
          skills: job.skills,
          resumeUrl: "https://example.com/demo-resume.pdf",
          status: "Joined",
          shortlistedBy: adminUser._id,
          shortlistedAt: daysFromNow(-20),
          matchScore: 86,
          matchRecommendation: "Strong Match",
          matchedSkills: job.skills,
          missingSkills: [],
          matchSummary: "Strong demo profile for role.",
          matchCalculatedAt: new Date()
        }
      );

      const earnings = [
        { name: "Basic", amount: Math.round(salary * 0.55) },
        { name: "HRA", amount: Math.round(salary * 0.25) },
        { name: "Special Allowance", amount: Math.round(salary * 0.2) }
      ];
      const deductions = [
        { name: "PF", amount: 1800 },
        { name: "Professional Tax", amount: 200 }
      ];
      const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
      const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);

      const offer = await upsertByKey(
        Offer,
        { candidate: candidate._id },
        {
          candidate: candidate._id,
          client: client._id,
          job: job._id,
          designation,
          joiningDate: daysFromNow(-45 + index),
          earnings,
          deductions,
          totalEarnings,
          totalDeductions,
          netSalary: totalEarnings - totalDeductions,
          ctc: totalEarnings * 12,
          status: "Accepted",
          internalApprovalStatus: "Not Required",
          requiresInternalApproval: false,
          createdBy: adminUser._id,
          approvedBy: adminUser._id
        }
      );
      offers.push(offer);

      const employee = await upsertByKey(
        Employee,
        { user: user._id },
        {
          employeeCode: `${client.code}-EMP-${String(index + 1).padStart(4, "0")}`,
          user: user._id,
          client: client._id,
          offer: offer._id,
          designation,
          department,
          grade,
          joiningDate: offer.joiningDate,
          personalDetails: {
            phone: `98765432${String(index).padStart(2, "0")}`,
            aadhaar: `12341234123${index}`,
            pan: `ABCDE123${index}F`,
            address: `${client.address.city}, ${client.address.state}`
          },
          bankDetails: {
            accountHolderName: name,
            accountNumber: `123456789${index}`,
            bankName: "HDFC Bank",
            ifscCode: "HDFC0001234"
          },
          documents: [
            {
              type: "Aadhaar",
              title: "Aadhaar Card",
              url: "https://example.com/aadhaar.pdf",
              uploadedBy: adminUser._id,
              verificationStatus: index % 3 === 0 ? "Pending" : "Verified",
              verifiedBy: index % 3 === 0 ? null : adminUser._id,
              verifiedAt: index % 3 === 0 ? null : new Date()
            },
            {
              type: "PAN",
              title: "PAN Card",
              url: "https://example.com/pan.pdf",
              uploadedBy: adminUser._id,
              verificationStatus: "Verified",
              verifiedBy: adminUser._id,
              verifiedAt: new Date()
            }
          ],
          roster: shift.name,
          shift: shift._id,
          approvers: [hrUser._id, adminUser._id],
          status: "Active",
          createdBy: adminUser._id
        }
      );
      employees.push(employee);

      await upsertByKey(
        Payroll,
        { employee: employee._id, month: currentMonth, year: currentYear },
        {
          employee: employee._id,
          client: client._id,
          month: currentMonth,
          year: currentYear,
          totalWorkingDays: 30,
          payableDays: index % 4 === 0 ? 29 : 30,
          earnings,
          deductions,
          grossSalary: totalEarnings,
          attendanceDeduction: index % 4 === 0 ? 1000 : 0,
          totalDeductions: totalDeductions + (index % 4 === 0 ? 1000 : 0),
          netSalary: totalEarnings - totalDeductions - (index % 4 === 0 ? 1000 : 0),
          status: index % 2 === 0 ? "Paid" : "Confirmed",
          isLocked: true,
          generatedBy: payrollUser._id,
          confirmedBy: payrollUser._id,
          confirmedAt: new Date(),
          paidAt: index % 2 === 0 ? new Date() : null
        }
      );
    }

    const candidateStages = ["Applied", "Shortlisted", "Interview", "Submitted to Client", "Client Shortlisted", "Offered"];
    const candidateNames = [
      "Aditi Rao", "Mohit Bansal", "Tanya Arora", "Harsh Vardhan", "Ritu Sethi",
      "Imran Sheikh", "Kunal Dagar", "Nandini Roy", "Yogesh Malik", "Shreya Jain",
      "Vivek Tomar", "Pallavi Nair", "Gaurav Saxena", "Nikita Ghosh", "Aftab Khan",
      "Raman Gill", "Swati Mishra", "Devansh Kapoor", "Bhavna Tiwari", "Prakash Chauhan",
      "Mansi Bedi", "Jatin Grover", "Kirti Rawal", "Sameer Qureshi", "Lavanya Iyer",
      "Varun Sood", "Payal Dutta", "Chirag Ahuja", "Komal Thakur", "Rakesh Bisht"
    ];

    for (let index = 0; index < candidateNames.length; index += 1) {
      const job = jobs[index % jobs.length];
      const candidateName = candidateNames[index];
      const emailName = candidateName.toLowerCase().replace(/\s+/g, ".");
      const user = await ensureUser({
        name: candidateName,
        email: index === 0 ? "candidate1@hrms.com" : `${emailName}@talent.hrms.com`,
        password: "Candidate@123",
        role: "Candidate"
      });

      await upsertByKey(
        Candidate,
        { user: user._id, job: job._id },
        {
          user: user._id,
          job: job._id,
          client: job.client,
          phone: `90000000${String(index).padStart(2, "0")}`,
          currentCompany: index % 2 ? "Fresh Talent Pool" : "Previous Employer",
          currentDesignation: job.title,
          totalExperience: 1 + (index % 5),
          currentSalary: job.salaryRange.minimum - 5000,
          expectedSalary: job.salaryRange.minimum + 8000,
          noticePeriod: ["Immediate", "15 Days", "30 Days"][index % 3],
          skills: job.skills.slice(0, 2),
          resumeUrl: "https://example.com/candidate-resume.pdf",
          status: candidateStages[index % candidateStages.length],
          shortlistedBy: index % 3 ? adminUser._id : null,
          shortlistedAt: index % 3 ? daysFromNow(-index) : null,
          matchScore: 62 + index * 3,
          matchRecommendation: index > 7 ? "Strong Match" : index > 3 ? "Good Match" : "Review",
          matchedSkills: job.skills.slice(0, 2),
          missingSkills: job.skills.slice(2),
          matchSummary: "Seeded candidate profile for realistic demo pipeline.",
          matchCalculatedAt: new Date()
        }
      );
    }

    for (let index = 0; index < employees.length; index += 1) {
      const employee = employees[index];
      const shift = shifts.find((item) => item._id.toString() === employee.shift?.toString()) || shifts[0];
      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);

      const checkIn = index % 3 === 0 ? atTime(baseDate, 9, 52) : atTime(baseDate, 9, 25);
      const checkOut = index % 2 === 0 ? atTime(baseDate, 19, 5) : atTime(baseDate, 18, 20);
      const workMinutes = Math.round((checkOut - checkIn) / (1000 * 60));
      const lateMinutes = index % 3 === 0 ? 12 : 0;
      const overtimeMinutes = index % 2 === 0 ? 35 : 0;

      await upsertByKey(
        Attendance,
        { employee: employee._id, date: baseDate },
        {
          employee: employee._id,
          client: employee.client,
          shift: shift._id,
          date: baseDate,
          checkIn,
          checkOut,
          scheduledStart: atTime(baseDate, Number(shift.startTime.split(":")[0]), Number(shift.startTime.split(":")[1])),
          scheduledEnd: atTime(baseDate, Number(shift.endTime.split(":")[0]), Number(shift.endTime.split(":")[1])),
          graceMinutes: shift.graceMinutes,
          workingHours: Number((workMinutes / 60).toFixed(2)),
          workMinutes,
          lateMinutes,
          earlyLeaveMinutes: 0,
          overtimeMinutes,
          smartStatus: lateMinutes ? "Late" : overtimeMinutes ? "Overtime" : "On Time",
          status: "Present",
          source: "Manual Upload",
          remarks: "Seeded live attendance for dashboard demo.",
          updatedBy: adminUser._id
        }
      );
    }

    for (let index = 0; index < clients.length; index += 1) {
      const client = clients[index];
      const monthlyAmount = [285000, 198000, 156000, 224000, 176000][index] || 125000;
      const subTotal = monthlyAmount;
      const taxAmount = Math.round(subTotal * 0.18);

      await upsertByKey(
        Invoice,
        { invoiceNumber: `INV-${currentYear}-${String(index + 1).padStart(4, "0")}` },
        {
          invoiceNumber: `INV-${currentYear}-${String(index + 1).padStart(4, "0")}`,
          client: client._id,
          month: currentMonth,
          year: currentYear,
          dueDate: daysFromNow(index === 1 ? -3 : 10 + index),
          items: [
            {
              description: "Monthly manpower services",
              quantity: 1,
              rate: subTotal,
              amount: subTotal
            }
          ],
          subTotal,
          taxRate: 18,
          taxAmount,
          totalAmount: subTotal + taxAmount,
          status: index === 0 ? "Paid" : "Sent",
          notes: "Seeded invoice for executive analytics.",
          generatedBy: adminUser._id
        }
      );
    }

    const leaveFromDate = daysFromNow(2);
    const leaveToDate = daysFromNow(3);

    const leave = await upsertByKey(
      LeaveRequest,
      { employee: employees[0]._id, fromDate: leaveFromDate },
      {
        employee: employees[0]._id,
        client: employees[0].client,
        leaveType: "Casual",
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        totalDays: 2,
        reason: "Family event",
        status: "Pending",
        approver: hrUser._id
      }
    );

    const expense = await upsertByKey(
      ExpenseClaim,
      { claimNumber: `CLM-${currentYear}-DEMO-001` },
      {
        employee: employees[1]._id,
        client: employees[1].client,
        claimNumber: `CLM-${currentYear}-DEMO-001`,
        title: "Client visit cab reimbursement",
        items: [
          {
            category: "Travel",
            expenseDate: daysFromNow(-1),
            description: "Cab to client office",
            amount: 1450,
            receiptUrl: "https://example.com/receipt.pdf"
          }
        ],
        totalAmount: 1450,
        approver: hrUser._id,
        status: "Pending"
      }
    );

    const workflowSeeds = [
      ["Leave", "LeaveRequest", leave._id, employees[0].client, employees[0].user, "High", 8],
      ["Expense", "ExpenseClaim", expense._id, employees[1].client, employees[1].user, "Critical", 4],
      ["Offer", "Offer", offers[0]._id, offers[0].client, adminUser._id, "Medium", 24]
    ];

    for (const [requestType, requestModel, requestId, client, requestedBy, priority, slaHours] of workflowSeeds) {
      await upsertByKey(
        Workflow,
        { requestModel, requestId },
        {
          client,
          requestType,
          requestId,
          requestModel,
          requestedBy,
          steps: [
            { sequence: 1, approver: hrUser._id, status: "Pending" },
            { sequence: 2, approver: adminUser._id, status: "Pending" }
          ],
          currentStep: 1,
          priority,
          slaHours,
          dueAt: daysFromNow(priority === "Critical" ? -1 : 1),
          escalationLevel: priority === "Critical" ? 1 : 0,
          status: "Pending"
        }
      );
    }

    await upsertByKey(
      ESignRequest,
      { title: "Demo Appointment Letter - Test Employee", signer: employees[0].user },
      {
        title: "Demo Appointment Letter - Test Employee",
        documentType: "Appointment Letter",
        documentUrl: "https://example.com/appointment-letter.pdf",
        signedDocumentUrl: "",
        client: employees[0].client,
        employee: employees[0]._id,
        signer: employees[0].user,
        signerName: "Test Employee",
        signerEmail: "employee@hrms.com",
        status: "Pending",
        expiresAt: daysFromNow(5),
        createdBy: adminUser._id
      }
    );

    await upsertByKey(
      ESignRequest,
      { title: "Signed NDA - Priya Sharma", signer: employees[1].user },
      {
        title: "Signed NDA - Priya Sharma",
        documentType: "Agreement",
        documentUrl: "https://example.com/nda.pdf",
        signedDocumentUrl: "https://example.com/nda.pdf",
        client: employees[1].client,
        employee: employees[1]._id,
        signer: employees[1].user,
        signerName: "Priya Sharma",
        signerEmail: "priya.employee@hrms.com",
        status: "Signed",
        signatureText: "Priya Sharma",
        expiresAt: daysFromNow(30),
        signedAt: daysFromNow(-2),
        signerIp: "103.25.42.10",
        signerUserAgent: "Seeded demo signature",
        createdBy: adminUser._id
      }
    );

    const integrationSeeds = [
      {
        name: "Zoho Payroll Sync",
        provider: "Zoho Payroll",
        category: "Payroll",
        status: "Connected",
        environment: "Production",
        baseUrl: "https://payroll.zoho.in/api/v1",
        webhookUrl: "https://hrms-manpower-backend.onrender.com/api/webhooks/zoho-payroll",
        authType: "OAuth",
        maskedCredential: "oauth_zoho_****_live",
        syncDirection: "Export",
        objects: ["Employees", "Attendance", "Payroll"],
        lastSyncAt: daysFromNow(-1),
        nextSyncAt: daysFromNow(1),
        syncStatus: "Healthy",
        recordsSynced: 1840,
        errorRate: 0.4,
        owner: adminUser._id,
        syncLogs: [
          {
            status: "Success",
            message: "Attendance and employee master pushed to payroll.",
            recordsProcessed: 126,
            durationMs: 920,
            ranBy: adminUser._id
          }
        ]
      },
      {
        name: "Tally Prime Billing",
        provider: "Tally Prime",
        category: "Accounting",
        status: "Connected",
        environment: "Production",
        baseUrl: "https://api.tallysolutions.com",
        webhookUrl: "https://hrms-manpower-backend.onrender.com/api/webhooks/tally",
        authType: "API Key",
        maskedCredential: "tally_live_****_84",
        syncDirection: "Export",
        objects: ["Invoices", "Clients", "Receipts"],
        lastSyncAt: daysFromNow(-2),
        nextSyncAt: daysFromNow(1),
        syncStatus: "Healthy",
        recordsSynced: 312,
        errorRate: 0,
        owner: payrollUser._id,
        syncLogs: [
          {
            status: "Success",
            message: "Invoices exported to accounting ledger.",
            recordsProcessed: 18,
            durationMs: 640,
            ranBy: payrollUser._id
          }
        ]
      },
      {
        name: "Naukri Recruiter Pipeline",
        provider: "Naukri",
        category: "ATS",
        status: "Needs Attention",
        environment: "Production",
        baseUrl: "https://api.naukri.com/recruiter",
        webhookUrl: "https://hrms-manpower-backend.onrender.com/api/webhooks/naukri",
        authType: "API Key",
        maskedCredential: "naukri_****_expired",
        syncDirection: "Import",
        objects: ["Candidates", "Applications", "Resumes"],
        lastSyncAt: daysFromNow(-4),
        nextSyncAt: daysFromNow(0),
        syncStatus: "Delayed",
        recordsSynced: 768,
        errorRate: 5.2,
        owner: hrUser._id,
        syncLogs: [
          {
            status: "Warning",
            message: "Candidate import delayed. API key rotation required.",
            recordsProcessed: 0,
            durationMs: 400,
            ranBy: hrUser._id
          }
        ]
      },
      {
        name: "WhatsApp HR Alerts",
        provider: "WhatsApp Business",
        category: "Communication",
        status: "Connected",
        environment: "Production",
        baseUrl: "https://graph.facebook.com/v20.0",
        webhookUrl: "https://hrms-manpower-backend.onrender.com/api/webhooks/whatsapp",
        authType: "Webhook Secret",
        maskedCredential: "wa_secret_****_prod",
        syncDirection: "Export",
        objects: ["Interview Reminders", "Offer Alerts", "Leave Notifications"],
        lastSyncAt: daysFromNow(0),
        nextSyncAt: daysFromNow(1),
        syncStatus: "Healthy",
        recordsSynced: 2240,
        errorRate: 0.8,
        owner: adminUser._id,
        syncLogs: [
          {
            status: "Success",
            message: "Candidate interview reminders delivered.",
            recordsProcessed: 34,
            durationMs: 780,
            ranBy: adminUser._id
          }
        ]
      }
    ];

    for (const item of integrationSeeds) {
      await upsertByKey(Integration, { provider: item.provider }, item);
    }

    console.log("");
    console.log("Demo data ready:");
    console.log("Admin: admin@hrms.com / Admin@123");
    console.log("HR: hr@hrms.com / Hr@12345");
    console.log("Payroll: payroll@hrms.com / Payroll@123");
    console.log("Client: client@hrms.com / Client@123");
    console.log("Employee: employee@hrms.com / Employee@123");
    console.log("Candidate: candidate1@hrms.com / Candidate@123");
    console.log("");
    console.log("Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
