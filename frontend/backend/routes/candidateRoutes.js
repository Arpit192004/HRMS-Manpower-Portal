const express = require("express");

const {
  getCandidates,
  getCandidateById,
  applyForJob,
  updateCandidateStatus,
  refreshCandidateMatch,
  refreshAllCandidateMatches,
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
  "/match/recalculate-all",
  authorize("Super Admin", "HR Admin"),
  refreshAllCandidateMatches
);

router.patch(
  "/:id/status",
  authorize("Super Admin", "HR Admin"),
  updateCandidateStatus
);

router.patch(
  "/:id/match",
  authorize("Super Admin", "HR Admin"),
  refreshCandidateMatch
);

router
  .route("/:id")
  .get(getCandidateById)
  .delete(authorize("Candidate"), withdrawApplication);

module.exports = router;
