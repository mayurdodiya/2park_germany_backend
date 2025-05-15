const express = require("express");
const router = express.Router();
const { excelUpload } = require("../service/excel_upload");

const { auth } = require("../middleware/auth");
const {
  USER_TYPE: { ADMIN , USER},
} = require("../json/enums.json");
// const { upload } = require("../service/image_multer")
const { upload } = require("../service/s3.upload");
const {
  VATTENFALL: { VALIDATOR, APIS },
} = require("../controllers");

//* POST ----------
/* Add user conform lead appointment */
router.post("/addAppointment", VALIDATOR.addAppointment, APIS.addAppointment);

/* Create user lead */
router.post(
  "/createLead",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.createLead,
  APIS.createLead
);

//* GET -----------
/* Get Apis */
router.get(
  "/getNewLead",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.getNewLead,
  APIS.getNewLead
);

/* Get user conform lead's */
router.get(
  "/getConformLead",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.getConformLead,
  APIS.getConformLead
);

/* Get single user (id) conform lead's */
router.get(
  "/getIdUserConformLead",
  VALIDATOR.getIdUserConformLead,
  APIS.getIdUserConformLead
);

/* Get lead status conform and cancel */
router.get(
  "/getLeadStatus",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.getLeadStatus,
  APIS.getLeadStatus
);

/* Get single lead ( vattenfall ) */
router.get("/getLead", VALIDATOR.getLead, APIS.getLead);

/* Get postalcode ( pincode ) */
router.post("/getPostalcode", VALIDATOR.getPostalcode, APIS.getPostalcode);

/* Get selected date lead's */
router.get(
  "/getSelectDateLead",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.getSelectDateLead,
  APIS.getSelectDateLead
);

/* Get user conform lead appointment */
router.get(
  "/getAppointment",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.getAppointment,
  APIS.getAppointment
);

/* Get user PLZ */
router.get("/getPLZUser", VALIDATOR.getPLZUser, APIS.getPLZUser);

//* PUT -----------
/* Update user lead status ( conform / reject ) */
router.put(
  "/updateNewLead",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.updateNewLead,
  APIS.updateNewLead
);

/* Update user conform lead appointment */
router.put(
  "/updateAppointment",
  auth({ usersAllowed: ["*"] }),
  VALIDATOR.updateAppointment,
  APIS.updateAppointment
);

/* Update conform lead ( vattenfall ) */
router.put(
  "/updateLeadVatten",
  upload.single("image"),
  VALIDATOR.updateLeadVatten,
  APIS.updateLeadVatten
);

/* Assign lead ( Admin ) */
router.put("/assignLead", VALIDATOR.assignLead, APIS.assignLead);

router.get("/uniqueFirma", VALIDATOR.uniqueFirma, APIS.uniqueFirma);

router.get("/wiedervorlagedata", auth({ usersAllowed: [USER] }), VALIDATOR.wiedervorlagedata, APIS.wiedervorlagedata);

// router.post("/uploadExcel", VALIDATOR.uploadExcelValidator, APIS.uploadExcel);
router.post(
  "/uploadExcel", 
  excelUpload,  // multer middleware to process the file upload
  VALIDATOR.uploadExcelValidator,  // validator for the file
  APIS.uploadExcel  // the actual API handler
);


module.exports = router;
