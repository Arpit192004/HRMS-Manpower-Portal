const express = require("express");

const {
  getCandidates,
  getCandidateById,
  applyForJob,
  updateCandidateStatus,
  withdrawApplication
} = require("../controllers/candidateController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getCandidates)
  .post(authorize("Candidate"), applyForJob);

router.patch(
  "/:id/status",
  authorize("Super Admin", "HR Admin"),
  updateCandidateStatus
);

router
  .route("/:id")
  .get(getCandidateById)
  .delete(authorize("Candidate"), withdrawApplication);

module.exports = router;