const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    addNewsLater: validator({
        body: Joi.object({
            email: Joi.string().required(),
        }),
    }),

    getNewsLater: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            email: Joi.string(),
        }),
    }),

    deleteNewsLater: validator({
        query: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        })
    })

};
