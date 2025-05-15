const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {
  /* Add user conform lead appointment */
  addAppointment: validator({
    body: Joi.object({
      leadId: Joi.string(),
      uid: Joi.string(),
      notes: Joi.string(),
      appointmentDate: Joi.date(),
      appointmentEndTime: Joi.date(),
    }),
  }),

  createLead: validator({
    body: Joi.object({
      name: Joi.string().allow("", null),
      strabe: Joi.string().required(),
      location: Joi.string().required(),
      telephon: Joi.string().allow("", null),
      email: Joi.string().allow("", null),
      firma: Joi.string().required(),
      pLZ: Joi.string().required(),
      userId: Joi.string().allow("", null),
      nachname: Joi.string().allow("", null),
      contractions: Joi.string().allow("", null),
      notizen: Joi.string().optional().allow("", null),
      status: Joi.string().allow("", null),
      benutzername: Joi.string().required(),
      benutzerId: Joi.string(),

    }),
  }),

  /* Get user conform lead appointment */
  getAppointment: validator({
    query: Joi.object({
      leadId: Joi.string(),
    }),
  }),

  getNewLead: validator({
    query: Joi.object({
      page: Joi.number().default(1),
      limit: Joi.number().default(100),
      sortBy: Joi.string().default("createdAt"),
      sortOrder: Joi.string().default("-1"),
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
      endDate: Joi.date(),
    }),
  }),

  /* Update user lead status ( conform / reject ) */
  updateNewLead: validator({
    query: Joi.object({
      id: Joi.string(),
    }),
    body: Joi.object({
      status: Joi.string(),
    }),
  }),

  /* Get user conform lead's */
  getConformLead: validator({
    query: Joi.object({
      page: Joi.number().default(1),
      limit: Joi.number().default(100),
      sortBy: Joi.string(),
      sortOrder: Joi.number(),
      _id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .message("Invalid ID"),
      search: Joi.string().allow("", null),
      leadStatus: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
    }),
  }),

  /* Get single user (id) conform lead's */
  getIdUserConformLead: validator({
    query: Joi.object({
      page: Joi.number().default(1),
      limit: Joi.number().default(30),
      sortBy: Joi.string(),
      sortOrder: Joi.number(),
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .message("Invalid ID"),
      search: Joi.string().allow("", null),
      leadStatus: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      statusType: Joi.string(),
      statusPage: Joi.number(),
      statusLimit: Joi.number().default(30),
    }),
  }),

  /* Get lead status conform and cancel */
  getLeadStatus: validator({
    query: Joi.object({
      page: Joi.number().default(1),
      limit: Joi.number().default(100),
      sortBy: Joi.string().default("createdAt"),
      sortOrder: Joi.string().default("-1"),
      _id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .message("Invalid ID"),
      search: Joi.string(),
      leadStatus: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
    }),
  }),

  /* Get single lead ( vattenfall ) */
  getLead: validator({
    query: Joi.object({
      id: Joi.string(),
    }),
  }),

  getPLZUser: validator({
    query: Joi.object({
      PLZ: Joi.string(),
      page: Joi.number().default(1),
      limit: Joi.number().default(100),
      sortBy: Joi.string().default("createdAt"),
      sortOrder: Joi.string().default("-1"),
    }),
  }),

  /* Update conform lead ( vattenfall ) */
  updateLeadVatten: validator({
    query: Joi.object({
      id: Joi.string(),
    }),
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
      benutzername: Joi.string(),
      benutzerId: Joi.string(),
      comment: Joi.string().allow("", null),
      reason: Joi.string(),
      leadNotes: Joi.string().allow("", null),
      wiedervorlage: Joi.date().when("status", {
        is: Joi.string().valid("offen", "STORNO"),
        then: Joi.optional(),
        otherwise: Joi.optional(),
      }),
      notification: Joi.boolean().default(false),

    }),
  }),

  /* Get postalcode ( pincode ) */
  getPostalcode: validator({
    query: Joi.object({
      // page: Joi.number(),
      // limit: Joi.number(),
      sortBy: Joi.string().default("createdAt"),
      sortOrder: Joi.string().default("-1"),
      _id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .message("Invalid ID"),
      // search: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
    }),
    body: Joi.object({
      id: Joi.array(),
    }),
  }),

  /* Get selected date lead's */
  getSelectDateLead: validator({
    query: Joi.object({
      page: Joi.number().default(1),
      limit: Joi.number().default(100),
      sortBy: Joi.string().default("createdAt"),
      sortOrder: Joi.string().default("-1"),
      _id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .message("Invalid ID"),
      search: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
    }),
  }),

  /* Update user conform lead appointment */
  updateAppointment: validator({
    query: Joi.object({
      id: Joi.string(),
    }),
    body: Joi.object({
      notes: Joi.string(),
      appointmentDate: Joi.date(),
      appointmentEndTime: Joi.date(),
    }),
  }),

  assignLead: validator({
    query: Joi.object({
      id: Joi.string(),
    }),
    body: Joi.object({
      assignUid: Joi.array().items().allow(null, ""),
    }),
  }),

  uniqueFirma: validator({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
    })
  }),

  wiedervorlagedata: validator({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
      wiedervorlage: Joi.date()
        .iso()
        .messages({
          "date.format": "wiedervorlage must be in ISO 8601 format",
        })
        .optional(),
      status: Joi.string().optional(),
      sort: Joi.string()
        .valid("asc", "desc","all", "wiedervorlagedata")
        .default("asc")
        .messages({
          "any.only": "sort must be either 'asc' or 'desc'",
        }),
        search: Joi.string(),
        wsort: Joi.string()
        .valid("asc", "desc")
        .default("asc")
        .messages({
          "any.only": "sort must be either 'asc' or 'desc'",
        }),
        fsort: Joi.string()
        .valid("asc", "desc")
        .default("asc") 
    }),
  }),

  uploadExcelValidator: validator({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
    }),
  }),


};
