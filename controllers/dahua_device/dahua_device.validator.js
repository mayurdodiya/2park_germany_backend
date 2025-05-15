const Joi = require("joi");
const validator = require("../../middleware/validator");

module.exports = {
  // Validator for creating a device
  createDevice: validator({
    body: Joi.object({
      deviceId: Joi.string().required(),
      locationId: Joi.string().required(),
      // Add other fields validations if necessary
    }),
  }),

  // Validator for fetching a device by ID
  getDeviceById: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),

  // Validator for updating a device by ID
  updateDevice: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      deviceId: Joi.string().optional(),
      locationId: Joi.string().optional(),
      // Update other fields validations if necessary
    }),
  }),

  // Validator for deleting a device by ID
  deleteDevice: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),


  // Validator for getting all devices with pagination
  getAllDevices: validator({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(10),  // Pagination limit
      page: Joi.number().integer().min(1).default(1),             // Page number
    }),
  }),


};
