const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roles = [
  "Super Admin",
  "HR Admin",
  "Client Approver",
  "Manager",
  "Employee",
  "Payroll Team",
  "Candidate"
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: roles,
      default: "Candidate"
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);