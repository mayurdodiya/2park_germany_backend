const Joi = require("joi");
const validator = require("../../middleware/validator");


module.exports = {


  // Validator for fetching all locations with optional pagination
  getAllAuthPlates: validator({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      locationId: Joi.string().required(),
    }),
  }),

  createAuthPlates: validator({
    body: Joi.object({
      plateNumber: Joi.string(),
      locationId: Joi.string().required(),
    }),
  }),


  // Validator for fetching a location by ID
  getAuthPlatesById: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),


  // Validator for updating a location by ID
  updateAuthPlates: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
    body: Joi.object({
      plateNumber: Joi.string(),
      locationId: Joi.string().optional(),
    }),
  }),

  // Validator for deleting a location by ID
  deleteAuthPlates: validator({
    query: Joi.object({
      id: Joi.string().required(),
    }),
  }),


};
