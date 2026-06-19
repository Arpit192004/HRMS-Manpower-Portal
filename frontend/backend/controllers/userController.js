const User = require("../models/User");

const allowedRoles = [
  "Super Admin",
  "HR Admin",
  "Client Approver",
  "Manager",
  "Employee",
  "Payroll Team",
  "Candidate"
];

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("client", "name code")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("client", "name code");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, client } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400);
      throw new Error("Name, email, password and role are required");
    }

    if (!allowedRoles.includes(role)) {
      res.status(400);
      throw new Error("Invalid user role");
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
      role,
      client: client || null
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        client: user.client,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, role, client, isActive } = req.body;

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (role && !allowedRoles.includes(role)) {
      res.status(400);
      throw new Error("Invalid user role");
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase()
      });

      if (existingUser) {
        res.status(409);
        throw new Error("Email is already being used");
      }
    }

    user.name = name ?? user.name;
    user.email = email?.toLowerCase() ?? user.email;
    user.role = role ?? user.role;
    user.client = client === "" ? null : client ?? user.client;
    user.isActive = isActive ?? user.isActive;

    if (password) {
      user.password = password;
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        client: user.client,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      res.status(400);
      throw new Error("isActive must be true or false");
    }

    if (req.params.id === req.user._id.toString() && !isActive) {
      res.status(400);
      throw new Error("You cannot deactivate your own account");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error("You cannot delete your own account");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
};