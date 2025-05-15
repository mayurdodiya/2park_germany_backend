const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { DAHUA_DEVICE: { VALIDATOR, APIS } } = require("../controllers");


/* Post APIs */
router.post("/createDevice", auth({ usersAllowed: [ADMIN] }), VALIDATOR.createDevice, APIS.createDevice);

/* Get APIs */
router.get("/getAllDevices", VALIDATOR.getAllDevices, APIS.getAllDevices);

/* Get by ID */
router.get("/getDeviceById", VALIDATOR.getDeviceById, APIS.getDeviceById);

/* Update by ID */
router.put("/updateDevice", auth({ usersAllowed: [ADMIN] }), VALIDATOR.updateDevice, APIS.updateDevice);

/* Delete by ID */
router.delete("/deleteDevice", auth({ usersAllowed: [ADMIN] }), VALIDATOR.deleteDevice, APIS.deleteDevice);

module.exports = router;

