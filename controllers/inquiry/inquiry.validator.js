const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    addInquiry: validator({
        body: Joi.object({
            region: Joi.string(),
            crowd: Joi.string(),
            date: Joi.date(),
            email: Joi.string(),
            telephone: Joi.number(),
            contact_person: Joi.string(),
            company_name: Joi.string(),
            inquiryCategory: Joi.string()
        }),
    }),

    getInquiry: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            region: Joi.string(),
        }),
    }),

    deleteInquiry: validator({
        query: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        })
    })

};
