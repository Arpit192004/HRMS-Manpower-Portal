const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("Super Admin", "HR Admin"));

router.route("/")
  .get(getUsers)
  .post(createUser);

router.patch("/:id/status", updateUserStatus);

router.route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(authorize("Super Admin"), deleteUser);

module.exports = router;