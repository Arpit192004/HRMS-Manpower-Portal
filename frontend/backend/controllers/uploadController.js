const multer = require("multer");
const streamifier = require("streamifier");

const {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured
} = require("../utils/cloudinary");

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only PDF, DOC, DOCX and image files up to 5MB are allowed")
      );
    }

    callback(null, true);
  }
});

const uploadToCloudinary = (file, folder) => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("File is required");
    }

    if (!isCloudinaryConfigured()) {
      res.status(500);
      throw new Error("Cloudinary is not configured");
    }

    const folder = `hrms-manpower/${req.body.folder || "documents"}`;
    const result = await uploadToCloudinary(req.file, folder);

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadFile
};
