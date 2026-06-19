const express = require("express");

const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public job viewing
router.get("/", getJobs);
router.get("/:id", getJobById);

// HR job management
router.post(
  "/",
  protect,
  authorize("Super Admin", "HR Admin"),
  createJob
);

router.put(
  "/:id",
  protect,
  authorize("Super Admin", "HR Admin"),
  updateJob
);

router.delete(
  "/:id",
  protect,
  authorize("Super Admin"),
  deleteJob
);

module.exports = router;