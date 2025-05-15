const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set the directory where uploaded files will be stored
const uploadDir = path.join(__dirname, '..', 'uploads/');

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Define Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Set upload folder
  },
  filename: (req, file, cb) => {
    // Set the filename to be the current timestamp + original filename
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Multer upload middleware setup for a single file
const excelUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Set a file size limit (10MB here)
  },
  fileFilter: (req, file, cb) => {
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];
    if (validMimeTypes.includes(file.mimetype)) {
      cb(null, true);  // File type is valid
    } else {
      cb(new Error("Invalid file type. Only Excel files are allowed!"), false);
    }
  }
}).single("file");  // The field name expected in form-data (Postman)

module.exports = { excelUpload };
