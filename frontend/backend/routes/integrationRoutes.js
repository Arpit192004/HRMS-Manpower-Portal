const express = require("express");
const {
  createIntegration,
  getIntegrations,
  runIntegrationSync,
  updateIntegration
} = require("../controllers/integrationController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("Super Admin", "HR Admin"));

router.route("/").get(getIntegrations).post(authorize("Super Admin"), createIntegration);
router.put("/:id", authorize("Super Admin"), updateIntegration);
router.post("/:id/sync", runIntegrationSync);

module.exports = router;
