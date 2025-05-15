const Joi = require("joi");
const validator = require("../../middleware/validator");
const { query } = require("express");
module.exports = {

    createNotification: validator({
        body: Joi.object({
            title: Joi.string(),
            description: Joi.string(),
            receiver: Joi.array(),
            read: Joi.array(),
            view: Joi.array(),
            pin: Joi.array(),
        }),
    }),

    getAllNotification: validator({
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

    getUserNotification: validator({
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

    pinNotification: validator({
        query: Joi.object({
            id: Joi.string()
        }),
    }),

    unPinNotification: validator({
        query: Joi.object({
            id: Joi.string()
        }),
    }),

    deleteNotification: validator({
        query: Joi.object({
            id: Joi.string()
        })
    })

};
