const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const s3 = require("../../service/s3.upload");
const {
  USER_TYPE: { ADMIN },
} = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const { Parser } = require("json2csv"); //to get csv data
const moment = require("moment");
const cron = require("node-cron");



module.exports = {
  getAllLocations: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const searchCondition = search
        ? { name: { $regex: search, $options: "i" } }
        : {};
      const locations = await DB.DAHLOCATION.find(searchCondition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      if (!locations.length) {
        return apiResponse.NOT_FOUND({
          res,
          message: "No locations found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Locations retrieved successfully.",
        data: locations,
      });
    } catch (error) {
      console.error("Error fetching locations:", error.message);
      logger.error("Error fetching locations:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while retrieving locations.",
      });
    }
  },

  // Create a location
  createLocation: async (req, res) => {
    try {
      const newLocation = new DB.DAHLOCATION({
        name: req.body.name,
        maxParkingTime: req.body.maxParkingTime,
        maxParkingSlots: req.body.maxParkingSlots,
        // add other fields as necessary
      });
      const savedLocation = await newLocation.save();

      return apiResponse.OK({
        res,
        message: "Location created successfully.",
        data: savedLocation,
      });
    } catch (error) {
      console.error("Error creating location:", error.message);
      logger.error("Error creating location:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while creating location.",
      });
    }
  },

  // Fetch a single location by ID
  getLocationById: async (req, res) => {
    try {
      const location = await DB.DAHLOCATION.findById(req.query.id);
      if (!location) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Location not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Location retrieved successfully.",
        data: location,
      });
    } catch (error) {
      console.error("Error fetching location:", error.message);
      logger.error("Error fetching location:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while retrieving location.",
      });
    }
  },

  // Update a location by ID
  updateLocation: async (req, res) => {
    try {
      const updatedLocation = await DB.DAHLOCATION.findByIdAndUpdate(
        req.query.id,
        {
          name: req.body.name,
          maxParkingTime: req.body.maxParkingTime,
          // update other fields as necessary
        },
        { new: true }
      );

      if (!updatedLocation) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Location not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Location updated successfully.",
        data: updatedLocation,
      });
    } catch (error) {
      console.error("Error updating location:", error.message);
      logger.error("Error updating location:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while updating location.",
      });
    }
  },

  // Delete a location by ID
  deleteLocation: async (req, res) => {
    try {
      const deletedLocation = await DB.DAHLOCATION.findByIdAndDelete(
        req.query.id
      );
      if (!deletedLocation) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Location not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Location deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting location:", error.message);
      logger.error("Error deleting location:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while deleting location.",
      });
    }
  },

  getLocationEvents: async (req, res) => {
    try {
      const {
        locationId,
        search,
        page = 1,
        limit = 10,
        isViolation,
        startDate,
        endDate,
        download = false,
      } = req.query;

      const { roleId, parkingplot } = req.user;


      // Parse page and limit to integers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      // console.log("Fetching events for query parameters:", req.query);

      // Initialize the query object
      const query = {};

      // Function to convert date to UTC
      const convertToUTC = (date) => {
        const parsedDate = new Date(date);
        return new Date(parsedDate.toISOString()); // Convert to UTC by calling toISOString()
      };

      // Add filters based on query parameters
      // if (locationId) {
      //   eventQuery.locationId = locationId;
      // }

      // Apply location filtering based on user role
      if (roleId.name === "admin") {
        if (locationId) {
          query.locationId = locationId;
        }
      } else if (roleId.name === "super_admin") {
        if (parkingplot && parkingplot.length > 0) {
          query.locationId = { $in: parkingplot };
        } else {
          return apiResponse.OK({
            res,
            message: "Super Admin has no assigned parking plots.",
            data: {
              totalCount: 0,
              currentPage: pageNumber,
              totalPages: 0,
              events: [],
            },
          });
        }
      }

      if (isViolation !== undefined) {
        query.isViolation = isViolation === true;
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          // Convert startDate to UTC
          const start = convertToUTC(startDate);
          // Ensure the time is set to midnight to prevent issues with timezone
          start.setUTCHours(0, 0, 0, 0);
          query.createdAt.$gte = start;
        }
        if (endDate) {
          // Convert endDate to UTC
          const end = convertToUTC(endDate);
          // Ensure the time is set to the end of the day in UTC (23:59:59.999)
          end.setUTCHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      if (search) {
        query.$or = [
          { plateNumber: search },
          { deviceId: search },
          { direction: search },
        ];
      }

      // console.log("Final query:", query);

      // Fetch the total count of events
      const totalCount = await DB.DAHEVENT.countDocuments(query);

      // Fetch events with pagination or fetch all if downloading
      const events = await DB.DAHEVENT.find(query)
        .sort({ createdAt: -1 })
        .skip(download === true ? 0 : (pageNumber - 1) * limitNumber)
        .limit(download === true ? 0 : limitNumber);

      if (!events.length) {
        return apiResponse.OK({
          res,
          message: "No events found for the specified criteria.",
        });
      }

      // Fetch location names for each event
      const eventsWithLocationNames = await Promise.all(
        events.map(async (event) => {
          const location = await DB.DAHLOCATION.findOne({ _id: event.locationId });
          const locationName = location ? location.name : "Unknown Location";
          return {
            ...event.toObject(),
            locationName,
          };
        })
      );


      // If download is true, generate CSV
      if (download === true) {

        // // Map events to include locationName and format Date
        // const formattedEvents = await Promise.all(
        //   events.map(async (event) => {
        //     // Fetch location name
        //     const location = await DB.DAHLOCATION.findOne({
        //       _id: event.locationId,
        //     });
        //     const locationName = location ? location.name : "Unknown Location";

        //     return {
        //       _id: event._id,
        //       plateNumber: event.plateNumber,
        //       entryTime: event.entryTime,
        //       exitTime: event.exitTime,
        //       totalParkingTime: event.totalParkingTime,
        //       isViolation: event.isViolation,
        //       violationDuration: event.violationDuration,
        //       locationName,
        //       Date: new Date(event.createdAt).toLocaleDateString(), // Format createdAt as Date
        //       updatedAt: event.updatedAt,
        //     };
        //   })
        // );

        const formattedEvents = eventsWithLocationNames.map((event) => ({
          _id: event._id,
          plateNumber: event.plateNumber,
          entryTime: event.entryTime,
          exitTime: event.exitTime,
          totalParkingTime: event.totalParkingTime,
          isViolation: event.isViolation,
          violationDuration: event.violationDuration,
          locationName: event.locationName,
          Date: new Date(event.createdAt).toLocaleDateString(), // Format createdAt as Date
          updatedAt: event.updatedAt,
        }));

        // Generate filename with date range or default
        const start = startDate
          ? new Date(startDate).toISOString().split("T")[0]
          : "all";
        const end = endDate
          ? new Date(endDate).toISOString().split("T")[0]
          : "data";
        const filename = `location_events_${start}_to_${end}.csv`;

        // Define fields for CSV
        const fields = [
          "plateNumber",
          "entryTime",
          "exitTime",
          "totalParkingTime",
          "isViolation",
          "locationName", // Include the location name
          "Date", // Include the formatted createdAt
        ];

        // Convert data to CSV
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formattedEvents);

        // Set headers for CSV download
        res.header("Content-Type", "text/csv");
        res.attachment(filename);
        return res.send(csv);
      }

      // Regular API response if not downloading
      return apiResponse.OK({
        res,
        message: "Events fetched successfully.",
        data: {
          totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          events: eventsWithLocationNames,
        },
      });
    } catch (error) {
      console.error("Error fetching events:", error.message);
      logger.error("Error fetching events:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while fetching events.",
      });
    }
  },

  getAllEvents: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;

      // Parse page and limit to integers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      // Build the query
      const query = {};
      if (search) {
        query.plateNumber = { $regex: search, $options: "i" }; // Case-insensitive search
      }

      // Fetch the total count of events matching the query
      const totalCount = await DB.DAHEVENT.countDocuments(query);

      // Fetch events with pagination and search
      const events = await DB.DAHEVENT.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

      if (!events.length) {
        return apiResponse.OK({
          res,
          message: "No events found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "All events fetched successfully.",
        data: {
          totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          events,
        },
      });
    } catch (error) {
      console.error("Error fetching all events:", error.message);
      logger.error("Error fetching all events:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while fetching all events.",
      });
    }
  },

  getViolationEvents: async (req, res) => {
    try {
      const { page = 1, limit = 10, download = false, search } = req.query;

      // Parse page and limit to integers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      console.log("Fetching violation events...");

      // Initialize the query object
      const query = { isViolation: true };

      // If search is provided, add the search conditions using $or
      if (search) {
        query.$or = [
          { plateNumber: { $regex: search, $options: "i" } },
          { deviceId: { $regex: search, $options: "i" } },
          { direction: { $regex: search, $options: "i" } },
        ];
      }

      // Fetch the total count of violation events
      const totalCount = await DB.DAHEVENT.countDocuments(query);

      // Fetch violation events with pagination
      const events = await DB.DAHEVENT.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

      if (!events.length) {
        return apiResponse.OK({
          res,
          message: "No violation events found.",
        });
      }

      // If download is true, generate CSV
      if (download === "true") {
        const fields = [
          "_id",
          "plateNumber",
          "entryTime",
          "exitTime",
          "totalParkingTime",
          "isViolation",
          "locationId",
          "createdAt",
          "updatedAt",
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(events);

        res.header("Content-Type", "text/csv");
        res.attachment("violation_events.csv");
        return res.send(csv);
      }

      return apiResponse.OK({
        res,
        message: "Violation events fetched successfully.",
        data: {
          totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          events,
        },
      });
    } catch (error) {
      console.error("Error fetching violation events:", error.message);
      logger.error("Error fetching violation events:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while fetching violation events.",
      });
    }
  },

  //in this instead of push i have used unshift to add the new devices to the top of the array
  createLocationDevice: async (req, res) => {
    const { setArray, deleteArray } = req.body;

    console.log("setArray", setArray);
    console.log("deleteArray", deleteArray);

    try {
      const responseDetails = {
        createdLocations: [],
        updatedLocations: [],
        deletedLocations: [],
        disassociatedDevices: [],
        createdDevices: [],
        updatedDevices: [],
        deletedDevices: [],
        messages: [],
      };

      // Handle dynamic updates and creations for locations and devices
      if (setArray && Array.isArray(setArray)) {
        for (const item of setArray) {
          const {
            locationId, name, maxParkingTime, maxParkingSlots, deviceIds,
            locationStatus,
            pincode,
            hourlyRate,
            GrtVehicleRate,
            ExtendVehicleTime,
            totalIncomeCurrentMonth,
            totalSalesQuarter,
            totalIncomePerYear,
            businessHours,
            businessHoursMaxParkingTime,
            offHoursMaxParkingTime,
            publicHolidays,
            enabled,
          } = item;

          let location;
          if (locationId) {
            location = await DB.DAHLOCATION.findById(locationId);

            if (location) {
              location.name = name || location.name;
              location.maxParkingTime = maxParkingTime ?? location.maxParkingTime;
              location.maxParkingSlots = maxParkingSlots ?? location.maxParkingSlots;
              location.locationStatus = locationStatus || location.locationStatus;
              location.totalIncomeCurrentMonth =
                totalIncomeCurrentMonth ?? location.totalIncomeCurrentMonth;
              location.totalSalesQuarter = totalSalesQuarter ?? location.totalSalesQuarter;
              location.pincode = pincode ?? location.pincode;
              location.hourlyRate = hourlyRate ?? location.hourlyRate;
              location.GrtVehicleRate = GrtVehicleRate ?? location.GrtVehicleRate;
              location.ExtendVehicleTime = ExtendVehicleTime ?? location.ExtendVehicleTime;
              location.totalIncomePerYear = totalIncomePerYear ?? location.totalIncomePerYear;
              location.businessHours = businessHours || location.businessHours;
              location.publicHolidays = publicHolidays || location.publicHolidays;
              location.businessHoursMaxParkingTime = businessHoursMaxParkingTime || location.businessHoursMaxParkingTime;
              location.offHoursMaxParkingTime = offHoursMaxParkingTime || location.offHoursMaxParkingTime;
              location.enabled = enabled ?? location.enabled;


              await location.save();
              responseDetails.updatedLocations.unshift(location);
              responseDetails.messages.unshift(
                `Location with ID ${locationId} updated.`
              );
            } else {
              location = new DB.DAHLOCATION({
                name,
                maxParkingTime,
                maxParkingSlots,
                locationStatus: locationStatus || "available",
                totalIncomeCurrentMonth: totalIncomeCurrentMonth || 0,
                totalSalesQuarter: totalSalesQuarter || 0,
                totalIncomePerYear: totalIncomePerYear || 0,
                pincode: pincode || 0,
                hourlyRate: hourlyRate || 0,
                GrtVehicleRate: GrtVehicleRate || 0,
                ExtendVehicleTime: ExtendVehicleTime || 0,
                businessHours: businessHours || {},
                publicHolidays: publicHolidays || [],
                businessHoursMaxParkingTime: businessHoursMaxParkingTime || 120,
                offHoursMaxParkingTime: offHoursMaxParkingTime || 45,
                enabled: enabled || true,

              });
              // Check for uniqueness of location name before creating
              const existingLocation = await DB.DAHLOCATION.findOne({ name });
              if (existingLocation) {
                responseDetails.messages.unshift(
                  `Location with name ${name} already exists.`
                );
                continue; // Skip creating if the location already exists
              }
              await location.save();
              responseDetails.createdLocations.unshift(location);
              responseDetails.messages.unshift(
                `Location with name ${name} created.`
              );

            }
          } else {
            location = new DB.DAHLOCATION({
              name,
              maxParkingTime,
              maxParkingSlots,
              locationStatus: locationStatus || "available",
              totalIncomeCurrentMonth: totalIncomeCurrentMonth || 0,
              totalSalesQuarter: totalSalesQuarter || 0,
              totalIncomePerYear: totalIncomePerYear || 0,
              pincode: pincode || 0,
              hourlyRate: hourlyRate || 0,
              GrtVehicleRate: GrtVehicleRate || 0,
              ExtendVehicleTime: ExtendVehicleTime || 0,
              businessHours: businessHours || {},
              publicHolidays: publicHolidays || [],
              businessHoursMaxParkingTime: businessHoursMaxParkingTime || 120,
              offHoursMaxParkingTime: offHoursMaxParkingTime || 45,
              enabled: enabled || true,

            });
            // Check for uniqueness of location name before creating
            const existingLocation = await DB.DAHLOCATION.findOne({ $or: [{ name }, { pincode }] });
            if (existingLocation) {
              if (existingLocation.name === name) {
                responseDetails.messages.unshift(`Location with name ${name} already exists.`);
              }
              if (existingLocation.pincode === pincode) {
                responseDetails.messages.unshift(`Location with pincode ${pincode} already exists.`);
              }
              continue; // Skip creating if the location already exists
            }
            await location.save();
            responseDetails.createdLocations.unshift(location);
            responseDetails.messages.unshift(
              `New location with name ${name} created.`
            );
          }

          // Handle devices - process both _id and deviceId
          if (deviceIds && Array.isArray(deviceIds)) {
            for (const device of deviceIds) {
              const { _id, deviceId } = device;

              // Check if the device _id exists in DAHDEVICE
              let existingDevice;
              if (_id) {
                existingDevice = await DB.DAHDEVICE.findById(_id);
              } else if (deviceId) {
                // If no _id is provided, look up by deviceId
                existingDevice = await DB.DAHDEVICE.findOne({ deviceId });
              }

              if (existingDevice) {
                // Update the deviceId and locationId if it exists
                existingDevice.deviceId = deviceId || existingDevice.deviceId;
                existingDevice.locationId = location._id;
                await existingDevice.save();
                responseDetails.updatedDevices.unshift(existingDevice);
                responseDetails.messages.unshift(
                  `Device with ID ${deviceId} associated with location.`
                );
              } else {
                // Check for uniqueness of deviceId before creating
                const existingDeviceById = await DB.DAHDEVICE.findOne({
                  deviceId,
                });
                if (existingDeviceById) {
                  responseDetails.messages.unshift(
                    `Device with ID ${deviceId} already exists.`
                  );
                  continue; // Skip creating if the device already exists
                }

                // Create a new device if it does not exist
                const newDevice = new DB.DAHDEVICE({
                  deviceId,
                  locationId: location._id,
                });
                await newDevice.save();
                responseDetails.createdDevices.unshift(newDevice);
                responseDetails.messages.unshift(
                  `Device with ID ${deviceId} created and associated with location.`
                );
              }
            }
          } else {
            // Check for uniqueness of deviceId before creating
            const existingDeviceById = await DB.DAHDEVICE.findOne({ deviceId });
            if (existingDeviceById) {
              responseDetails.messages.unshift(
                `Device with ID ${deviceId} already exists.`
              );
              continue; // Skip creating if the device already exists
            }

            // Create a new device if it does not exist
            const newDevice = new DB.DAHDEVICE({
              deviceId,
              locationId: location._id,
            });
            await newDevice.save();
            responseDetails.createdDevices.unshift(newDevice);
            responseDetails.messages.unshift(
              `Device with ID ${deviceId} created and associated with location.`
            );
          }
        }
      }
      // Handle dynamic deletions
      if (deleteArray && Array.isArray(deleteArray)) {
        for (const item of deleteArray) {
          const { locationId, deviceId } = item;

          if (deviceId) {
            const device = await DB.DAHDEVICE.findById(deviceId);
            if (device) {
              // Delete the device
              await DB.DAHDEVICE.deleteOne({ _id: deviceId });
              responseDetails.deletedDevices.unshift(device);
              responseDetails.messages.unshift(
                `Device with ID ${deviceId} has been deleted.`
              );
            } else {
              responseDetails.messages.unshift(
                `Device with ID ${deviceId} not found.`
              );
            }
          }

          if (locationId) {
            const location = await DB.DAHLOCATION.findById(locationId);
            if (location) {
              // If there are devices associated with the location, disassociate them
              const devices = await DB.DAHDEVICE.find({ locationId });
              if (devices.length > 0) {
                await DB.DAHDEVICE.updateMany(
                  { locationId },
                  { $unset: { locationId: "" } }
                );
                responseDetails.disassociatedDevices.unshift(...devices);
                responseDetails.messages.unshift(
                  `All devices associated with location ID ${locationId} have been disassociated.`
                );
              }
              // Delete the location
              await DB.DAHLOCATION.deleteOne({ _id: locationId });
              responseDetails.deletedLocations.unshift(location);
              responseDetails.messages.unshift(
                `Location with ID ${locationId} has been deleted.`
              );
            } else {
              responseDetails.messages.unshift(
                `Location with ID ${locationId} not found.`
              );
            }
          }

          if (!deviceId && !locationId) {
            responseDetails.messages.unshift(
              "Neither locationId nor deviceId provided for deletion."
            );
          }
        }
      }

      return apiResponse.OK({
        res,
        data: responseDetails,
        message: "Operations completed successfully.",
      });
    } catch (error) {
      console.error("Error in createLocationWithDevice:", error.message);
      console.log("erroororor", error)
      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },

  getLocationWithDevice: async (req, res) => {
    const { page = 1, limit = 10, search = "", deviceSearch = "" } = req.query;

    try {
      // Build the search criteria
      let locationCriteria = {};
      let deviceCriteria = {};
      let plateCriteria = {};
      if (search) {
        const searchRegex = new RegExp(search, "i");

        //   locationCriteria = {
        //     $or: [
        //       { name: searchRegex },  // Search for location name
        //       // { "devices.deviceId": searchRegex }, // Search for device IDs within locations
        //     ]
        //   };
        // }

        locationCriteria = {
          $or: [
            { name: searchRegex }, // Search for location name
            // { "devices.deviceId": searchRegex },  // Search for device IDs within locations
          ],
        };
        deviceCriteria = {
          $or: [
            // { name: searchRegex },  // Search for location name
            { "devices.deviceId": searchRegex }, // Search for device IDs within locations
          ],
        };

        plateCriteria = {
          $or: [
            { "authorizedPlates.plateNumber": searchRegex }, // Search for plate numbers within authorized plates
          ],
        };
      }
      let userLocation = req.user.parkingLocation;
      let userLocationCriteria = {};

      userLocationCriteria = { _id: { $in: userLocation } };
      locationCriteria = {
        ...(search ? locationCriteria : {}),
        ...(req.user?.roleId?._id?.toString() !== "67319fb677598d2c6af9ffe7"
          ? userLocationCriteria
          : {}),
      };

      console.log("locationCriteria", locationCriteria, req.user?.roleId?._id?.toString() !== "67319fb677598d2c6af9ffe7");

      // if (deviceSearch) {

      //   const deviceSearchRegex = new RegExp(deviceSearch, "i");

      // }
      console.log(req.user, "dfsajfhjksd");
      // Fetch locations with their associated devices
      let locations = await DB.DAHLOCATION.aggregate([
        { $match: locationCriteria },
        // Apply search condition (location + device search)
        {
          $lookup: {
            from: "dahDevice",
            localField: "_id",
            foreignField: "locationId",
            as: "devices",
          },
        },
        {
          $lookup: {
            from: "dahAuthPlate",
            localField: "_id",
            foreignField: "locationId",
            as: "authorizedPlates",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        ...(search ? [{ $match: deviceCriteria }] : []),
        ...(search ? [{ $match: plateCriteria }] : []),
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: parseInt(limit),
        },
      ]).exec();

      // if (locations.length === 0) {

      //   locations = await DB.DAHLOCATION.aggregate([

      //     // Apply search condition (location + device search)
      //     {
      //       $lookup: {
      //         from: "dahDevice",
      //         localField: "_id",
      //         foreignField: "locationId",
      //         as: "devices"
      //       }
      //     },
      //     {
      //       $lookup: {
      //         from: "dahAuthPlate",
      //         localField: "_id",
      //         foreignField: "locationId",
      //         as: "authorizedPlates"
      //       }
      //     },
      //     {
      //       $sort: { createdAt: -1 }
      //     },
      //     { $match: deviceCriteria },
      //     {
      //       $skip: (page - 1) * limit
      //     },
      //     {
      //       $limit: parseInt(limit)
      //     }
      //   ]).exec();

      // }

      // Get the total count of matching documents
      const totalCount = await DB.DAHLOCATION.countDocuments(locationCriteria);

      if (!locations.length) {
        return apiResponse.OK({
          res,
          message: "No locations or devices found.",
        });
      }

      // Return response
      return apiResponse.OK({
        res,
        message: "Locations retrieved successfully.",
        data: {
          locations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount,
          },
        },
      });
    } catch (error) {
      console.error("Error in getLocationWithDevice:", error.message);
      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },

  updateDeviceInLocation: async (req, res) => {
    const { locationId, deviceId } = req.query; // URL parameters
    const { locationName, newDeviceId, newDeviceLocationId } = req.body; // Payload containing the updated device ID

    try {
      let updatelocation, updatedDevice;
      // Fetch the location by ID

      if (locationId) {
        const location = await DB.DAHLOCATION.findById(locationId);
        if (!location) {
          return apiResponse.NOT_FOUND({
            res,
            message: `Location with ID '${locationId}' not found.`,
          });
        }

        updatelocation = await DB.DAHLOCATION.findByIdAndUpdate(
          locationId,
          {
            name: locationName,
          },
          { new: true }
        );
      }

      // Fetch the device by ID

      if (deviceId) {
        const device = await DB.DAHDEVICE.findById(deviceId);

        console.log("device", device);
        if (!device) {
          return apiResponse.NOT_FOUND({
            res,
            message: `Device with ID '${deviceId}' not found.`,
          });
        }

        // Update device if newDeviceId is provided
        if (newDeviceId) {
          updatedDevice = await DB.DAHDEVICE.findByIdAndUpdate(
            deviceId,
            {
              $set: {
                deviceId: newDeviceId ? newDeviceId : device.deviceId,
                locationId: newDeviceLocationId
                  ? newDeviceLocationId
                  : device.locationId,
              },
            },
            { new: true }
          );
        }
      }

      // Return success response with updated data
      return apiResponse.OK({
        res,
        message: `Device '${deviceId}' updated successfully to '${newDeviceId}'.`,
        data: {
          updatedLocation: updatelocation, // Use the existing location document
          updatedDevice: updatedDevice, // Use the existing device document
        },
      });
    } catch (error) {
      console.error("Error in updateDeviceInLocation:", error.message);
      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },

  deleteDeviceInLocation: async (req, res) => {
    const { locationId, deviceId } = req.query;

    try {
      // Validate and find the device
      const device = await DB.DAHDEVICE.findById(deviceId);
      if (!device) {
        return apiResponse.NOT_FOUND({
          res,
          message: `Device with ID '${deviceId}' not found.`,
        });
      }

      // If locationId is provided
      if (locationId) {
        // Validate and find the location
        const location = await DB.DAHLOCATION.findById(locationId);
        if (!location) {
          return apiResponse.NOT_FOUND({
            res,
            message: `Location with ID '${locationId}' not found.`,
          });
        }

        // Set locationId to null for all devices linked to this location
        await DB.DAHDEVICE.updateMany(
          { locationId },
          { $set: { locationId: null } }
        );

        // Delete the location
        await DB.DAHLOCATION.findByIdAndDelete(locationId);
      }

      // Delete the device
      await DB.DAHDEVICE.findByIdAndDelete(deviceId);

      // Return success response
      return apiResponse.OK({
        res,
        message: `Device '${deviceId}' deleted successfully. Location '${locationId}' (if provided) deleted and devices detached.`,
      });
    } catch (error) {
      console.error("Error in deleteDeviceInLocation:", error.message);
      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },


  updateViolationStatus: async (req, res) => {
    try {
      const { reason, otherReason } = req.body;
      console.log('req.body', req.body)
      const { eventId } = req.query;
      console.log('req.query', req.query)
      const { roleId, parkingplot } = req.user;

      // Ensure only Super Admins can perform this action
      if (roleId.name !== "super_admin") {
        return apiResponse.UNAUTHORIZED({
          res,
          message: "Only Super Admins can update violation status.",
        });
      }

      // Find event and ensure it belongs to a location assigned to the Super Admin
      const event = await DB.DAHEVENT.findOne({ _id: eventId });
      console.log('event', event)

      if (!event) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Event not found.",
        });
      }
      const parkingplotStrings = parkingplot.map((plot) => plot.toString());

      if (!parkingplotStrings.includes(event.locationId.toString())) {
        console.log('event.locationId', event.locationId)
        console.log('------------------', parkingplot)
        return apiResponse.FORBIDDEN({
          res,
          message: "You can only update events from assigned locations.",
        });
      }

      // Validate the reason
      const validReasons = [
        "Verstoß löschen",
        "Kassenzettel verloren",
        "Validierung nicht verstanden",
        "Stammkunde",
        "Mitarbeiter",
        "Anderer Grund",
      ];

      if (!validReasons.includes(reason)) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Invalid reason provided.",
        });
      }

      // If the reason is "Anderer Grund" (Other reason), ensure otherReason is provided
      if (reason === "Anderer Grund" && !otherReason) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Please provide a reason for 'Anderer Grund'.",
        });
      }

      // Prepare the update object
      const updateData = {
        isViolation: false,
        violationRemovalReason: reason === "Anderer Grund" ? otherReason : reason,
      };

      // Update the event with the reason
      await DB.DAHEVENT.updateOne(
        { _id: eventId },
        { $set: updateData }
      );

      return apiResponse.OK({
        res,
        message: "Violation status updated successfully.",
        data: updateData,
      });
    } catch (error) {
      console.error("Error updating violation status:", error.message);
      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while updating violation status.",
      });
    }
  },



  // getAllAuthPlatesEvents: async (req, res) => {
  //   try {
  //     const { startDate, endDate } = req.query; // Default values for pagination
  //     const { roleId, parkingplot } = req.user;
  //     const page = req.query.page || 1;
  //     const limit = req.query.limit || 10;

  //     // Validate page and limit
  //     const pageNumber = parseInt(page, 10);
  //     const limitNumber = parseInt(limit, 10);
  //     if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
  //       return apiResponse.BAD_REQUEST({
  //         res,
  //         message: "Invalid page or limit value.",
  //       });
  //     }

  //     // Validate startDate and endDate
  //     if (startDate && isNaN(Date.parse(startDate))) {
  //       return apiResponse.BAD_REQUEST({
  //         res,
  //         message: "Invalid startDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //       });
  //     }
  //     if (endDate && isNaN(Date.parse(endDate))) {
  //       return apiResponse.BAD_REQUEST({
  //         res,
  //         message: "Invalid endDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //       });
  //     }

  //     let locationQuery = {};

  //     if (roleId.name === "super_admin") {
  //       if (parkingplot && parkingplot.length > 0) {
  //         locationQuery.locationId = { $in: parkingplot }; // Use all locations assigned to super_admin
  //       } else {
  //         return apiResponse.OK({
  //           res,
  //           message: "No locations assigned to this super_admin.",
  //           data: {
  //             totalCount: 0,
  //             currentPage: pageNumber,
  //             totalPages: 0,
  //             events: [],
  //           },
  //         });
  //       }
  //     } else {
  //       return apiResponse.FORBIDDEN({
  //         res,
  //         message: "You do not have permission to access this resource.",
  //       });
  //     }

  //     // Step 1: Fetch authorised plates for the specified location(s)
  //     const authorisedPlates = await DB.DAHAUTHPLATE.find(locationQuery).distinct("plateNumber");

  //     if (!authorisedPlates.length) {
  //       return apiResponse.OK({
  //         res,
  //         message: "No authorised plates found for the specified location(s).",
  //         data: {
  //           totalCount: 0,
  //           currentPage: pageNumber,
  //           totalPages: 0,
  //           events: [],
  //         },
  //       });
  //     }

  //     // Step 2: Fetch events for the authorised plates
  //     const eventQuery = {
  //       plateNumber: { $in: authorisedPlates }, // Filter events by authorised plates
  //       locationId: locationQuery.locationId, // Filter by location
  //     };

  //     console.log("Event Query:", eventQuery);


  //     // Function to convert date to UTC
  //     const convertToUTC = (date) => {
  //       const parsedDate = new Date(date);
  //       return new Date(parsedDate.toISOString()); // Convert to UTC by calling toISOString()
  //     };
  //     if (startDate || endDate) {
  //       eventQuery.createdAt = {};
  //       if (startDate) {
  //         // Convert startDate to UTC
  //         const start = convertToUTC(startDate);
  //         // Ensure the time is set to midnight to prevent issues with timezone
  //         start.setUTCHours(0, 0, 0, 0);
  //         eventQuery.createdAt.$gte = start;
  //       }
  //       if (endDate) {
  //         // Convert endDate to UTC
  //         const end = convertToUTC(endDate);
  //         // Ensure the time is set to the end of the day in UTC (23:59:59.999)
  //         end.setUTCHours(23, 59, 59, 999);
  //         eventQuery.createdAt.$lte = end;
  //       }
  //     }


  //     const totalCount = await DB.DAHEVENT.countDocuments(eventQuery); // Get total count for pagination
  //     const events = await DB.DAHEVENT.find(eventQuery)
  //     .skip((pageNumber - 1) * limitNumber)
  //     .limit(limitNumber);

  //     console.log('events', events)

  //       console.log(`Event ID: ${events._id}, Entry Time: ${events.entryTime}, Exit Time: ${events.exitTime}`);


  //     if (!events.length) {
  //       return apiResponse.NOT_FOUND({
  //         res,
  //         message: "No events found for authorised plates at the specified location(s).",
  //       });
  //     }

  //     // Step 3: Return the results
  //     const totalPages = Math.ceil(totalCount / limitNumber);


  //      // Fetch all locations assigned to super_admin
  //   const locations = await DB.DAHLOCATION.find({ _id: { $in: parkingplot } });

  //   let locationStats = [];
  //   let totalParkingTime = 0;
  //   let totalParkingCount = 0;

  //   for (const location of locations) {
  //     const locationEvents = events.filter(event => event.locationId.toString() === location._id.toString());

  //     console.log(`Location: ${location.name}, Events Count: ${locationEvents.length}`);



  //     const maxParkingSlots = location.maxParkingSlots || 0;
  //     const occupiedSpaces = locationEvents.length;
  //     const utilization = maxParkingSlots > 0 ? ((occupiedSpaces / maxParkingSlots) * 100).toFixed(2) : 0;

  //     let lessThan15 = 0, between15And30 = 0, moreThan30 = 0, totalTime = 0;

  //     locationEvents.forEach(event => {
  //       const parkingDuration = (new Date(event.exitTime) - new Date(event.entryTime)) / (1000 * 60);
  //       totalTime += parkingDuration;

  //       if (parkingDuration < 15) lessThan15++;
  //       else if (parkingDuration >= 15 && parkingDuration <= 30) between15And30++;
  //       else moreThan30++;
  //     });

  //     const avgParkingTime = locationEvents.length > 0 ? (totalTime / locationEvents.length).toFixed(2) : 0;

  //     totalParkingTime += totalTime;
  //     totalParkingCount += locationEvents.length;

  //     const totalEventCount = lessThan15 + between15And30 + moreThan30;
  //     const lessThan15Percentage = totalEventCount > 0 ? ((lessThan15 / totalEventCount) * 100).toFixed(2) : 0;
  //     const between15And30Percentage = totalEventCount > 0 ? ((between15And30 / totalEventCount) * 100).toFixed(2) : 0;
  //     const moreThan30Percentage = totalEventCount > 0 ? ((moreThan30 / totalEventCount) * 100).toFixed(2) : 0;

  //     locationStats.push({
  //       locationName: location.name,
  //       capacityUtilization: `${utilization}%`,
  //       averageParkingTime: `${avgParkingTime} mins`,
  //       parkingDurations: {
  //         lessThan15: `${lessThan15Percentage}%`,
  //         between15And30: `${between15And30Percentage}%`,
  //         moreThan30: `${moreThan30Percentage}%`
  //       }
  //     });
  //   }

  //   const overallAverageParkingTime = totalParkingCount > 0 ? (totalParkingTime / totalParkingCount).toFixed(2) : 0;


  //     return apiResponse.OK({
  //       res,
  //       message: "Events for authorised plates retrieved successfully.",
  //       data: {
  //       totalCount,
  //       currentPage: pageNumber,
  //       totalPages,
  //       events,
  //       locationStats,
  //       overallAverageParkingTime: `${overallAverageParkingTime} mins`
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching events for authorised plates:", error.message);
  //     logger.error("Error fetching events for authorised plates:", error);

  //     return apiResponse.CATCH_ERROR({
  //       res,
  //       message: messages.INTERNAL_SERVER_ERROR,
  //     });
  //   }
  // },


  //   getAllAuthPlatesEvents: async (req, res) => {
  //     try {
  //         const { startDate, endDate, metricsStartDate, metricsEndDate} = req.query;
  //         const { roleId, parkingplot } = req.user;
  //         const page = req.query.page || 1;
  //         const limit = req.query.limit || 10;

  //         const pageNumber = parseInt(page, 10);
  //         const limitNumber = parseInt(limit, 10);
  //         if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
  //             return apiResponse.BAD_REQUEST({
  //                 res,
  //                 message: "Invalid page or limit value.",
  //             });
  //         }

  //         if (startDate && isNaN(Date.parse(startDate))) {
  //             return apiResponse.BAD_REQUEST({
  //                 res,
  //                 message: "Invalid startDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //             });
  //         }
  //         if (endDate && isNaN(Date.parse(endDate))) {
  //             return apiResponse.BAD_REQUEST({
  //                 res,
  //                 message: "Invalid endDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //             });
  //         }

  //         let locationQuery = {};

  //         if (roleId.name === "super_admin") {
  //             if (parkingplot && parkingplot.length > 0) {
  //                 locationQuery.locationId = { $in: parkingplot };
  //             } else {
  //                 return apiResponse.OK({
  //                     res,
  //                     message: "No locations assigned to this super_admin.",
  //                     data: {
  //                         totalCount: 0,
  //                         currentPage: pageNumber,
  //                         totalPages: 0,
  //                         events: [],
  //                     },
  //                 });
  //             }
  //         } else {
  //             return apiResponse.FORBIDDEN({
  //                 res,
  //                 message: "You do not have permission to access this resource.",
  //             });
  //         }

  //         const authorisedPlates = await DB.DAHAUTHPLATE.find(locationQuery).distinct("plateNumber");

  //         // Query for all events in the given locations (NOT filtering by authorised plates)
  //         const allEventsQuery = {
  //             locationId: locationQuery.locationId,
  //         };

  //         if (startDate || endDate) {
  //             allEventsQuery.createdAt = {};
  //             if (startDate) {
  //                 const start = new Date(startDate);
  //                 start.setUTCHours(0, 0, 0, 0);
  //                 allEventsQuery.createdAt.$gte = start;
  //             }
  //             if (endDate) {
  //                 const end = new Date(endDate);
  //                 end.setUTCHours(23, 59, 59, 999);
  //                 allEventsQuery.createdAt.$lte = end;
  //             }
  //         }

  //         const totalAllEventsCount = await DB.DAHEVENT.countDocuments(allEventsQuery);
  //         const allEvents = await DB.DAHEVENT.find(allEventsQuery);

  //         // Query for authorized plate events
  //         const eventQuery = {
  //             plateNumber: { $in: authorisedPlates },
  //             locationId: locationQuery.locationId,
  //         };

  //         if (startDate || endDate) {
  //             eventQuery.createdAt = allEventsQuery.createdAt;
  //         }

  //         const totalCount = await DB.DAHEVENT.countDocuments(eventQuery);
  //         const events = await DB.DAHEVENT.find(eventQuery)
  //             .skip((pageNumber - 1) * limitNumber)
  //             .limit(limitNumber);

  //         const locations = await DB.DAHLOCATION.find({ _id: { $in: parkingplot } });

  //         let locationStats = [];
  //         let totalParkingTime = 0;
  //         let totalParkingCount = 0;
  //         let totalUtilization = 0; // Added: To track total capacity utilization
  //         let locationCount = locations.length;

  //         for (const location of locations) {
  //             const locationEvents = allEvents.filter(event => event.locationId.toString() === location._id.toString());

  //             const maxParkingSlots = location.maxParkingSlots || 0;
  //             const occupiedSpaces = locationEvents.length;
  //             const utilization = maxParkingSlots > 0 ? ((occupiedSpaces / maxParkingSlots) * 100).toFixed(2) : 0;

  //             totalUtilization += parseFloat(utilization); // Added: Sum utilization for averaging


  //             let lessThan15 = 0, between15And30 = 0, moreThan30 = 0, totalTime = 0;

  //             locationEvents.forEach(event => {
  //                 const parkingDuration = (new Date(event.exitTime) - new Date(event.entryTime)) / (1000 * 60);
  //                 totalTime += parkingDuration;

  //                 if (parkingDuration < 15) lessThan15++;
  //                 else if (parkingDuration >= 15 && parkingDuration <= 30) between15And30++;
  //                 else moreThan30++;
  //             });

  //             const avgParkingTime = locationEvents.length > 0 ? (totalTime / locationEvents.length).toFixed(2) : 0;

  //             totalParkingTime += totalTime;
  //             totalParkingCount += locationEvents.length;

  //             const totalEventCount = lessThan15 + between15And30 + moreThan30;
  //             const lessThan15Percentage = totalEventCount > 0 ? ((lessThan15 / totalEventCount) * 100).toFixed(2) : 0;
  //             const between15And30Percentage = totalEventCount > 0 ? ((between15And30 / totalEventCount) * 100).toFixed(2) : 0;
  //             const moreThan30Percentage = totalEventCount > 0 ? ((moreThan30 / totalEventCount) * 100).toFixed(2) : 0;

  //             locationStats.push({
  //                 locationName: location.name,
  //                 capacityUtilization: `${utilization}%`,
  //                 averageParkingTime: `${avgParkingTime} mins`,
  //                 parkingDurations: {
  //                     lessThan15: `${lessThan15Percentage}%`,
  //                     between15And30: `${between15And30Percentage}%`,
  //                     moreThan30: `${moreThan30Percentage}%`
  //                 }
  //             });
  //         }

  //         const avgCapacityUtilization = locationCount > 0 ? (totalUtilization / locationCount).toFixed(2) : "0";


  //         const overallAverageParkingTime = totalParkingCount > 0 ? (totalParkingTime / totalParkingCount).toFixed(2) : 0;

  //         return apiResponse.OK({
  //             res,
  //             message: "Events for authorised plates retrieved successfully, with overall metrics.",
  //             data: {
  //                 totalCount,
  //                 currentPage: pageNumber,
  //                 totalPages: Math.ceil(totalCount / limitNumber),
  //                 events,
  //                 locationStats,
  //                 overallAverageParkingTime: `${overallAverageParkingTime} mins`,
  //                 totalAllEventsCount, // Total number of all events (not just authorized)
  //                 avgCapacityUtilization: `${avgCapacityUtilization}%`, // Average capacity utilization
  //             },
  //         });
  //     } catch (error) {
  //         console.error("Error fetching events for authorised plates:", error.message);
  //         logger.error("Error fetching events for authorised plates:", error);

  //         return apiResponse.CATCH_ERROR({
  //             res,
  //             message: messages.INTERNAL_SERVER_ERROR,
  //         });
  //     }
  // },


  // getAllAuthPlatesEvents: async (req, res) => {
  //   try {
  //       const { startDate, endDate, metricsStartDate, metricsEndDate } = req.query;
  //       const { roleId, parkingplot } = req.user;
  //       const page = req.query.page || 1;
  //       const limit = req.query.limit || 10;

  //       const pageNumber = parseInt(page, 10);
  //       const limitNumber = parseInt(limit, 10);
  //       if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
  //           return apiResponse.BAD_REQUEST({
  //               res,
  //               message: "Invalid page or limit value.",
  //           });
  //       }

  //       if (startDate && isNaN(Date.parse(startDate))) {
  //           return apiResponse.BAD_REQUEST({
  //               res,
  //               message: "Invalid startDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //           });
  //       }
  //       if (endDate && isNaN(Date.parse(endDate))) {
  //           return apiResponse.BAD_REQUEST({
  //               res,
  //               message: "Invalid endDate format. Use ISO date format (e.g., YYYY-MM-DD).",
  //           });
  //       }

  //       let locationQuery = {};

  //       if (roleId.name === "super_admin") {
  //           if (parkingplot && parkingplot.length > 0) {
  //               locationQuery.locationId = { $in: parkingplot };
  //           } else {
  //               return apiResponse.OK({
  //                   res,
  //                   message: "No locations assigned to this super_admin.",
  //                   data: {
  //                       totalCount: 0,
  //                       currentPage: pageNumber,
  //                       totalPages: 0,
  //                       events: [],
  //                   },
  //               });
  //           }
  //       } else {
  //           return apiResponse.FORBIDDEN({
  //               res,
  //               message: "You do not have permission to access this resource.",
  //           });
  //       }

  //       const authorisedPlates = await DB.DAHAUTHPLATE.find(locationQuery).distinct("plateNumber");

  //       const allEventsQuery = { locationId: locationQuery.locationId };

  //       if (startDate || endDate) {
  //           allEventsQuery.createdAt = {};
  //           if (startDate) {
  //               const start = new Date(startDate);
  //               start.setUTCHours(0, 0, 0, 0);
  //               allEventsQuery.createdAt.$gte = start;
  //           }
  //           if (endDate) {
  //               const end = new Date(endDate);
  //               end.setUTCHours(23, 59, 59, 999);
  //               allEventsQuery.createdAt.$lte = end;
  //           }
  //       }

  //       const totalAllEventsCount = await DB.DAHEVENT.countDocuments(allEventsQuery);
  //       const allEvents = await DB.DAHEVENT.find(allEventsQuery);

  //       const eventQuery = {
  //           plateNumber: { $in: authorisedPlates },
  //           locationId: locationQuery.locationId,
  //       };

  //       if (startDate || endDate) {
  //           eventQuery.createdAt = allEventsQuery.createdAt;
  //       }

  //       const totalCount = await DB.DAHEVENT.countDocuments(eventQuery);
  //       const events = await DB.DAHEVENT.find(eventQuery)
  //           .skip((pageNumber - 1) * limitNumber)
  //           .limit(limitNumber);

  //       const locations = await DB.DAHLOCATION.find({ _id: { $in: parkingplot } });

  //       let locationStats = [];
  //       let totalParkingTime = 0;
  //       let totalParkingCount = 0;
  //       let totalUtilization = 0;
  //       let locationCount = locations.length;

  //       for (const location of locations) {
  //           let locationEvents = allEvents.filter(event => event.locationId.toString() === location._id.toString());

  //           if (metricsStartDate || metricsEndDate) {
  //               locationEvents = locationEvents.filter(event => {
  //                   const eventDate = new Date(event.createdAt);
  //                   return (!metricsStartDate || eventDate >= new Date(metricsStartDate)) &&
  //                       (!metricsEndDate || eventDate <= new Date(metricsEndDate));
  //               });
  //           }

  //           const maxParkingSlots = location.maxParkingSlots || 0;
  //           const occupiedSpaces = locationEvents.length;
  //           const utilization = maxParkingSlots > 0 ? ((occupiedSpaces / maxParkingSlots) * 100).toFixed(2) : 0;
  //           totalUtilization += parseFloat(utilization);

  //           let lessThan15 = 0, between15And30 = 0, moreThan30 = 0, totalTime = 0;

  //           locationEvents.forEach(event => {
  //               const parkingDuration = (new Date(event.exitTime) - new Date(event.entryTime)) / (1000 * 60);
  //               totalTime += parkingDuration;

  //               if (parkingDuration < 15) lessThan15++;
  //               else if (parkingDuration >= 15 && parkingDuration <= 30) between15And30++;
  //               else moreThan30++;
  //           });

  //           const avgParkingTime = locationEvents.length > 0 ? (totalTime / locationEvents.length).toFixed(2) : 0;
  //           totalParkingTime += totalTime;
  //           totalParkingCount += locationEvents.length;

  //           const totalEventCount = lessThan15 + between15And30 + moreThan30;
  //           const lessThan15Percentage = totalEventCount > 0 ? ((lessThan15 / totalEventCount) * 100).toFixed(2) : 0;
  //           const between15And30Percentage = totalEventCount > 0 ? ((between15And30 / totalEventCount) * 100).toFixed(2) : 0;
  //           const moreThan30Percentage = totalEventCount > 0 ? ((moreThan30 / totalEventCount) * 100).toFixed(2) : 0;

  //           locationStats.push({
  //               locationName: location.name,
  //               capacityUtilization: `${utilization}%`,
  //               averageParkingTime: `${avgParkingTime} mins`,
  //               parkingDurations: {
  //                   lessThan15: `${lessThan15Percentage}%`,
  //                   between15And30: `${between15And30Percentage}%`,
  //                   moreThan30: `${moreThan30Percentage}%`
  //               }
  //           });
  //       }

  //       const avgCapacityUtilization = locationCount > 0 ? (totalUtilization / locationCount).toFixed(2) : "0";
  //       const overallAverageParkingTime = totalParkingCount > 0 ? (totalParkingTime / totalParkingCount).toFixed(2) : 0;

  //       return apiResponse.OK({
  //           res,
  //           message: "Events for authorised plates retrieved successfully, with overall metrics.",
  //           data: {
  //               totalCount,
  //               currentPage: pageNumber,
  //               totalPages: Math.ceil(totalCount / limitNumber),
  //               events,
  //               locationStats,
  //               overallAverageParkingTime: `${overallAverageParkingTime} mins`,
  //               totalAllEventsCount,
  //               avgCapacityUtilization: `${avgCapacityUtilization}%`,
  //           },
  //       });
  //   } catch (error) {
  //       console.error("Error fetching events for authorised plates:", error.message);
  //       logger.error("Error fetching events for authorised plates:", error);

  //       return apiResponse.CATCH_ERROR({
  //           res,
  //           message: messages.INTERNAL_SERVER_ERROR,
  //       });
  //   }
  // },

  getAllAuthPlatesEvents: async (req, res) => {
    try {
      const { startDate, endDate, metricsStartDate, metricsEndDate } = req.query;
      const { roleId, parkingplot } = req.user;
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Invalid page or limit value.",
        });
      }

      if (startDate && isNaN(Date.parse(startDate))) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Invalid startDate format. Use ISO date format (e.g., YYYY-MM-DD).",
        });
      }
      if (endDate && isNaN(Date.parse(endDate))) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Invalid endDate format. Use ISO date format (e.g., YYYY-MM-DD).",
        });
      }

      let locationQuery = {};

      if (roleId.name === "super_admin") {
        if (parkingplot && parkingplot.length > 0) {
          locationQuery.locationId = { $in: parkingplot };
        } else {
          return apiResponse.OK({
            res,
            message: "No locations assigned to this super_admin.",
            data: {
              totalCount: 0,
              currentPage: pageNumber,
              totalPages: 0,
              events: [],
            },
          });
        }
      } else {
        return apiResponse.FORBIDDEN({
          res,
          message: "You do not have permission to access this resource.",
        });
      }

      const authorisedPlates = await DB.DAHAUTHPLATE.find(locationQuery).distinct("plateNumber");

      const allEventsQuery = { locationId: locationQuery.locationId, entryTime: { $ne: null }, exitTime: { $ne: null }, $expr: { $ne: ["$entryTime", "$exitTime"] } };

      if (startDate || endDate) {
        allEventsQuery.createdAt = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setUTCHours(0, 0, 0, 0);
          allEventsQuery.createdAt.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setUTCHours(23, 59, 59, 999);
          allEventsQuery.createdAt.$lte = end;
        }
      }

      console.log('allEventsQuery', allEventsQuery)
      const totalAllEventsCount = await DB.DAHEVENT.countDocuments(allEventsQuery);
      const allEvents = await DB.DAHEVENT.find(allEventsQuery);


      const eventQuery = {
        plateNumber: { $in: authorisedPlates },
        locationId: locationQuery.locationId,
      };
      if (startDate || endDate) {
        eventQuery.createdAt = allEventsQuery.createdAt;
      } else {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        eventQuery.createdAt = {
          $gte: start,
          $lte: end
        };
      }

      // if (startDate === endDate) {
      //   delete allEventsQuery.createdAt;
      // }

      const totalAllEventsCount1 = await DB.DAHEVENT.countDocuments(allEventsQuery);
      const allEvents1 = await DB.DAHEVENT.find(allEventsQuery);
      // const eventsForParkingTimeCalc = allEvents.filter(event => {
      //   return !(authorisedPlates.includes(event.plateNumber) && event.isViolation === true);
      // });

      console.log('startDate === endDate', moment().format("YYYY-MM-DD") === startDate && moment().format("YYYY-MM-DD") === endDate)
      const eventsForParkingTimeCalc = allEvents.filter(
        event => !authorisedPlates.includes(event.plateNumber) && event.isViolation !== true
      );

      console.log('eventsForParkingTimeCalc', eventsForParkingTimeCalc.length)

      const totalCount = await DB.DAHEVENT.countDocuments(eventQuery);
      const events = await DB.DAHEVENT.find(eventQuery)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

      const locations = await DB.DAHLOCATION.find({ _id: { $in: parkingplot } });

      let locationStats = [];
      let totalParkingTime = 0;
      let totalParkingCount = 0;
      let totalUtilization = 0;
      let locationCount = locations.length;

      let totalLessThan15 = 0, totalBetween15And30 = 0, totalMoreThan30 = 0;

      for (const location of locations) {
        let locationEvents = allEvents.filter(event => event.locationId.toString() === location._id.toString());

        if (metricsStartDate || metricsEndDate) {
          locationEvents = locationEvents.filter(event => {
            const eventDate = new Date(event.createdAt);
            return (!metricsStartDate || eventDate >= new Date(metricsStartDate)) &&
              (!metricsEndDate || eventDate <= new Date(metricsEndDate));
          });
        }
        console.log('locationEvents', locationEvents.length)

        const maxParkingSlots = location.maxParkingSlots || 0;
        const occupiedSpaces = locationEvents.length;
        const utilization = maxParkingSlots > 0 ? ((occupiedSpaces / maxParkingSlots) * 100).toFixed(2) : 0;
        totalUtilization += parseFloat(utilization);

        let lessThan15 = 0, between15And30 = 0, moreThan30 = 0, totalTime = 0;

        locationEvents.forEach(event => {
          const parkingDuration = (new Date(event.exitTime) - new Date(event.entryTime)) / (1000 * 60);
          totalTime += parkingDuration;

          if (parkingDuration < 15) lessThan15++;
          else if (parkingDuration >= 15 && parkingDuration <= 30) between15And30++;
          else moreThan30++;
        });

        const avgParkingTime = locationEvents.length > 0 ? (totalTime / locationEvents.length).toFixed(2) : 0;
        totalParkingTime += totalTime;
        totalParkingCount += locationEvents.length;

        const totalEventCount = lessThan15 + between15And30 + moreThan30;
        const lessThan15Percentage = totalEventCount > 0 ? ((lessThan15 / totalEventCount) * 100).toFixed(2) : 0;
        const between15And30Percentage = totalEventCount > 0 ? ((between15And30 / totalEventCount) * 100).toFixed(2) : 0;
        const moreThan30Percentage = totalEventCount > 0 ? ((moreThan30 / totalEventCount) * 100).toFixed(2) : 0;

        totalLessThan15 += parseFloat(lessThan15Percentage);
        totalBetween15And30 += parseFloat(between15And30Percentage);
        totalMoreThan30 += parseFloat(moreThan30Percentage);

        locationStats.push({
          locationName: location.name,
          capacityUtilization: `${utilization}%`,
          averageParkingTime: `${avgParkingTime} mins`,
          parkingDurations: {
            lessThan15: `${lessThan15Percentage}%`,
            between15And30: `${between15And30Percentage}%`,
            moreThan30: `${moreThan30Percentage}%`
          }
        });
      }

      const avgCapacityUtilization = locationCount > 0 ? (totalUtilization / locationCount).toFixed(2) : "0";
      // const overallAverageParkingTime = totalParkingCount > 0 ? (totalParkingTime / totalParkingCount).toFixed(2) : 0;

      let totalFilteredTime = 0;
      let filteredCount = 0;



      eventsForParkingTimeCalc.forEach(event => {
        const duration = (new Date(event.exitTime) - new Date(event.entryTime)) / (1000 * 60); // in minutes
        if (!isNaN(duration)) {
          totalFilteredTime += duration;
          filteredCount++;
        }
      });

      console.log('totalFilteredTime', totalFilteredTime)
      console.log('filteredCount', filteredCount)
      const overallAverageParkingTime = filteredCount > 0 ? (totalFilteredTime / filteredCount).toFixed(2) : "0";
      console.log('overallAverageParkingTime', overallAverageParkingTime)


      const totalEvents = totalLessThan15 + totalBetween15And30 + totalMoreThan30;

      const avgLessThan15 = totalEvents > 0 ? ((totalLessThan15 / totalEvents) * 100).toFixed(2) : "0";
      const avgBetween15And30 = totalEvents > 0 ? ((totalBetween15And30 / totalEvents) * 100).toFixed(2) : "0";
      const avgMoreThan30 = totalEvents > 0 ? ((totalMoreThan30 / totalEvents) * 100).toFixed(2) : "0";
      return apiResponse.OK({
        res,
        message: "Events for authorised plates retrieved successfully, with overall metrics.",
        data: {
          totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          events,
          locationStats,
          overallAverageParkingTime: `${overallAverageParkingTime} mins`,
          totalAllEventsCount: moment().format("YYYY-MM-DD") === startDate && moment().format("YYYY-MM-DD") === endDate ? totalAllEventsCount1 : totalAllEventsCount,
          avgCapacityUtilization: `${avgCapacityUtilization}%`,
          avgParkingDurations: {
            lessThan15: `${avgLessThan15}%`,
            between15And30: `${avgBetween15And30}%`,
            moreThan30: `${avgMoreThan30}%`
          }
        },
      });
    } catch (error) {
      console.error("Error fetching events for authorised plates:", error.message);
      logger.error("Error fetching events for authorised plates:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  // getUtiliseEvents: async (req, res) => {
  //   try {
  //     const { roleId, parkingplot } = req.user;
  //     const page = parseInt(req.query.page || 1, 10);
  //     const limit = parseInt(req.query.limit || 10, 10);

  //     if (roleId.name !== "super_admin") {
  //       return apiResponse.FORBIDDEN({
  //         res,
  //         message: "You do not have permission to access this resource.",
  //       });
  //     }

  //     if (!parkingplot || parkingplot.length === 0) {
  //       return apiResponse.OK({
  //         res,
  //         message: "No locations assigned to this super_admin.",
  //         data: {
  //           totalCount: 0,
  //           currentPage: page,
  //           totalPages: 0,
  //           events: [],
  //         },
  //       });
  //     }

  //     const validQuery = {
  //       locationId: { $in: parkingplot },
  //       entryTime: { $ne: null }, // Only condition needed for validEvents
  //     };

  //     const totalValidEvents = await DB.DAHEVENT.countDocuments(validQuery);
  //     const validEvents = await DB.DAHEVENT.find(validQuery)
  //       .skip((page - 1) * limit)
  //       .limit(limit);

  //     // All events to calculate total counts for percentage
  //     const allEvents = await DB.DAHEVENT.find({ locationId: { $in: parkingplot } });

  //     let weeklyUtilization = {};
  //     let monthlyUtilization = {};

  //     for (let i = 0; i < 7; i++) {
  //       const day = moment().startOf("week").add(i, "days").format("dddd");
  //       weeklyUtilization[day] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
  //     }

  //     for (let i = 0; i < 12; i++) {
  //       const month = moment().month(i).format("MMMM");
  //       monthlyUtilization[month] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
  //     }

  //     const startOfWeek = moment().startOf('isoWeek'); // Use 'week' if your week starts on Sunday
  //     const endOfWeek = moment().endOf('isoWeek');

  //     const startOfMonth = moment().startOf('month');
  //     const endOfMonth = moment().endOf('month');

  //     allEvents.forEach((event) => {
  //       const createdAt = moment(event.createdAt);

  //       // Filter for current week
  //       if (createdAt.isBetween(startOfWeek, endOfWeek, null, '[]')) {
  //         const day = createdAt.format("dddd");
  //         if (weeklyUtilization[day]) weeklyUtilization[day].totalEvents += 1;
  //         if (event.entryTime) {
  //           if (weeklyUtilization[day]) weeklyUtilization[day].validEvents += 1;
  //         }
  //       }

  //       // Filter for current month
  //       if (createdAt.isBetween(startOfMonth, endOfMonth, null, '[]')) {
  //         const month = createdAt.format("MMMM");
  //         if (monthlyUtilization[month]) monthlyUtilization[month].totalEvents += 1;

  //         if (event.entryTime) {
  //           if (monthlyUtilization[month]) monthlyUtilization[month].validEvents += 1;
  //         }
  //       }
  //     });


  //     // Calculate percentages
  //     Object.keys(weeklyUtilization).forEach((day) => {
  //       const data = weeklyUtilization[day];
  //       const percentage = data.totalEvents > 0 ? ((data.validEvents / data.totalEvents) * 100).toFixed(2) : "0.00";
  //       data.percentage = `${Math.min(percentage, 100)}%`;
  //     });

  //     Object.keys(monthlyUtilization).forEach((month) => {
  //       const data = monthlyUtilization[month];
  //       const percentage = data.totalEvents > 0 ? ((data.validEvents / data.totalEvents) * 100).toFixed(2) : "0.00";
  //       data.percentage = `${Math.min(percentage, 100)}%`;
  //     });

  //     return apiResponse.OK({
  //       res,
  //       message: "Valid events retrieved successfully with weekly and monthly utilization.",
  //       data: {
  //         totalCount: totalValidEvents,
  //         currentPage: page,
  //         totalPages: Math.ceil(totalValidEvents / limit),
  //         events: validEvents,
  //         weeklyUtilization,
  //         monthlyUtilization,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching utilization events:", error);
  //     logger.error("Error fetching utilization events:", error);
  //     return apiResponse.CATCH_ERROR({
  //       res,
  //       message: messages.INTERNAL_SERVER_ERROR,
  //     });
  //   }
  // },


  // getUtiliseEvents: async (req, res) => {
  //   try {
  //     const { roleId, parkingplot } = req.user;
  //     const page = parseInt(req.query.page || 1, 10);
  //     const limit = parseInt(req.query.limit || 10, 10);

  //     // Read metricStartDate and metricEndDate from query
  //     // Calculate weekly date range (Sunday to Saturday) from metricStartDate if provided
  //     const metricStartDate = req.query.metricStartDate
  //       ? moment(req.query.metricStartDate).startOf("week") // Start from Sunday
  //       : moment().startOf("isoWeek"); // Default to ISO week (Monday)

  //     const metricEndDate = req.query.metricStartDate
  //       ? moment(req.query.metricStartDate).endOf("week") // End on Saturday
  //       : moment().endOf("isoWeek"); // Default to ISO week (Sunday)


  //     const metricStartMonth = req.query.metricStartDate
  //       ? moment(req.query.metricStartDate).startOf("month")
  //       : moment().startOf("month");

  //     const metricEndMonth = req.query.metricEndDate
  //       ? moment(req.query.metricEndDate).endOf("month")
  //       : moment().endOf("month");

  //     if (roleId.name !== "super_admin") {
  //       return apiResponse.FORBIDDEN({
  //         res,
  //         message: "You do not have permission to access this resource.",
  //       });
  //     }

  //     if (!parkingplot || parkingplot.length === 0) {
  //       return apiResponse.OK({
  //         res,
  //         message: "No locations assigned to this super_admin.",
  //         data: {
  //           totalCount: 0,
  //           currentPage: page,
  //           totalPages: 0,
  //           events: [],
  //           weeklyUtilization: {},
  //           monthlyUtilization: {},
  //           weeklyMetricStartDate: null,
  //           weeklyMetricEndDate: null,
  //           monthlyMetricStartDate: null,
  //           monthlyMetricEndDate: null,
  //         },
  //       });
  //     }

  //     const validQuery = {
  //       locationId: { $in: parkingplot },
  //       entryTime: { $ne: null },
  //     };

  //     const totalValidEvents = await DB.DAHEVENT.countDocuments(validQuery);
  //     const validEvents = await DB.DAHEVENT.find(validQuery)
  //       .skip((page - 1) * limit)
  //       .limit(limit);

  //     const allEvents = await DB.DAHEVENT.find({ locationId: { $in: parkingplot } });

  //     let weeklyUtilization = {};
  //     let monthlyUtilization = {};

  //     for (let i = 0; i < 7; i++) {
  //       const day = moment(metricStartDate).add(i, "days").format("dddd");
  //       weeklyUtilization[day] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
  //     }

  //     for (let i = 0; i < 12; i++) {
  //       const month = moment().month(i).format("MMMM");
  //       monthlyUtilization[month] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
  //     }

  //     allEvents.forEach((event) => {
  //       const createdAt = moment(event.createdAt);

  //       // Weekly (custom range from query)
  //       if (createdAt.isBetween(metricStartDate, metricEndDate, null, '[]')) {
  //         const day = createdAt.format("dddd");
  //         if (weeklyUtilization[day]) weeklyUtilization[day].totalEvents += 1;
  //         if (event.entryTime) {
  //           if (weeklyUtilization[day]) weeklyUtilization[day].validEvents += 1;
  //         }
  //       }

  //       // Monthly (custom range from query)
  //       if (createdAt.isBetween(metricStartMonth, metricEndMonth, null, '[]')) {
  //         const month = createdAt.format("MMMM");
  //         if (monthlyUtilization[month]) monthlyUtilization[month].totalEvents += 1;
  //         if (event.entryTime) {
  //           if (monthlyUtilization[month]) monthlyUtilization[month].validEvents += 1;
  //         }
  //       }
  //     });

  //     Object.keys(weeklyUtilization).forEach((day) => {
  //       const data = weeklyUtilization[day];
  //       const percentage = data.totalEvents > 0
  //         ? ((data.validEvents / data.totalEvents) * 100).toFixed(2)
  //         : "0.00";
  //       data.percentage = `${Math.min(percentage, 100)}%`;
  //     });

  //     Object.keys(monthlyUtilization).forEach((month) => {
  //       const data = monthlyUtilization[month];
  //       const percentage = data.totalEvents > 0
  //         ? ((data.validEvents / data.totalEvents) * 100).toFixed(2)
  //         : "0.00";
  //       data.percentage = `${Math.min(percentage, 100)}%`;
  //     });

  //     return apiResponse.OK({
  //       res,
  //       message: "Valid events retrieved successfully with weekly and monthly utilization.",
  //       data: {
  //         totalCount: totalValidEvents,
  //         currentPage: page,
  //         totalPages: Math.ceil(totalValidEvents / limit),
  //         events: validEvents,
  //         weeklyUtilization,
  //         monthlyUtilization,
  //         weeklyMetricStartDate: metricStartDate.toISOString(),
  //         weeklyMetricEndDate: metricEndDate.toISOString(),
  //         monthlyMetricStartDate: metricStartMonth.toISOString(),
  //         monthlyMetricEndDate: metricEndMonth.toISOString(),
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching utilization events:", error);
  //     logger.error("Error fetching utilization events:", error);
  //     return apiResponse.CATCH_ERROR({
  //       res,
  //       message: messages.INTERNAL_SERVER_ERROR,
  //     });
  //   }
  // },



  getUtiliseEvents: async (req, res) => {
    try {
      const { roleId, parkingplot } = req.user;
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 10, 10);

      if (roleId.name !== "super_admin") {
        return apiResponse.FORBIDDEN({
          res,
          message: "You do not have permission to access this resource.",
        });
      }

      if (!parkingplot || parkingplot.length === 0) {
        return apiResponse.OK({
          res,
          message: "No locations assigned to this super_admin.",
          data: {
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            events: [],
            weeklyUtilization: {},
            monthlyUtilization: {},
            weeklyMetricStartDate: null,
            weeklyMetricEndDate: null,
            monthlyMetricStartDate: null,
            monthlyMetricEndDate: null,
          },
        });
      }

      // Preserve original valid query
      const validQuery = {
        locationId: { $in: parkingplot },
        entryTime: { $ne: null },
      };

      const totalValidEvents = await DB.DAHEVENT.countDocuments(validQuery);
      const validEvents = await DB.DAHEVENT.find(validQuery)
        .skip((page - 1) * limit)
        .limit(limit);

      const allEvents = await DB.DAHEVENT.find({ locationId: { $in: parkingplot } });

      // Setup metric date ranges
      const customMetricStart = req.query.metricStartDate ? moment(req.query.metricStartDate) : null;
      const customMetricEnd = req.query.metricEndDate ? moment(req.query.metricEndDate) : null;

      const metricStartDate = customMetricStart
        ? moment(customMetricStart).startOf("week") // Sunday
        : moment().startOf("isoWeek"); // Monday (default)

      const metricEndDate = customMetricStart
        ? moment(customMetricStart).endOf("week") // Saturday
        : moment().endOf("isoWeek"); // Sunday (default)

      const metricStartMonth = customMetricStart
        ? moment(customMetricStart).startOf("month")
        : moment().startOf("month");

      const metricEndMonth = customMetricEnd
        ? moment(customMetricEnd).endOf("month")
        : moment().endOf("month");

      let weeklyUtilization = {};
      let monthlyUtilization = {};

      // Weekly (Sun–Sat)
      for (let i = 0; i < 7; i++) {
        const day = moment(metricStartDate).add(i, "days").format("dddd");
        weeklyUtilization[day] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
      }

      // Monthly (Jan–Dec)
      for (let i = 0; i < 12; i++) {
        const month = moment().month(i).format("MMMM");
        monthlyUtilization[month] = { validEvents: 0, totalEvents: 0, percentage: "0.00%" };
      }

      allEvents.forEach((event) => {
        const createdAt = moment(event.createdAt);

        // Weekly range check
        if (createdAt.isBetween(metricStartDate, metricEndDate, null, "[]")) {
          const day = createdAt.format("dddd");
          if (weeklyUtilization[day]) weeklyUtilization[day].totalEvents += 1;
          if (event.entryTime) weeklyUtilization[day].validEvents += 1;
        }

        // Monthly range check
        if (createdAt.isBetween(metricStartMonth, metricEndMonth, null, "[]")) {
          const month = createdAt.format("MMMM");
          if (monthlyUtilization[month]) monthlyUtilization[month].totalEvents += 1;
          if (event.entryTime) monthlyUtilization[month].validEvents += 1;
        }
      });

      // Calculate percentages
      Object.keys(weeklyUtilization).forEach((day) => {
        const data = weeklyUtilization[day];
        const percentage = data.totalEvents > 0
          ? ((data.validEvents / data.totalEvents) * 100).toFixed(2)
          : "0.00";
        data.percentage = `${Math.min(percentage, 100)}%`;
      });

      Object.keys(monthlyUtilization).forEach((month) => {
        const data = monthlyUtilization[month];
        const percentage = data.totalEvents > 0
          ? ((data.validEvents / data.totalEvents) * 100).toFixed(2)
          : "0.00";
        data.percentage = `${Math.min(percentage, 100)}%`;
      });

      return apiResponse.OK({
        res,
        message: "Valid events retrieved successfully with weekly and monthly utilization.",
        data: {
          totalCount: totalValidEvents,
          currentPage: page,
          totalPages: Math.ceil(totalValidEvents / limit),
          events: validEvents,
          weeklyUtilization,
          monthlyUtilization,
          weeklyMetricStartDate: metricStartDate.toISOString(),
          weeklyMetricEndDate: metricEndDate.toISOString(),
          monthlyMetricStartDate: metricStartMonth.toISOString(),
          monthlyMetricEndDate: metricEndMonth.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching utilization events:", error);
      logger.error("Error fetching utilization events:", error);
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  toggleLocationStatus: async (req, res) => {
    const { locationId } = req.query;

    try {
      // Find the location by ID
      const location = await DB.DAHLOCATION.findById(locationId);

      if (!location) {
        return apiResponse.NOT_FOUND({
          res,
          message: `Location with ID ${locationId} not found.`,
        });
      }

      // Toggle the locationStatus
      location.locationStatus =
        location.locationStatus === "available" ? "not available" : "available";

      // Save the updated location
      await location.save();

      return apiResponse.OK({
        res,
        data: location,
        message: `Location status toggled to ${location.locationStatus}.`,
      });
    } catch (error) {
      console.error("Error toggling location status:", error.message);

      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },

  //this api is called at client panel to get location data with auth plate events

  // getAllLocationsWithEvents: async (req, res) => {
  //   try {
  //     // Fetch all locations
  //     const locations = await DB.DAHLOCATION.find({});

  //     // Fetch events for each location
  //     const locationsWithEvents = await Promise.all(
  //       locations.map(async (location) => {
  //         // Find events in dahAuthPlate that reference this location
  //         const events = await DB.DAHAUTHPLATE.find({ locationId: location._id });

  //         // Map events to include only plateNumber, fromTime, and toTime
  //         const formattedEvents = events.map((event) => ({
  //           plateNumber: event.plateNumber,
  //           fromTime: event.fromTime,
  //           toTime: event.toTime,
  //         }));

  //         // Return the location data with events
  //         return {
  //           _id: location._id,
  //           name: location.name,
  //           locationStatus: location.locationStatus,
  //           maxParkingSlots: location.maxParkingSlots,
  //           totalIncomeCurrentMonth: location.totalIncomeCurrentMonth,
  //           totalSalesQuarter: location.totalSalesQuarter,
  //           totalIncomePerYear: location.totalIncomePerYear,
  //           events: formattedEvents, // Events from dahAuthPlate
  //         };
  //       })
  //     );

  //     return apiResponse.OK({
  //       res,
  //       data: locationsWithEvents,
  //       message: "All locations with events retrieved successfully.",
  //     });
  //   } catch (error) {
  //     console.error("Error fetching locations with events:", error.message);

  //     return apiResponse.CATCH_ERROR({
  //       res,
  //       message: "An internal server error occurred.",
  //       error: error.message,
  //     });
  //   }},

  getAllLocationsWithEvents: async (req, res) => {
    try {

      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const { roleId, parkingplot } = req.user;

      let locationQuery = {};

      // Apply role-based filtering
      if (roleId?.name === "super_admin") {
        if (parkingplot && parkingplot.length > 0) {
          locationQuery._id = { $in: parkingplot };
        }
      }

      const totalLocations = await DB.DAHLOCATION.countDocuments(locationQuery);


      const locations = await DB.DAHLOCATION.find(locationQuery)
        .skip((page - 1) * limit)
        .limit(limit);



      let combinedTotals = {
        maxParkingSlots: 0,
        totalIncomeCurrentMonth: 0,
        totalSalesQuarter: 0,
        totalIncomePerYear: 0,
      };

      // Fetch events for each location
      const locationsWithEvents = await Promise.all(
        locations.map(async (location) => {
          // Accumulate combined totals
          combinedTotals.maxParkingSlots += location.maxParkingSlots || 0;
          combinedTotals.totalIncomeCurrentMonth += location.totalIncomeCurrentMonth || 0;
          combinedTotals.totalSalesQuarter += location.totalSalesQuarter || 0;
          combinedTotals.totalIncomePerYear += location.totalIncomePerYear || 0;

          // Find authorized plates that reference this location
          const authPlates = await DB.DAHAUTHPLATE.find({ locationId: location._id });

          // Fetch events based on plate numbers from DAHEVENT
          const events = await Promise.all(
            authPlates.map(async (authPlate) => {
              const plateEvents = await DB.DAHEVENT.find({ plateNumber: authPlate.plateNumber });

              return plateEvents.map((event) => ({
                plateNumber: authPlate.plateNumber,
                entryTime: event.entryTime,
                exitTime: event.exitTime,
              }));
            })
          );

          // Flatten the events array
          const formattedEvents = events.flat();

          // Return the location data with events
          return {
            _id: location._id,
            name: location.name,
            locationStatus: location.locationStatus,
            maxParkingSlots: location.maxParkingSlots,
            totalIncomeCurrentMonth: location.totalIncomeCurrentMonth,
            totalSalesQuarter: location.totalSalesQuarter,
            totalIncomePerYear: location.totalIncomePerYear,
            pincode: location.pincode,
            hourlyRate: location.hourlyRate,
            GrtVehicleRate: location.GrtVehicleRate,
            ExtendVehicleTime: location.ExtendVehicleTime,
            events: formattedEvents, // Events from DAHEVENT
          };
        })
      );

      return apiResponse.OK({
        res,
        data: {
          locations: locationsWithEvents,
          pagination: {
            totalRecords: totalLocations,
            currentPage: page,
            totalPages: Math.ceil(totalLocations / limit),
          },
          combinedTotals,
        },
        message: "All locations with events retrieved successfully.",
      });
    } catch (error) {
      console.error("Error fetching locations with events:", error.message);

      return apiResponse.CATCH_ERROR({
        res,
        message: "An internal server error occurred.",
        error: error.message,
      });
    }
  },

  addParkingRequest: async (req, res) => {
    try {
      console.log("Incoming request body:", req.body);

      let { name, location, availableSpots, status } = req.body;

      // Set default status if not provided
      if (!status) {
        status = "pending";
      }

      console.log("Extracted Data:", { name, location, availableSpots, status });

      if (!name || !location || !availableSpots) {
        return apiResponse.NOT_FOUND({ success: false, message: "All fields are required" });
      }

      const newRequest = new DB.PARKINGREQUEST({ name, location, availableSpots, status });
      await newRequest.save();

      console.log("New Parking Request Saved:", newRequest);

      return apiResponse.OK({ res, success: true, message: "Parking request submitted", data: newRequest });
    } catch (error) {
      console.error("Error adding parking request:", error);
      return apiResponse.CATCH_ERROR({ success: false, message: messages.INTERNAL_SERVER_ERROR });
    }
  },


  getParkingRequests: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const totalRecords = await DB.PARKINGREQUEST.countDocuments();
      const requests = await DB.PARKINGREQUEST.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const formattedRequests = await Promise.all(
        requests.map(async (request) => {
          const user = await DB.USER.findOne({ userId: request.userId }, "name vorname nachname");

          return {
            _id: request._id,
            name: request.name,
            location: request.location,
            availableSpots: request.availableSpots,
            status: request.status,
            createdAt: request.createdAt,
            requestedBy: user ? `${user.vorname} ${user.nachname}` : "Unknown",
          };
        })
      );

      return apiResponse.OK({
        res,
        success: true,
        message: "Parking requests fetched successfully",
        data: {
          requests: formattedRequests,
          pagination: {
            totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching parking requests:", error);
      return apiResponse.CATCH_ERROR({ success: false, message: messages.INTERNAL_SERVER_ERROR });
    }
  },


};


// cron.schedule("* * * * *", async () => {
//   console.log("Checking for new parking requests...");

//   const pendingRequests = await DB.PARKINGREQUEST.find({ status: "pending" });

//   if (pendingRequests.length > 0 && global.io) {
//     global.io.emit("pending-parking-requests", {
//       success: true,
//       message: "There are new pending parking requests",
//       data: pendingRequests,
//     });
//   }
// });
