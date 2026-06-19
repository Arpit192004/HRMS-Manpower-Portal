const express = require("express");
const { createLead, getLeads, updateLead } = require("../controllers/leadController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", createLead);
router.get("/", protect, authorize("Super Admin", "HR Admin"), getLeads);
router.patch("/:id", protect, authorize("Super Admin", "HR Admin"), updateLead);

module.exports = router;
