const express = require("express");
const router = express.Router();
const { upload } = require("../service/s3.upload");


const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { VIDEO: { APIS } } = require("../controllers");


router.post(
  "/uploadVideo",
  // auth({ usersAllowed: ["*"], isTokenRequired: false }), // Uncomment if authentication is required
  // VALIDATOR.uploadVideo, // Add validation middleware if implemented
  upload.single('file'),
  APIS.uploadVideo
);

/* Get All Videos API */
router.get(
  "/getAllVideos",
  // VALIDATOR.getAllVideos, // Add validation middleware if implemented
  APIS.getAllVideos
);

module.exports = router;

