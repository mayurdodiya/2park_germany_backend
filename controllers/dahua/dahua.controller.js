const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const { logger } = require("../../utils/logger");
const mongoose = require("mongoose");
const moment = require('moment');
const EMAIL = require("../../service/mail.service")
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Create folder if it doesn't exist
const logDir = path.join(__dirname, '../keepalive');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
// Create local file-only logger
const keepAliveLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'keepalive.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        // winston.format.printf(
        //   (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
        // )
        winston.format.json() // Log in JSON format
      ),
    }),
  ],
});

const lastHeartbeat = {}; // Store last heartbeat timestamps
// const lastHeartbeat = { '8e6ac1aa-950a-c302-c96a-9f47443b950a': Date.now() - 10000, 'nkjdhg211-jkdsjbjh': Date.now() - 10000, };


const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
// const HEARTBEAT_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const HEARTBEAT_TIMEOUT = 5000; // 5 seconds


module.exports = {

  //Basic Information Push 
  DeviceInfo: async (req, res) => {
    try {
      // Log all received data
      console.log("Request Body DeviceInfo:", req.body);
      console.log("Request Query DeviceInfo:", req.query);
      console.log("Request Params DeviceInfo:", req.params);
      console.log("Request Headers DeviceInfo:", req.headers);
      // Log and process uploaded files
      if (req.files && req.files.length > 0) {
        console.log("Uploaded Files DeviceInfo:", req.files);
      } else {
        console.log("No files uploaded DeviceInfo.");
      }


      // Return the received data
      return res.status(200).json({
        message: "DeviceInfo Data received successfully!",
        data: {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          uploadedFiles: req.files || [],
        },
      });
    } catch (error) {
      console.error("Error handling request DeviceInfo:", error);

      return res.status(500).json({
        message: "An error occurred while processing your request DeviceInfo.",
      });
    }
  },

  KeepAlive: async (req, res) => {
    try {
      // Log all received data
      console.log("Request Body KeepAlive:", req.body);
      console.log("Request Query KeepAlive:", req.query);
      console.log("Request Params KeepAlive:", req.params);
      console.log("Request Headers KeepAlive:", req.headers);
      // Log and process uploaded files
      if (req.files && req.files.length > 0) {
        console.log("Uploaded Files KeepAlive:", req.files);
      } else {
        console.log("No files uploaded KeepAlive.");
      }


      //for logging
      const logData = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        uploadedFiles: req.files || [],
      };

      logger.info(`KeepAlive Request: ${JSON.stringify(logData)}`);
      keepAliveLogger.info(`KeepAlive Request: ${JSON.stringify(logData)}`);

      const { DeviceID, Active } = req.body;

      if (DeviceID && Active === 'keepAlive') {
        lastHeartbeat[DeviceID] = Date.now(); // Store latest ping
        logger.info(`✅ Heartbeat received from device ${DeviceID}`);
        keepAliveLogger.info(`Heartbeat from ${DeviceID}`);



      }



      // Return the received data
      return res.status(200).json({
        message: "Data received successfully! KeepAlive",
        data: {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          uploadedFiles: req.files || [],
          logData
        },
      });
    } catch (error) {
      console.error("Error handling request KeepAlive:", error);
      logger.error(`Error handling request KeepAlive: ${error.message}`);
      keepAliveLogger.error(`KeepAlive error: ${error.message}`);


      return res.status(500).json({
        message: "An error occurred while processing your request KeepAlive.",
      });
    }
  },

  TollgateInfo: async (req, res) => {
    try {
      console.log("🚘 Incoming TollgateInfo Request Body:", JSON.stringify(req.body, null, 2));

      const {
        Picture: {
          Plate: { PlateNumber } = {},
          SnapInfo: { DeviceID, SnapTime, Direction } = {},
          Vehicle: { VehicleType } = {}
        } = {}
      } = req.body;

      const formattedPlateNumber = PlateNumber ? PlateNumber.toUpperCase().replace(/-/g, '') : null;
      if (VehicleType === 'Motorcycle') {
        console.log("🏍️ Skipping motorcycle.");
        return res.status(200).json({ Result: true, Message: "Success" });
      }

      if (!formattedPlateNumber || !DeviceID || !Direction) {
        console.warn("⚠️ Missing required fields:", { formattedPlateNumber, DeviceID, Direction });
        return res.status(200).json({ Result: true, Message: "Success" });
      }

      const device = await DB.DAHDEVICE.findOne({ deviceId: DeviceID }).populate('locationId');
      if (!device || !device.locationId) {
        console.warn("❌ Device or location not found for DeviceID:", DeviceID);
        return res.status(200).json({ Result: true, Message: "Success" });
      }

      const {
        _id: locationId,
        name: locationName,
        maxParkingTime,
        businessHours,
        businessHoursMaxParkingTime,
        offHoursMaxParkingTime,
        publicHolidays
      } = device.locationId;

      console.log(`📍 Device found at location: ${locationName} (${locationId})`);

      // const snapMoment = moment.utc(SnapTime);
      // let maxTime = parseInt(maxParkingTime, 10);

      // // Check public holiday
      // const isPublicHoliday = publicHolidays?.some(holiday =>
      //   snapMoment.isSame(moment.utc(holiday), 'day')
      // );

      // console.log(`📅 Is public holiday: ${isPublicHoliday}`);

      // // Calculate dynamic max time
      // let dynamicMaxTime = parseInt(offHoursMaxParkingTime || maxParkingTime, 10);
      // if (!isPublicHoliday && businessHours) {
      //   const dayName = snapMoment.format('dddd').toLowerCase();
      //   const dayHours = businessHours[dayName];
      //   console.log(`🕐 Checking business hours for: ${dayName}`, dayHours);

      //   if (Array.isArray(dayHours)) {
      //     for (const { start, end } of dayHours) {
      //       const startTime = moment.utc(`${snapMoment.format('YYYY-MM-DD')}T${start}`);
      //       const endTime = moment.utc(`${snapMoment.format('YYYY-MM-DD')}T${end}`);
      //       if (snapMoment.isBetween(startTime, endTime, null, '[)')) {
      //         dynamicMaxTime = parseInt(businessHoursMaxParkingTime || maxParkingTime, 10);
      //         console.log("✅ Within business hours. Applying businessHoursMaxParkingTime:", dynamicMaxTime);
      //         break;
      //       }
      //     }
      //   }
      // }

      const snapMoment = moment.utc(SnapTime);
      let dynamicMaxTime = parseInt(offHoursMaxParkingTime || maxParkingTime, 10);
      console.log('dynamicMaxTime', dynamicMaxTime)


      if (Direction === "Reverse") {

        // Check if today is a public holiday
        const isPublicHoliday = publicHolidays?.some(holiday =>
          snapMoment.isSame(moment.utc(holiday), 'day')
        );

        console.log(`📅 Is public holiday: ${isPublicHoliday}`);

        // Calculate dynamic max time
        if (!isPublicHoliday && businessHours) {
          const dayName = snapMoment.format('dddd').toLowerCase();
          const dayHours = businessHours[dayName];
          console.log(`🕐 Checking business hours for: ${dayName}`, dayHours);

          if (Array.isArray(dayHours)) {
            // Check if the vehicle entered within business hours
            for (const { start, end } of dayHours) {
              const startTime = moment.utc(`${snapMoment.format('YYYY-MM-DD')}T${start}`);
              const endTime = moment.utc(`${snapMoment.format('YYYY-MM-DD')}T${end}`);

              // Check if entry is within business hours
              if (snapMoment.isBetween(startTime, endTime, null, '[)')) {
                // Set max parking time based on business hours
                dynamicMaxTime = parseInt(businessHoursMaxParkingTime || maxParkingTime, 10);
                console.log("✅ Within business hours. Applying businessHoursMaxParkingTime:", dynamicMaxTime);
                break;
              }
            }

            // If the vehicle enters near the end of business hours, apply additional parking time
            const endOfBusinessHoursStr = dayHours[0]?.end;
            const endOfBusinessHours = moment.utc(`${snapMoment.format('YYYY-MM-DD')}T${endOfBusinessHoursStr}`);
            if (snapMoment.isSameOrAfter(endOfBusinessHours.clone().subtract(1, 'minute'))) {
              dynamicMaxTime = parseInt(businessHoursMaxParkingTime || maxParkingTime, 10); // Apply 120 minutes if entering near the end of business hours
              console.log(`⏳ Entering near the end of business hours for ${dayName}. Applying additional parking time: ${dynamicMaxTime} minutes.`);
            }
          }
        }

      }
      let maxTime = dynamicMaxTime;
      console.log(`⏱️ Max allowed parking time (in minutes): ${maxTime}`);

      // Reverse (Exit) Direction
      const existingEvent = await DB.DAHEVENT.findOne({
        plateNumber: formattedPlateNumber,
        locationId,
        exitTime: null
      }).sort({ createdAt: -1 });

      if (existingEvent && Direction === "Reverse") {
        console.log("🚪 Exit detected for:", formattedPlateNumber);
        existingEvent.exitTime = moment.utc(SnapTime).toDate();
        existingEvent.isActive = false;

        const durationMs = existingEvent.exitTime - moment.utc(existingEvent.entryTime).toDate();
        const durationMinutes = Math.ceil(moment.duration(durationMs).asMinutes());

        const [isAuthorized, bookedPlate, extendedPlate] = await Promise.all([
          DB.DAHAUTHPLATE.findOne({ plateNumber: formattedPlateNumber, locationId }),
          DB.DAHBOOKEDPLATE.findOne({ plateNumber: formattedPlateNumber, locationId }),
          DB.DAHEXTENDEDPLATE.findOne({ plateNumber: formattedPlateNumber, locationId })
        ]);

        let isViolation = false;
        let violationDuration = '';
        let toTimeUTC = null;

        // Step 1: Determine correct toTimeUTC
        if (bookedPlate?.toTime) {
          const bookedToTime = moment.utc(bookedPlate.toTime);
          if (bookedToTime.isSameOrAfter(moment.utc(existingEvent.entryTime))) {
            toTimeUTC = bookedToTime;
          }
        }

        if (bookedPlate?.extended && extendedPlate?.toTime) {
          const extendedToTime = moment.utc(extendedPlate.toTime);
          if (extendedToTime.isSameOrAfter(moment.utc(existingEvent.entryTime))) {
            toTimeUTC = extendedToTime;
          }
        }

        // Step 2: Violation check
        if (toTimeUTC && moment.utc(existingEvent.exitTime).isAfter(toTimeUTC)) {
          isViolation = true;
          const violationTime = Math.ceil(moment.duration(moment.utc(existingEvent.exitTime).diff(toTimeUTC)).asMinutes());
          violationDuration = `${violationTime} minute(s)`;
          console.log("🚨 Violation due to booking expiry:", violationDuration);
        } else if (!bookedPlate && !extendedPlate) {
          isViolation = !isAuthorized && durationMinutes >= maxTime;
          if (isViolation) {
            const violationTime = durationMinutes - maxTime;
            violationDuration = `${violationTime} minute(s)`;
            console.log("🚨 Violation due to maxTime exceeded:", violationDuration);
          }
        }

        Object.assign(existingEvent, {
          isViolation,
          violationDuration,
          totalParkingTime: durationMinutes
        });

        await existingEvent.save();

        await DB.DAHEVENT.updateMany(
          { plateNumber: formattedPlateNumber, locationId, exitTime: null },
          [{ $set: { exitTime: "$entryTime" } }]
        );

        return res.status(200).json({ Result: true, Message: "Success" });
      }

      // Duplicate entry checks
      const duplicateEntry = await DB.DAHEVENT.findOne({
        plateNumber: formattedPlateNumber,
        locationId,
        entryTime: moment.utc(SnapTime).toDate()
      });

      if (duplicateEntry) {
        console.warn("⚠️ Duplicate Obverse entry:", formattedPlateNumber, SnapTime);
        await EMAIL.duplicateentryEmail({
          to: process.env.DUPLICATE_ENTRY_EMAIL,
          subject: "Duplicate Obverse entry detected",
          cardata: { plateNumber: formattedPlateNumber, deviceId: DeviceID, snapTime: SnapTime }
        });
        return res.status(200).json({ Result: true, Message: "Success" });
      }

      const duplicateExitEntry = await DB.DAHEVENT.findOne({
        plateNumber: formattedPlateNumber,
        locationId,
        exitTime: moment.utc(SnapTime).toDate()
      });

      if (duplicateExitEntry) {
        console.warn("⚠️ Duplicate Reverse entry:", formattedPlateNumber, SnapTime);
        await EMAIL.duplicateentryEmail({
          to: process.env.DUPLICATE_ENTRY_EMAIL,
          subject: "Duplicate Reverse entry detected",
          cardata: { plateNumber: formattedPlateNumber, deviceId: DeviceID, snapTime: SnapTime }
        });
        return res.status(200).json({ Result: true, Message: "Success" });
      }

      // Insert new event
      const newEvent = await new DB.DAHEVENT({
        plateNumber: formattedPlateNumber,
        deviceId: DeviceID,
        direction: Direction,
        entryTime: Direction === "Obverse" ? moment.utc(SnapTime).toDate() : undefined,
        exitTime: Direction !== "Obverse" ? moment.utc(SnapTime).toDate() : undefined,
        locationId,
        isActive: true,
        isViolation: false
      }).save();

      console.log(`✅ ${Direction} Event Recorded: ${formattedPlateNumber} at ${SnapTime}`);
      return res.status(200).json({ Result: true, Message: "Success" });

    } catch (error) {
      console.error("💥 Error processing tollgate info:", error);
      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while processing tollgate information."
      });
    }
  },






};


