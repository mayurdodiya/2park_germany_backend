const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { CONTECT: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/", VALIDATOR.addContect, APIS.addContect);

/* Get Apis */
router.get("/getContect", auth({ usersAllowed: ["*"], isTokenRequired: false }), VALIDATOR.getContect, APIS.getContect);

/* Delete Apis */
router.delete("/deleteContect", VALIDATOR.deleteContect, APIS.deleteContect);


module.exports = router;
