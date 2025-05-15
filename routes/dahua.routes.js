const express = require("express");
const router = express.Router();
const { upload } = require("../service/image_multer");


const { DAHUA: { APIS } } = require("../controllers");

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
          uploadedFiles: req.files || []
      }
  };

  logger.info(JSON.stringify(logData, null, 2));
  next();
};

/* Post Apis */
router.post("/DeviceInfo",upload.any(), logMiddleware("DeviceInfo"), APIS.DeviceInfo);
router.post("/KeepAlive",upload.any(), logMiddleware("KeepAlive"), APIS.KeepAlive);
router.post("/TollgateInfo",upload.any(),logMiddleware("TollgateInfo"), APIS.TollgateInfo);
// router.post("/ParkingInfo",upload.any(), logMiddleware("ParkingInfo"), APIS.ParkingInfo);
// router.post("/AlarmInfo",upload.any(), logMiddleware("AlarmInfo"), APIS.AlarmInfo);
// router.post("/TrafficViolationInfo",upload.any(), logMiddleware("TrafficViolationInfo"), APIS.TrafficViolationInfo);
// router.post("/TrafficFluxInfo", upload.any(), logMiddleware("TrafficFluxInfo"), APIS.TrafficFluxInfo);
// router.post("/TimedParkingSpaceInfo", upload.any(), logMiddleware("TimedParkingSpaceInfo"), APIS.TimedParkingSpaceInfo);


module.exports = router;