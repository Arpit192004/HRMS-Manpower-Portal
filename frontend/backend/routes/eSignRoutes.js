const express = require("express");

const {
  createESignRequest,
  declineESignRequest,
  getESignRequests,
  signESignRequest
} = require("../controllers/eSignController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    authorize("Super Admin", "HR Admin", "Candidate", "Employee", "Client Approver", "Manager"),
    getESignRequests
  )
  .post(authorize("Super Admin", "HR Admin"), createESignRequest);

router.patch(
  "/:id/sign",
  authorize("Candidate", "Employee"),
  signESignRequest
);

router.patch(
  "/:id/decline",
  authorize("Candidate", "Employee"),
  declineESignRequest
);

module.exports = router;
