const express = require("express");

const { upload, uploadFile } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", upload.single("file"), uploadFile);

module.exports = router;