let alertedDevicesMap = new Map(); // deviceId -> lastAlertDate (YYYY-MM-DD)

setInterval(async () => {
  const now = Date.now();
  const today = new Date(now).toISOString().split("T")[0]; // "YYYY-MM-DD"

  keepAliveLogger.info(`Checking devices at ${new Date(now).toISOString()}`);

  Object.entries(lastHeartbeat).forEach(async ([deviceId, lastSeen]) => {
    const isOffline = now - lastSeen > HEARTBEAT_TIMEOUT;
    const lastAlertDate = alertedDevicesMap.get(deviceId);

    if (isOffline && lastAlertDate !== today) {
      console.log(`Device ${deviceId} is offline.`);

      try {
        let deviceInfo = await DB.DAHDEVICE.findOne({ deviceId: deviceId });
        console.log('deviceInfo', deviceInfo);

        if (deviceInfo) {
          let locationInfo = await DB.DAHLOCATION.findById(deviceInfo.locationId);
          locationInfo = locationInfo ? locationInfo.name : null;
          console.log('locationInfo', locationInfo);

          await EMAIL.deviceOfflineEmail({
            to: process.env.DEVICE_OFFLINE_EMAIL,
            subject: "Device Offline Alert",
            deviceId: deviceId,
            location: locationInfo,
          });

          alertedDevicesMap.set(deviceId, today); // Mark alert sent for today

        } else {
          logger.warn(`Device not found for ID: ${deviceId}`);
          keepAliveLogger.warn(`Device not found for ID: ${deviceId}`);
        }

      } catch (err) {
        keepAliveLogger.error(`Failed to send offline email for device ${deviceId}: ${err.message}`);
      }
    }

    // If device is back online, remove from map to reset alert state
    if (!isOffline && alertedDevicesMap.has(deviceId)) {
      console.log(`Device ${deviceId} is back online.`);
      keepAliveLogger.info(`Device ${deviceId} is back online`);
      alertedDevicesMap.delete(deviceId);
    }

  });
}, CHECK_INTERVAL);

