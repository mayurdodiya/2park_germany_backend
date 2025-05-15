const Joi = require("joi");
const validator = require("../../middleware/validator");
const { query } = require("express");
module.exports = {

    addSelectDate: validator({
        body: Joi.object({
            isAvailable: Joi.boolean(),
            isAvailableTravel: Joi.boolean(),
            isNotAvailable: Joi.boolean(),
            date: Joi.array(),
        }),
    }),

    getSelectDate: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            projectName: Joi.string(),
            userName: Joi.string(),
            userId: Joi.array(),
            email: Joi.string(),
            name: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date()
        }),
    }),
    
};
