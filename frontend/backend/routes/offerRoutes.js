const express = require("express");

const {
  getOffers,
  getOfferById,
  createOffer,
  uploadDocument,
  approveOffer,
  sendOffer,
  respondToOffer
} = require("../controllers/offerController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getOffers)
  .post(authorize("Super Admin", "HR Admin"), createOffer);

router.patch(
  "/:id/documents",
  authorize("Super Admin", "HR Admin", "Candidate"),
  uploadDocument
);

router.patch(
  "/:id/approve",
  authorize("Super Admin", "HR Admin"),
  approveOffer
);

router.patch(
  "/:id/send",
  authorize("Super Admin", "HR Admin"),
  sendOffer
);

router.patch(
  "/:id/respond",
  authorize("Candidate"),
  respondToOffer
);

router.get("/:id", getOfferById);

module.exports = router;