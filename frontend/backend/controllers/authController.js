const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  client: user.client,
  isActive: user.isActive
});

const registerCandidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      res.status(409);
      throw new Error("User already exists with this email");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Candidate"
    });

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account is inactive");
    }

    res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    user: formatUserResponse(req.user)
  });
};

module.exports = {
  registerCandidate,
  login,
  getCurrentUser
};