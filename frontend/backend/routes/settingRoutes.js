const express = require("express");
const {
  getPublicSettings,
  getCompanySettings,
  updateCompanySettings
} = require("../controllers/settingController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/public", getPublicSettings);

router
  .route("/company")
  .get(protect, authorize("Super Admin", "HR Admin"), getCompanySettings)
  .put(protect, authorize("Super Admin"), updateCompanySettings);

module.exports = router;
