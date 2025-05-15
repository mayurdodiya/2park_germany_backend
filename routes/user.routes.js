const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
// const { upload } = require("../service/image_multer");
const { upload } = require("../service/s3.upload")
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { USER: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
// router.post("/signup", auth({ usersAllowed: [ADMIN] }), upload.array("image"), VALIDATOR.signup, APIS.signUp);
router.post("/signup", auth({ usersAllowed: [ADMIN] }), upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]), VALIDATOR.signup, APIS.signUp);
router.post("/signin", VALIDATOR.signIn, APIS.signIn);
router.post("/adminSignin", VALIDATOR.adminSignin, APIS.adminSignin);
router.post("/userToken", VALIDATOR.userToken, APIS.userToken);
router.post("/sendEmail", VALIDATOR.sendEmail, APIS.sendEmail);
router.post("/forgot", VALIDATOR.forgot, APIS.forgot);
router.post("/verifyOtp", VALIDATOR.verifyOtp, APIS.verifyOtp);
router.post("/verifyOtp/changePassword", auth({ usersAllowed: ["*"] }), VALIDATOR.afterOtpVerify, APIS.afterOtpVerify)
router.post("/changePassword", auth({ usersAllowed: ["*"] }), VALIDATOR.changePassword, APIS.changePassword);
router.post("/upload-image", auth({ usersAllowed: ["*"] }), upload.single("image"), APIS.uploadImage)


/* Put Apis */
router.put("/update", auth({ usersAllowed: ["*"] }), upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]), VALIDATOR.update, APIS.update);
router.put("/parkinglotownerupdate", auth({ usersAllowed: ["*"] }), upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]), VALIDATOR.parkinglotownerupdate, APIS.parkinglotownerupdate);
router.put("/toggleActive/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.toggleActive, APIS.delete)
router.put("/reactivateUser", auth({ usersAllowed: [ADMIN] }), VALIDATOR.reactivateUser, APIS.reactivateUser)

/* Update user lead  */
router.put("/updateUserLead", auth({ usersAllowed: ["*"] }), VALIDATOR.updateUserLead, APIS.updateUserLead);


/* Get Apis */
router.get("/get", VALIDATOR.fetch, APIS.getUser);
router.get("/getParkingLotOwner", APIS.getParkingLotOwner)
router.get("/dashboard", auth({ usersAllowed: [ADMIN] }), APIS.dashboardCounts);

router.get("/getUserPatners", auth({usersAllowed: ["*"]}), APIS.getUserPatners);
router.get("/getVattUserPatners", auth({usersAllowed: ["*"]}), APIS.getVattUserPatners);

//this api is used to get all the users except admin 
router.get("/getUsersExclAdmin", VALIDATOR.getUsersExclAdmin, APIS.getUsersExclAdmin); //auth({usersAllowed: [ADMIN]}),

/* Delete Apis */
router.delete("/deleteUser", auth({ usersAllowed: [ADMIN] }), VALIDATOR.deleteUser, APIS.deleteUser);

module.exports = router;
