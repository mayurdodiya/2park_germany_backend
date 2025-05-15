const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

aws.config.update({
  secretAccessKey: process.env.SECRET_KEY,
  accessKeyId: process.env.ACCESSKEYID,
  region: process.env.REGION,
});

const s3 = new aws.S3();

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.BUCKET,
//         contentType: multerS3.AUTO_CONTENT_TYPE,
//         metadata: function (req, file, cb) {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (req, file, cb) {
//             cb(
//                 null,
//                 "XXXXX/" +
//                 "xxxxx_bucket" +
//                 "-" +
//                 Date.now().toString() +
//                 Date.now().toString() +
//                 "." +
//                 file.mimetype.split("/")[file.mimetype.split("/").length - 1]
//             );
//         },
//     }),

//     limits: { fileSize: 1024 * 1024 * 20, files: 10 },
// });

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.BUCKET,
//         contentType: multerS3.AUTO_CONTENT_TYPE,
//         metadata: function (req, file, cb) {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (req, file, cb) {
//             cb(null, "wepro/blob" + "-" + new Date().getTime() + file.originalname);
//         },
//     }),

//     limits: { fileSize: 1024 * 1024 * 70, files: 10 },
// });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, "twopark/images/" + new Date().getTime() + file.originalname);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 70 }, // Limit file size to 70 MB
});

// upload pdf in S3 from local dir
const uploadLocalPdfToS3OLD = async (fileNameData) => {
  const fileName = fileNameData; // Your PDF file name in the root directory
  const filePath = path.join(__dirname, "..", fileName); // Full path to file

  const fileStream = fs.createReadStream(filePath);
  fileStream.on("error", (err) => {
    console.error("File error", err);
  });

  const uploadParams = {
    Bucket: process.env.BUCKET,
    Key: `twopark/pdf/${Date.now()}-${fileName}`, // Path + name in S3
    Body: fileStream,
    ContentType: "application/pdf",
    ACL: "private", // or 'public-read' if you want the file publicly accessible
  };

  try {
    const data = await s3.upload(uploadParams).promise();
    console.log("File uploaded successfully:", data.Location);
    return data?.Location;
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
};

const uploadLocalPdfToS3 = async ({ pdfBuffer, pdfFileName }) => {
  const uploadParams = {
    Bucket: process.env.BUCKET,
    Key: `twopark/pdf/${Date.now()}-${pdfFileName}`, // S3 path
    Body: pdfBuffer,
    ContentType: "application/pdf",
    ACL: "private", // or 'public-read'
  };

  try {
    const data = await s3.upload(uploadParams).promise();
    console.log("✅ File uploaded successfully:", data.Location);
    return data.Location;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    throw err;
  }
};

module.exports = { upload, uploadLocalPdfToS3 };
