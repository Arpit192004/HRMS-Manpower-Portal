const express = require("express");

const {
  askCopilot,
  getCopilotSuggestions
} = require("../controllers/copilotController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("Super Admin", "HR Admin", "Manager", "Client Approver", "Payroll Team"));

router.get("/suggestions", getCopilotSuggestions);
router.post("/ask", askCopilot);

module.exports = router;
