const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { DESCRIPTION: { VALIDATOR, APIS } } = require("../controllers");

// Post API: Add a single description
router.post("/addDescription",
  // VALIDATOR.addDescription,
  APIS.addDescription
);

// Put API: Update the existing single description
router.put("/updateDescription",
  // VALIDATOR.updateDescription,
  APIS.updateDescription
);


router.get("/getDescription",
  // VALIDATOR.getDescriptions,
  APIS.getDescription
);

module.exports = router;
