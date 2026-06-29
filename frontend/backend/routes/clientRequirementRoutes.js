const express = require("express");
const {
  getRequirements,
  createRequirement,
  updateRequirement,
  convertRequirementToJob
} = require("../controllers/clientRequirementController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("Super Admin", "HR Admin", "Client Approver", "Manager"), getRequirements)
  .post(authorize("Super Admin", "HR Admin", "Client Approver", "Manager"), createRequirement);

router.post(
  "/:id/convert",
  authorize("Super Admin", "HR Admin"),
  convertRequirementToJob
);

router.patch(
  "/:id",
  authorize("Super Admin", "HR Admin", "Client Approver", "Manager"),
  updateRequirement
);

module.exports = router;
