const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    signup: validator({
        body: Joi.object({
            email: Joi.string().required(),
            password: Joi.string().required(),
            name: Joi.string().allow("", null),
            vorname: Joi.string().allow("", null),
            nachname: Joi.string().allow("", null),
            projectName: Joi.string().allow("", null),
            patners: Joi.array().items(),
            vattenfallPatners: Joi.array().items(),
            vattenfallPatnersFlag: Joi.boolean(),
            uniqueTrackingId: Joi.string().allow("", null),
            userLead: Joi.number().allow(""),
            gender: Joi.string().allow(""),
            birthday: Joi.string().allow(""),
            phone: Joi.string().allow(""),
            streetHouseNumber: Joi.string().allow(""),
            postalCode: Joi.string().allow(""),
            location: Joi.string().allow(""),
            iban: Joi.string().allow(""),
            creditInstitution: Joi.string().allow(""),
            accountOwner: Joi.string().allow(""),
            signature: Joi.string().allow("", null),
            profileImage: Joi.string().allow("", null),
            compensation_Lead: Joi.number().allow("", null),
            compensation_Team: Joi.string().allow("", null),
            PVVertrieb: Joi.boolean(),
            parkingLocation: Joi.array().items(Joi.string()).optional(),
            role: Joi.string().valid("super_admin").optional(),
            parkingplot: Joi.array().allow("", null),
        }),
    }),


    signIn: validator({
        body: Joi.object({
            email: Joi.string(),
            name: Joi.string(),
            password: Joi.string().required(),
        })
    }),

    userToken: validator({
        body: Joi.object({
            token: Joi.string(),
            _id: Joi.string()
        })
    }),

    adminSignin: validator({
        body: Joi.object({
            email: Joi.string(),
            name: Joi.string(),
            password: Joi.string().required(),
        })
    }),


    forgot: validator({
        body: Joi.object({
            // email: Joi.string().required(),
            password: Joi.string().required(),
            token: Joi.string()
        }),
    }),

    sendEmail: validator({
        body: Joi.object({
            email: Joi.string().required(),
        }),
    }),


    verifyOtp: validator({
        body: Joi.object({
            email: Joi.string().required(),
            otp: Joi.string().required(),
        }),
    }),


    afterOtpVerify: validator({
        body: Joi.object({
            password: Joi.string().required(),
        })
    }),


    changePassword: validator({
        body: Joi.object({
            oldPassword: Joi.string().required(),
            newPassword: Joi.string().required(),
        }),
    }),


    update: validator({
        body: Joi.object({
            email: Joi.string(),
            name: Joi.string().allow("", null),
            vorname: Joi.string().allow("", null),
            nachname: Joi.string().allow("", null),
            projectName: Joi.string().allow("", null),
            uniqueTrackingId: Joi.string().allow("", null),
            patners: Joi.array().items(),
            vattenfallPatners: Joi.array().items(),
            vattenfallPatnersFlag: Joi.boolean(),
            userLead: Joi.number().allow(""),
            gender: Joi.string().allow(""),
            birthday: Joi.string().allow(""),
            phone: Joi.string().allow(""),
            streetHouseNumber: Joi.string().allow(""),
            postalCode: Joi.string().allow(""),
            location: Joi.string().allow(""),
            iban: Joi.string().allow(""),
            creditInstitution: Joi.string().allow(""),
            accountOwner: Joi.string().allow(""),
            signature: Joi.string().allow("", null),
            profileImage: Joi.string().allow("", null),
            password: Joi.string(),
            compensation_Lead: Joi.number().allow("", null),
            compensation_Team: Joi.string().allow("", null),
            PLZ: Joi.array().allow(null, ""),
            PVVertrieb: Joi.boolean(),
            steuernummer: Joi.string().allow("", null),
            parkingLocation: Joi.array().items(Joi.string()).optional(),
            parkingplot: Joi.array().allow("", null),
        }),
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),

    parkinglotownerupdate: validator({
        body: Joi.object({
            email: Joi.string(),
            name: Joi.string().allow("", null),
            vorname: Joi.string().allow("", null),
            nachname: Joi.string().allow("", null),
            gender: Joi.string().allow(""),
            birthday: Joi.string().allow(""),
            phone: Joi.string().allow(""),
            streetHouseNumber: Joi.string().allow(""),
            postalCode: Joi.string().allow(""),
            location: Joi.string().allow(""),
            signature: Joi.string().allow("", null),
            profileImage: Joi.string().allow("", null),
            password: Joi.string(),
            PLZ: Joi.array().allow(null, ""),
            parkingLocation: Joi.array().items(Joi.string()).optional(),
            parkingplot : Joi.array().items(Joi.string()).optional(),
        }),
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),

    reactivateUser: validator({
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),


    toggleActive: validator({
        params: Joi.object({
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID")
                .required(),
        }),
    }),


    fetch: validator({
        query: Joi.object({
            page: Joi.number(),
            limit: Joi.number(),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.number().default(-1),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            name: Joi.string(),
            email: Joi.string(),
            projectName: Joi.string(),
            userId: Joi.string(),
            isActive: Joi.boolean(),
            status: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date()
        }),
    }),


    deleteUser: validator({
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),

    updateUserLead: validator({
        query: Joi.object({
            id: Joi.string()
        }),
        body: Joi.object({
            userLead: Joi.number().allow(""),
        })
    }),

    getUsersExclAdmin: validator({ 
        query: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).optional(),
          }),
    }),
};
