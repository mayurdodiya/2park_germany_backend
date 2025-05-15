const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { NOTIFICATION: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/createNotification", auth({ usersAllowed: [ADMIN] }), VALIDATOR.createNotification, APIS.createNotification);

/* Put Apis */
router.put("/pinNotification", auth({ usersAllowed: ["*"] }), VALIDATOR.pinNotification, APIS.pinNotification);
router.put("/unPinNotification", auth({ usersAllowed: ["*"] }), VALIDATOR.unPinNotification, APIS.unPinNotification);

/* Get notification */
router.get("/getAllNotification", auth({ usersAllowed: [ADMIN] }), VALIDATOR.getAllNotification, APIS.getAllNotification);

/* Get user notification */
router.get("/getUserNotification", auth({ usersAllowed: ["*"] }), VALIDATOR.getUserNotification, APIS.getUserNotification);

/* Delete notification */
router.delete("/deleteNotification", auth({ usersAllowed: ["*"] }), VALIDATOR.deleteNotification, APIS.deleteNotification);

module.exports = router;
