const express = require("express");
const router = express.Router();


const { PROJECT: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/create",VALIDATOR.createProject, APIS.createProject);



/* Put Apis */
router.put("/update", VALIDATOR.updateProject, APIS.updateProject);


/* Get Apis */
router.get("/get", APIS.getProject);

/* Delete Apis */
router.delete("/deleteUser",VALIDATOR.DeleteProject, APIS.DeleteProject);

module.exports = router;
