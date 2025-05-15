const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");
// const { upload } = require("../service/image_multer")
const { upload } = require("../service/s3.upload")
const { STRAPER2: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"], isTokenRequired: false }), upload.array("image"), VALIDATOR.addStraper, APIS.addStraper);

/* Get Apis */
router.get("/getStraper", VALIDATOR.getStraper, APIS.getStraper)

/* Delete Api */
router.delete("/deleteStraper", VALIDATOR.deleteStraper, APIS.deleteStraper)

module.exports = router;
