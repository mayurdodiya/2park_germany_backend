const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { NEWSLATER: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/createNews", auth({ usersAllowed: ["*"], isTokenRequired: false }), VALIDATOR.addNewsLater, APIS.addNewsLater);

/* Get Apis */
router.get("/getNewsLater",  VALIDATOR.getNewsLater, APIS.getNewsLater);

/* Delete Apis */
router.delete("/deleteNewsLater", VALIDATOR.deleteNewsLater, APIS.deleteNewsLater);


module.exports = router;
