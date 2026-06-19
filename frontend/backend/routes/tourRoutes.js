const express = require("express");

const {
  getTourRequests,
  applyTour,
  processTourRequest,
  cancelTourRequest,
  completeTourRequest
} = require("../controllers/tourController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getTourRequests);

router.post(
  "/",
  authorize("Employee"),
  applyTour
);

router.patch(
  "/:id/process",
  authorize("Super Admin", "HR Admin", "Manager", "Client Approver"),
  processTourRequest
);

router.patch(
  "/:id/cancel",
  authorize("Employee"),
  cancelTourRequest
);

router.patch(
  "/:id/complete",
  authorize("Super Admin", "HR Admin", "Employee"),
  completeTourRequest
);

module.exports = router;