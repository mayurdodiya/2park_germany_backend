const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, SUPER_ADMIN } } = require("../json/enums.json");


const { DAHUA_LOCATION: { VALIDATOR, APIS } } = require("../controllers");

// Create a location
router.post("/createLocation", auth({ usersAllowed: [ADMIN] }), VALIDATOR.createLocation, APIS.createLocation);
router.post("/createLocationDevice", auth({ usersAllowed: [ADMIN] }), APIS.createLocationDevice);
router.post("/addParkingRequest", auth({ usersAllowed: ["*"] }), APIS.addParkingRequest);
//router.post("/createLocationWithDevice", APIS.createLocationWithDevice);

// Get all locations
router.get("/getAllLocations", APIS.getAllLocations);

// Get all events based on locations
router.get("/getLocationEvents", auth({ usersAllowed: ["*"] }), VALIDATOR.getLocationEvents, APIS.getLocationEvents);

//Get all events
router.get("/getAllEvents", APIS.getAllEvents);

// Get all violation events without location
router.get("/getViolationEvents", APIS.getViolationEvents);

// Get location by ID
router.get("/getLocationById", VALIDATOR.getLocationById, APIS.getLocationById);
router.get("/getLocationWithDevice", auth({ usersAllowed: ["*"] }), APIS.getLocationWithDevice);
router.get("/getAllAuthPlatesEvents", auth({ usersAllowed: ["*"] }), APIS.getAllAuthPlatesEvents);
router.get("/getUtiliseEvents", auth({ usersAllowed: ["*"] }), APIS.getUtiliseEvents);
router.get("/getAllLocationsWithEvents", auth({ usersAllowed: ["*"] }), APIS.getAllLocationsWithEvents);
router.get("/getParkingRequests", auth({ usersAllowed: ["*"] }), APIS.getParkingRequests);




// Update location by ID
router.put("/updateLocation", auth({ usersAllowed: [ADMIN] }), VALIDATOR.updateLocation, APIS.updateLocation);
router.put("/updateDeviceInLocation", auth({ usersAllowed: [ADMIN] }), APIS.updateDeviceInLocation);

//to update the violation status of the events by the super-admin
router.put("/updateViolationStatus", auth({ usersAllowed: ["*"] }), APIS.updateViolationStatus);

//this api is for toggling the location status, available or not available
router.patch("/toggleLocationStatus", auth({ usersAllowed: [ADMIN] }), APIS.toggleLocationStatus);  


// Delete location by ID
router.delete("/deleteLocation", auth({ usersAllowed: [ADMIN] }), VALIDATOR.deleteLocation, APIS.deleteLocation);
router.delete("/deleteDeviceInLocation", auth({ usersAllowed: [ADMIN] }), APIS.deleteDeviceInLocation);











module.exports = router;


