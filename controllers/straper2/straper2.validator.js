const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    addStraper: validator({
        body: Joi.object({
            Telefon: Joi.string(),
            Vor_und_Nachname: Joi.string(),
            bothersOr: Joi.string(),
            capacity: Joi.string(),
            email: Joi.string(),
            important: Joi.array().items(Joi.string()),
            innerFlow: Joi.string(),
            module: Joi.string(),
            offerFlow: Joi.string(),
            paytmentInAdvance: Joi.string(),
            period: Joi.string(),
            wallboxInclude: Joi.string(),
            Nr: Joi.string(),
            Ort: Joi.string(),
            PLZ: Joi.string(),
            Strabe: Joi.string(),
            Stromverbrauch: Joi.string(),
            roofType: Joi.string(),
            isIncludeGermanGuarantee: Joi.string(),
            manufacuresModule: Joi.string(),
            manufacuresSpeicher: Joi.string(),
            manufacuresWallbox: Joi.string(),
            manufacuresWechselrichter: Joi.string(),
            plannedFacility: Joi.string(),
            termOftheGuarantee: Joi.string(),
            particularImportant: Joi.array().items(Joi.string()),
            newOffer: Joi.string(),
        }),
    }),

    getStraper: validator({
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
            name: Joi.string()
        }),
    }),

    deleteStraper: validator({
        query: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        })
    })

};
