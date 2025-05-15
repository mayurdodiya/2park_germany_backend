const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const { logger } = require("../../utils/logger");

module.exports = {

  // Get all devices with optional pagination
  getAllDevices: async (req, res) => {
    try {
      const { limit, page } = req.query;
      const skip = (page - 1) * limit;

      const devices = await DB.DAHDEVICE.find()
        .skip(skip)
        .limit(limit);

      if (!devices.length) {
        return apiResponse.NOT_FOUND({
          res,
          message: "No devices found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Devices retrieved successfully.",
        data: devices,
      });
    } catch (error) {
      console.error("Error fetching devices:", error.message);
      logger.error("Error fetching devices:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while retrieving devices.",
      });
    }
  },

  // Create a device
  createDevice: async (req, res) => {
    try {
      const newDevice = new DB.DAHDEVICE({
        deviceId: req.body.deviceId,
        locationId: req.body.locationId,
      });
      const savedDevice = await newDevice.save();

      return apiResponse.OK({
        res,
        message: "Device created successfully.",
        data: savedDevice,
      });
    } catch (error) {
      console.error("Error creating device:", error.message);
      logger.error("Error creating device:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while creating device.",
      });
    }
  },

  // Fetch a single device by ID
  getDeviceById: async (req, res) => {
    try {
      const device = await DB.DAHDEVICE.findById(req.query.id).populate('locationId');
      if (!device) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Device not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Device retrieved successfully.",
        data: device,
      });
    } catch (error) {
      console.error("Error fetching device:", error.message);
      logger.error("Error fetching device:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while retrieving device.",
      });
    }
  },

  // Update a device by ID
  updateDevice: async (req, res) => {
    try {
      const updatedDevice = await DB.DAHDEVICE.findByIdAndUpdate(
        req.query.id,
        {
          deviceId: req.body.deviceId,
          locationId: req.body.locationId,
          // Update other fields as necessary
        },
        { new: true }
      );

      if (!updatedDevice) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Device not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Device updated successfully.",
        data: updatedDevice,
      });
    } catch (error) {
      console.error("Error updating device:", error.message);
      logger.error("Error updating device:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while updating device.",
      });
    }
  },

  // Delete a device by ID
  deleteDevice: async (req, res) => {
    try {
      const deletedDevice = await DB.DAHDEVICE.findByIdAndDelete(req.query.id);
      if (!deletedDevice) {
        return apiResponse.NOT_FOUND({
          res,
          message: "Device not found.",
        });
      }

      return apiResponse.OK({
        res,
        message: "Device deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting device:", error.message);
      logger.error("Error deleting device:", error);

      return apiResponse.CATCH_ERROR({
        res,
        message: "Server error while deleting device.",
      });
    }
  },
};
