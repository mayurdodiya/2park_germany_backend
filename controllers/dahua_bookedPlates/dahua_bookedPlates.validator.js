const Joi = require("joi");
const validator = require("../../middleware/validator");

module.exports = {
  createBooking: validator({
    body: Joi.object({
      plateNumber: Joi.string().required(),
      locationId: Joi.string().required().messages({
        "any.required": "Location ID is required.",
        "string.empty": "Location ID cannot be empty.",
      }),
      vehicleSize: Joi.string().valid("<=5m", ">5m").required().messages({
        "any.required": "Vehicle size is required.",
        "any.only": "Vehicle size must be '<=5m' or '>5m'.",
      }),
      name: Joi.string().required().messages({
        "any.required": "Name is required.",
        "string.empty": "Name cannot be empty.",
      }),
      nachname: Joi.string().required().messages({
        "any.required": "Nachname is required.",
        "string.empty": "Nachname cannot be empty.",
      }),
      // strabe: Joi.string().required().messages({
      //   "any.required": "Street is required.",
      //   "string.empty": "Street cannot be empty.",
      // }),
      strabe: Joi.string().optional(),
      email: Joi.string(),
      PLZ: Joi.number().optional(),
      Stadt: Joi.string().optional(),
      telephone: Joi.string().allow(null, ""),
      totalDuration: Joi.number().required(),
      totalFare: Joi.number().required(),
      fromTime: Joi.date().iso().required(),
      toTime: Joi.date().iso().required().greater(Joi.ref("fromTime")).messages({
        "any.required": "To time is required.",
        "date.base": "Invalid date format for toTime.",
        "date.greater": "To time must be after From time.",
      }),
    }),
    query: Joi.object({
      bookingId: Joi.string().optional(),
    }),
  }),
  capturePayment: validator({
    query: Joi.object({
      bookingId: Joi.string().required(),
      token: Joi.string().required().messages({
        "any.required": "token(orderId) is required.",
        "string.empty": "token(orderId) cannot be empty.",
      }),
    }),
  }),
  getBooking: validator({
    query: Joi.object({
      bookingId: Joi.string().required(),
    }),
  }),
};
