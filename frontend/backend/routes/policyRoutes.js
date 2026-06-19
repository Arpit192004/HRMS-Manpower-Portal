const express = require("express");

const {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy
} = require("../controllers/policyController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getPolicies)
  .post(authorize("Super Admin", "HR Admin"), createPolicy);

router
  .route("/:id")
  .get(getPolicyById)
  .put(authorize("Super Admin", "HR Admin"), updatePolicy)
  .delete(authorize("Super Admin"), deletePolicy);

module.exports = router;