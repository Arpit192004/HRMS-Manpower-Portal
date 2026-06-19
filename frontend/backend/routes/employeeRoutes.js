const express = require("express");

const {
  getEmployees,
  getEmployeeById,
  createEmployeeFromOffer,
  updateEmployee,
  updateEmployeeStatus
} = require("../controllers/employeeController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getEmployees)
  .post(authorize("Super Admin", "HR Admin"), createEmployeeFromOffer);

router.patch(
  "/:id/status",
  authorize("Super Admin", "HR Admin"),
  updateEmployeeStatus
);

router
  .route("/:id")
  .get(getEmployeeById)
  .put(authorize("Super Admin", "HR Admin"), updateEmployee);

module.exports = router;