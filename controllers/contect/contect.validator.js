const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    addContect: validator({
        body: Joi.object({
            description: Joi.string(),
            crowd: Joi.string(),
            date: Joi.date(),
            company_name: Joi.string(),
            contact_person: Joi.string(),
            email: Joi.string(),
            telephone: Joi.number(),
            contectCategory: Joi.string()
        }),
    }),

    getContect: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            crowd: Joi.string(),
        }),
    }),

    deleteContect: validator({
        query: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        })
    })

};
