const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { DATESELECT: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/addSelectDate", auth({ usersAllowed: ["*"] }), VALIDATOR.addSelectDate, APIS.addSelectDate);

/* Get notification */
router.get("/getSelectDate", VALIDATOR.getSelectDate, APIS.getSelectDate);

module.exports = router;
