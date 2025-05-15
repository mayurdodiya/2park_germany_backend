const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");


const { DAHUA_AUTH_PLATES: { VALIDATOR, APIS } } = require("../controllers");

// Create a location
router.post("/createAuthPlates", auth({ usersAllowed: ["*"] }), APIS.createAuthPlates);

// Get all locations
router.get("/getAllAuthPlates", auth({ usersAllowed: ["*"] }) ,APIS.getAllAuthPlates);

// Get location by ID
router.get("/getAuthPlatesById", VALIDATOR.getAuthPlatesById, APIS.getAuthPlatesById);

// Update location by ID
router.put("/updateAuthPlates", auth({ usersAllowed: ["*"] }), APIS.updateAuthPlates);

// Delete location by ID
router.delete("/deleteAuthPlates", auth({ usersAllowed: ["*"] }), APIS.deleteAuthPlates);

module.exports = router;

