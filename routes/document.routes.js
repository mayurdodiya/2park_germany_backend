const express = require("express");
const router = express.Router();
const { upload } = require("../service/s3.upload");


const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { DOCUMENT: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */


/* Upload Document API */
router.post("/uploadDocument",
  // auth({ usersAllowed: ["*"], isTokenRequired: false }),
  VALIDATOR.uploadDocument,
  upload.single('file'),
  APIS.uploadDocument
);

// /* Get Documents by Category API */
router.get("/getDocumentsByCategory",
  // VALIDATOR.getDocumentsByCategory,
  APIS.getDocumentsByCategory
);

// /* Delete Document API */
// router.delete("/deleteDocument/:id",
//   VALIDATOR.deleteDocument,
//   APIS.deleteDocument
// );


module.exports = router;
