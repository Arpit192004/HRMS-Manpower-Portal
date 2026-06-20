const express = require("express");

const { getSecurityLogs } = require("../controllers/securityLogController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("Super Admin", "HR Admin"),
  getSecurityLogs
);

module.exports = router;
