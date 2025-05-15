const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { ROLE: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/", VALIDATOR.createRole, APIS.createRole);
module.exports = router;
