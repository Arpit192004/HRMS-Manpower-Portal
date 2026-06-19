const express = require("express");

const {
  getInterviews,
  getInterviewById,
  scheduleInterview,
  submitFeedback,
  skipInterview,
  updateInterview
} = require("../controllers/interviewController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("Super Admin", "HR Admin", "Manager"), getInterviews)
  .post(authorize("Super Admin", "HR Admin"), scheduleInterview);

router.patch(
  "/:id/feedback",
  authorize("Super Admin", "HR Admin", "Manager"),
  submitFeedback
);

router.patch(
  "/:id/skip",
  authorize("Super Admin", "HR Admin"),
  skipInterview
);

router
  .route("/:id")
  .get(authorize("Super Admin", "HR Admin", "Manager"), getInterviewById)
  .put(authorize("Super Admin", "HR Admin"), updateInterview);

module.exports = router;