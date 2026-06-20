const express = require("express");

const {
  registerCandidate,
  login,
  getCurrentUser,
  changePassword,
  logoutAllSessions,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerCandidate);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getCurrentUser);
router.patch("/change-password", protect, changePassword);
router.post("/logout-all", protect, logoutAllSessions);

module.exports = router;
