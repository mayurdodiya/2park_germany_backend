const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { upload } = require("../service/image_multer");
const { USER_TYPE } = require("../json/enums.json");

const {
  DASHBOARD: { VALIDATOR, APIS },
} = require("../controllers");

const { getLogger } = require("../utils/winston");

const logMiddleware = (apiName) => (req, res, next) => {
  const logger = getLogger(apiName);

  const logData = {
    message: "Data received successfully!",
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
      uploadedFiles: req.files || [],
    },
  };

  logger.info(JSON.stringify(logData, null, 2));
  next();
};

/* Get Apis */
router.get("/bookingPerformance",  auth({ usersAllowed: [USER_TYPE.SUPER_ADMIN] }), logMiddleware("bookingPerformance"), APIS.bookingPerformance);
router.get("/getLast12MonthPerformance",  auth({ usersAllowed: [USER_TYPE.SUPER_ADMIN] }), logMiddleware("getLast12MonthPerformance"), APIS.getLast12MonthPerformance);
router.get("/getAvgOfWeekDays",  auth({ usersAllowed: [USER_TYPE.SUPER_ADMIN] }), logMiddleware("getAvgOfWeekDays"), APIS.getAvgOfWeekDays);

module.exports = router;
