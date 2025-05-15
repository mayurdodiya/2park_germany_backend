const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");
// const { upload } = require("../service/image_multer")
const { upload } = require("../service/s3.upload")
const { STRAPER: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"], isTokenRequired: false }), upload.single("image"), VALIDATOR.addStraper, APIS.addStraper);
router.post("/vattenfall", auth({ usersAllowed: ["*"], isTokenRequired: false }), upload.single("image"), VALIDATOR.vattenfall, APIS.vattenfall);

/* Get Apis */
router.get("/getStraper", VALIDATOR.getStraper, APIS.getStraper);
router.post("/getVattenfall", VALIDATOR.getVattenfall, APIS.getVattenfall);

/* Get team report */
router.get("/getTeamReport", auth({ usersAllowed: ["*"] }), VALIDATOR.getTeamReport, APIS.getTeamReport);
router.get("/getTeamVattenReport", auth({ usersAllowed: ["*"] }), VALIDATOR.getTeamVattenReport, APIS.getTeamVattenReport);
router.get("/getAllUserPatners", auth({ usersAllowed: ["*"] }), VALIDATOR.getAllUserPatners, APIS.getAllUserPatners);

/* Get user straper report */
router.get("/getStraReport", auth({ usersAllowed: ["*"] }), VALIDATOR.getStraReport, APIS.getStraReport);
// router.get("/getStraVattUserReport", auth({ usersAllowed: ["*"] }), VALIDATOR.getStraVattUserReport, APIS.getStraVattUserReport);
// router.get("/getStraReportById", VALIDATOR.getStraReportById, APIS.getStraReportById);
// router.get("/getUsersStrRepo", auth({ usersAllowed: ["*"] }), VALIDATOR.getUsersStrRepo, APIS.getUsersStrRepo);
router.get("/getStraperStatus", VALIDATOR.getStraperStatus, APIS.getStraperStatus);
// router.get("/getStrVattUserStatus", VALIDATOR.getStrVattUserStatus, APIS.getStrVattUserStatus);

/* Get user straper monthly report  */
router.get("/getStraperRepoMonth", auth({ usersAllowed: ["*"] }), VALIDATOR.getStraperRepoMonth, APIS.getStraperRepoMonth);
// router.get("/getStrRepoVattUserMonth", auth({ usersAllowed: ["*"] }), VALIDATOR.getStrRepoVattUserMonth, APIS.getStrRepoVattUserMonth);
// router.get("/getStrapRepoMonById", VALIDATOR.getStrapRepoMonById, APIS.getStrapRepoMonById);
// router.get("/getUsersStrRepoMon", auth({ usersAllowed: ["*"] }), APIS.getUsersStrRepoMon);
// router.get("/getUserStatusCount", auth({ usersAllowed: ["*"] }), VALIDATOR.getUserStatusCount, APIS.getUserStatusCount);

/* Update straper */
router.put("/updateStraper", VALIDATOR.updateStraper, APIS.updateStraper);
router.put("/updateStraperStatus", auth({ usersAllowed: ["*"] }), VALIDATOR.updateStraperStatus, APIS.updateStraperStatus);

/* Delete Api */
router.delete("/deleteStraper", VALIDATOR.deleteStraper, APIS.deleteStraper)
router.delete("/deleteVattenfall", VALIDATOR.deleteVattenfall, APIS.deleteVattenfall)

module.exports = router;
