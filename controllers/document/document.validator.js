const Joi = require("joi");
const validator = require("../../middleware/validator");

const validCategories = ['Angebot & Vertrag', 'Logos, Hintergrunde', 'Unternehmenspräsentation', 'Vertriebsunterstutzung', 'Akademieunterlagen', '2Park Kundenvertrag'];

module.exports = {

    uploadDocument: validator({
        body: Joi.object({
            category: Joi.string().valid(...validCategories).messages({
                'any.required': "Category is required",
                'string.empty': "Category cannot be empty",
            }),
            name: Joi.string()
        }),
        files: Joi.object({
            file: Joi.object({
                location: Joi.string()
                    .required()
                    .messages({
                        'string.empty': "File is required",
                    }),
            }).required()
        }).unknown() // Allow additional properties like files if they are present in the form-data
    }),

    // getDocumentsByCategory: validator({
    //     params: Joi.object({
    //         category: Joi.string().valid(...validCategories)
    //             .required()
    //             .messages({
    //                 'string.empty': "Category is required",
    //             }),
    //     })
    // })

    getDocumentsByCategory: validator({
        query: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).optional(),
        }),
    }),

};
    