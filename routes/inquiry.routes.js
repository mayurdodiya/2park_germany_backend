const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { INQUIRY: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/createInquiry", auth({ usersAllowed: ["*"], isTokenRequired: false }), VALIDATOR.addInquiry, APIS.addInquiry);

/* Get Apis */
router.get("/getInquiry", auth({ usersAllowed: ["*"], isTokenRequired: false }), VALIDATOR.getInquiry, APIS.getInquiry);

/* Delete Apis */
router.delete("/deleteInquiry", VALIDATOR.deleteInquiry, APIS.deleteInquiry);


module.exports = router;
