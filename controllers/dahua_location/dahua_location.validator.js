const Joi = require("joi");
const validator = require("../../middleware/validator");
const DB = require("../../models");



module.exports = {


  // Validator for fetching all locations with optional pagination
  // getAllLocations: validator({
  //   query: Joi.object({
  //     page: Joi.number().integer().min(1).default(1),
  //     limit: Joi.number().integer().min(1).max(100).default(10),
  //   }),
  
  // }),

  createLocation: validator({
    body: Joi.object({
      name: Joi.string(),
      maxParkingTime: Joi.number().required(),
    }),
  }),


  // Validator for fetching a location by ID
  getLocationById: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),


  // Validator for updating a location by ID
  updateLocation: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      name: Joi.string(),
      maxParkingTime: Joi.number().optional(),
    }),
  }),

  // Validator for deleting a location by ID
  deleteLocation: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),

  // Validator for getLocationEvents API
  getLocationEvents: validator({
    query: Joi.object({
      locationId: Joi.string().optional(),
      search: Joi.string().optional(),
      page: Joi.number().integer().positive().optional().default(1),
      limit: Joi.number().integer().positive().optional().default(10),
      isViolation: Joi.boolean().optional(),
      startDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
        .optional()
        .messages({
          "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
        }),
      endDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
        .optional()
        .messages({
          "string.pattern.base": "End date must be in YYYY-MM-DD format.",
        }),
      download: Joi.boolean().optional(),

    }),
  }),


  // createLocationWithDevice : validator({
  //   body: Joi.object({
  //     name: Joi.string()
  //       .required()
  //       .messages({
  //         'string.base': `"name" should be a type of 'string'`,
  //         'string.empty': `"name" cannot be an empty field`,
  //         'any.required': `"name" is a required field`
  //       }),
  //     maxParkingTime: Joi.number().required()
  //       .messages({
  //         'number.base': `"maxParkingTime" should be a type of 'number'`,
  //         'any.required': `"maxParkingTime" is a required field`
  //       }),
  //     deviceIds: Joi.array()
  //       .items(Joi.string().required())
  //       .min(1)
  //       .required()
  //       .messages({
  //         'array.min': `"deviceId" must contain at least one item`,
  //         'array.base': `"deviceId" should be an array of strings`,
  //         'any.required': `"deviceId" is a required field`
  //       })
  //   })
  // }),


  updateViolationStatus: validator({
    body: Joi.object({
      reason: Joi.string().required(),
      otherReason: Joi.string().optional(),
    }),
    query: Joi.object({
      eventId: Joi.array().items(Joi.string()).required(),
    }),
  }),




};
