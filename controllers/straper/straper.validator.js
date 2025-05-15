const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    addStraper: validator({
        body: Joi.object({
            name: Joi.string(),
            strabe: Joi.string(),
            location: Joi.string(),
            telephon: Joi.string(),
            email: Joi.string(),
            power_consumption: Joi.string(),
            photo: Joi.string(),
            nr: Joi.string(),
            rooftype: Joi.string(),
            unterschrift: Joi.string(),
            pLZ: Joi.string(),
            benutzername: Joi.string(),
            benutzerId: Joi.string(),
            userId: Joi.string(),
            uniqueTrackingId: Joi.string(),
            nachname: Joi.string(),
            passwort: Joi.string(),
            satteldach: Joi.string(),
            schornstein: Joi.array().items(Joi.string()),
            aktuellkeineAuto: Joi.string(),
            contractions: Joi.string(),
            housetype: Joi.string(),
            roofFelt: Joi.string(),
            notizen: Joi.string().optional(),
            projectName: Joi.string(),
            patners: Joi.array().items(),
            wf_leadid: Joi.number().allow("", null),
            status: Joi.string().allow("", null)
        }),
    }),

    vattenfall: validator({
        body: Joi.object({
            name: Joi.string(),
            strabe: Joi.string(),
            location: Joi.string(),
            telephon: Joi.string(),
            email: Joi.string(),
            firma: Joi.string(),
            pLZ: Joi.string(),
            userId: Joi.string(),
            nachname: Joi.string(),
            contractions: Joi.string(),
            notizen: Joi.string().optional(),
            status: Joi.string().allow("", null),
            assignUid: Joi.array().items(),
            benutzerId: Joi.string(),
            benutzername: Joi.string(),
            comment: Joi.string(),
            
            // power_consumption: Joi.string(),
            // photo: Joi.string(),
            // nr: Joi.string(),
            // rooftype: Joi.string(),
            // unterschrift: Joi.string(),
            // uniqueTrackingId: Joi.string(),
            // passwort: Joi.string(),
            // satteldach: Joi.string(),
            // schornstein: Joi.array().items(Joi.string()),
            // aktuellkeineAuto: Joi.string(),
            // housetype: Joi.string(),
            // roofFelt: Joi.string(),
            // projectName: Joi.string(),
            // patners: Joi.array().items(),
            // dachneigung: Joi.string(),
            // // wf_leadid: Joi.number().allow("", null),
            // accessibility: Joi.string(),
            // funnel_type: Joi.string(),
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
            projectName: Joi.string(),
            userName: Joi.string(),
            userId: Joi.array(),
            email: Joi.string(),
            name: Joi.string(),
            status: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date()
        }),
    }),

    getVattenfall: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.number().default(-1),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            projectName: Joi.string(),
            userName: Joi.string(),
            userId: Joi.array(),
            isAssign: Joi.boolean(),
            email: Joi.string(),
            name: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date(),
            sortFirma: Joi.string().valid('asc', 'desc').optional(),
            sortStrabe: Joi.string().valid('asc', 'desc').optional(),
            sortPLZ: Joi.string().valid('asc', 'desc').optional(),
            pLZSearch: Joi.string(),
            addSearch: Joi.string()
          
            // funnel_type: Joi.string(),
        }),
        body: Joi.object({
            firma: Joi.alternatives().try(
                Joi.string(),               // For a single firma (if only one is selected)
                Joi.array().items(Joi.string())  // For multiple firmas
              ).optional().allow("", null),

            })
    }),

    getTeamReport: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            status: Joi.string(),
            userName: Joi.string(),
            userId: Joi.string(),
            email: Joi.string(),
            name: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date()
        })
    }),

    getTeamVattenReport: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            search: Joi.string(),
            // status: Joi.string(),
            userName: Joi.string(),
            userId: Joi.string(),
            email: Joi.string(),
            name: Joi.string(),
            startDate: Joi.date(),
            endDate: Joi.date()
        })
    }),

    getStraperStatus: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string(),
                // .pattern(/^[0-9a-fA-F]{24}$/),
                // .message("Invalid ID"),
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

    getStrVattUserStatus: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            _id: Joi.string(),
                // .pattern(/^[0-9a-fA-F]{24}$/),
                // .message("Invalid ID"),
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

    getStraReport: validator({
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

    getStraVattUserReport: validator({
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

    getUserStatusCount: validator({
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

    getAllUserPatners: validator({
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

    getUsersStrRepo: validator({
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

    getStraReportById: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            id: Joi.string()
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

    getStraperRepoMonth: validator({
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

    getStrRepoVattUserMonth: validator({
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

    getStrapRepoMonById: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            id: Joi.string()
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

    deleteStraper: validator({
        query: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        })
    }),

    // deleteVattenfall: validator({
    //     query: Joi.object({
    //         id: Joi.string()
    //             .pattern(/^[0-9a-fA-F]{24}$/)
    //             .message("Invalid ID"),
    //     })
    // }),

    deleteVattenfall: validator({
        query: Joi.object({
            id: Joi.alternatives().try(
                Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message("Invalid ID"),
                Joi.array().items(
                    Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message("Invalid ID in array")
                )
            ).required()
        })
    }),
    

    updateStraper: validator({
        body: Joi.object({
            straper: Joi.array(),
        }),
    }),

    statusupdate: validator({
        query: Joi.object({
            param1: Joi.number(),
            param2: Joi.string(),
            param3: Joi.string().allow("", null)
        }),
    }),

    updateStraperStatus: validator({
        query: Joi.object({
            id: Joi.string()
        }),
        body: Joi.object({
            wf_leadid: Joi.number(),
            status: Joi.string()
        })
    })

};
