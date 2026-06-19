const express = require("express");

const { getChangeLogs } = require("../controllers/changeLogController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("Super Admin", "HR Admin"),
  getChangeLogs
);

module.exports = router;