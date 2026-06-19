const express = require("express");

const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require("../controllers/clientController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("Super Admin", "HR Admin", "Payroll Team"), getClients)
  .post(authorize("Super Admin", "HR Admin"), createClient);

router
  .route("/:id")
  .get(authorize("Super Admin", "HR Admin", "Payroll Team"), getClientById)
  .put(authorize("Super Admin", "HR Admin"), updateClient)
  .delete(authorize("Super Admin"), deleteClient);

module.exports = router;