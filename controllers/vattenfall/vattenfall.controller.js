const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service");
const ObjectId = require("mongodb").ObjectId;
const {
  USER_TYPE: { ADMIN },
} = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const moment = require("moment");
const { pipeline } = require("nodemailer/lib/xoauth2");
const { uploadExcel } = require("../../service/excel_upload");
const XLSX = require('xlsx');
const cron = require('node-cron');



module.exports = exports = {

  createLead: async (req, res) => {
    try {
      let { user } = req;

      req.body.benutzerId = user._id;
      req.body.assignUid = user._id;
      req.body.isUserCreate = true;

      const create = await DB.VATTENFALL.create(req.body);

      const createAssign = await DB.ASSIGNLEAD.create({
        leadId: create?._id,
        uid: user?._id,
        status: "pending",
      });

      console.log(
        `Lead ${createAssign?.leadId} assigned successfully to user ${user?._id}:`,
        createAssign
      );

      let unreadNewLead = await DB.ASSIGNLEAD.countDocuments({
        leadId: createAssign?.leadId,
        uid: createAssign?.uid,
        status: "pending",
      });
      global?.io
        ?.to(createAssign?.uid.toString())
        .emit("check-new-lead", { unreadNewLead });

      return apiResponse.OK({ res, message: messages.SUCCESS, data: create });
    } catch (error) {
      console.log(error, "------------ carch error ----------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  addAppointment: async (req, res) => {
    try {
      let { leadId, uid, notes, appointmentDate, appointmentEndTime } =
        req.body;

      let date = new Date(appointmentDate);
      let endDate = new Date(appointmentEndTime);

      const findApp = await DB.APPOINTMENT.findOne({
        leadId: leadId,
        uid: uid,
      }).sort({ createdAt: -1 });

      const checkTime = await DB.APPOINTMENT.find({
        uid: uid,
        appointmentDate: { $gte: date },
        appointmentEndTime: { $lte: endDate },
      });
      if (checkTime.length != 0) {
        return apiResponse.BAD_REQUEST({
          res,
          message:
            "You have an appointment across this team, so you cannot take an appointment across this team",
        });
      }

      let isConflict;
      //  findApp.forEach(appointment => {
      // let existingDateTime = new Date(appointment.appointmentDate);
      let existingDateTime = new Date(findApp?.appointmentDate);

      if (date > existingDateTime) {
        let data = {
          leadId: leadId,
          uid: uid,
          notes: notes,
          appointmentDate: date,
          appointmentEndTime: endDate,
        };
        const createAppointment = await DB.APPOINTMENT.create(data);
        return apiResponse.OK({
          res,
          message: messages.SUCCESS,
          data: createAppointment,
        });
      }
      // });

      let data = {
        leadId: leadId,
        uid: uid,
        notes: notes,
        appointmentDate: date,
        appointmentEndTime: endDate,
      };
      const createAppointment = await DB.APPOINTMENT.create(data);

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: createAppointment,
      });
    } catch (error) {
      console.log(error, "------ error ---");
    }
  },

  getAppointment: async (req, res) => {
    try {
      let { user } = req;
      let leadId = req.query.leadId;

      const findAppointment = await DB.APPOINTMENT.find({
        leadId: leadId,
        uid: user?._id,
      });
      if (!findAppointment) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: findAppointment,
      });
    } catch (error) {
      console.log(error, "---------- error -----------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  updateAppointment: async (req, res) => {
    try {
      let { user } = req;
      let id = req.query.id;
      let { notes, appointmentDate, appointmentEndTime } = req.body;
      let date = new Date(appointmentDate);
      let endDate = new Date(appointmentEndTime);

      const findAppointment = await DB.APPOINTMENT.findOne({
        _id: id,
        uid: user._id,
      });
      if (!findAppointment) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      if (appointmentDate) {
        const findApp = await DB.APPOINTMENT.findOne({
          leadId: findAppointment?.leadId,
          uid: user._id,
        }).sort({ createdAt: -1 });

        let isConflict = false;
        let existingDateTime = new Date(findApp.appointmentDate);

        if (date >= existingDateTime) {
          isConflict = true;
        }

        if (isConflict === false) {
          return apiResponse.BAD_REQUEST({
            res,
            message: "Appointment time conflicts with an existing appointment.",
          });
        }

        let data = {
          appointmentDate: date,
          appointmentEndTime: endDate,
        };

        const updateAppointment = await DB.APPOINTMENT.findOneAndUpdate(
          { _id: id },
          data,
          { new: true }
        );
        return apiResponse.OK({
          res,
          message: messages.SUCCESS,
          data: updateAppointment,
        });
      }
      if (notes) {
        let data = {
          notes: notes,
        };

        const updateAppointment = await DB.APPOINTMENT.findOneAndUpdate(
          { _id: id },
          data,
          { new: true }
        );
        return apiResponse.OK({
          res,
          message: messages.SUCCESS,
          data: updateAppointment,
        });
      }
    } catch (error) {
      console.log(error, "--------- catch error ------------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getNewLead: async (req, res) => {
    try {
      let { user } = req;
      let { page, limit } = req.query;

      const findNewLeadCount = await DB.ASSIGNLEAD.find({
        uid: user?._id,
        status: "pending",
      }).populate("leadId");

      const findNewLead = await DB.ASSIGNLEAD.find({
        uid: user?._id,
        status: "pending",
      })
        .populate("leadId")
        .skip((page - 1) * limit)
        .limit(limit);
      // .populate({
      //   path: "leadId",
      //   select: "_id benutzername createdAt status",
      // });
      if (!findNewLead) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: { findNewLead, count: findNewLeadCount.length },
      });
    } catch (error) {
      console.log(error, "----------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  updateNewLead: async (req, res) => {
    try {
      const { user } = req;
      const id = req.query.id;
      const status = req.body.status;

      // Find the lead assigned to the current user
      const findLead = await DB.ASSIGNLEAD.findOne({
        _id: id,
        uid: { $in: user?._id },
      });

      if (!findLead) {
        return apiResponse.NOT_FOUND({ res, message: "Dieser Lead ist Ihnen nicht zugeordnet oder existiert nicht." });
      }

      if (status === "conform") {
        // Atomically check and update the lead status
        const update = await DB.ASSIGNLEAD.findOneAndUpdate(
          {
            _id: findLead?._id,
            uid: { $in: user?._id },
            conform: { $ne: true },
            status: { $ne: "conform" },
          },
          { $set: { conform: true, status: "conform" } },
          { new: true }
        );

        if (!update) {
          return apiResponse.OK({ res, message: "Jemand anderes arbeitet bereits an dieser Spur." });
        }

        // Mark other leads with the same leadId as rejected
        await DB.ASSIGNLEAD.updateMany(
          {
            leadId: findLead?.leadId,
            status: { $ne: "conform" },
            uid: { $ne: user?._id },
          },
          { $set: { status: "reject", reject: true } },
          { new: true }
        );

        // Update the status in the VATTENFALL collection
        await DB.VATTENFALL.findOneAndUpdate(
          { _id: findLead?.leadId },
          { $set: { status: "offen", assignUid: user?._id } },
          { new: true }
        );

        // Notify the user about the new lead count
        const unreadNewLead = await DB.ASSIGNLEAD.countDocuments({
          uid: user?._id,
          status: "pending",
        });

        global?.io
          ?.to(user?._id.toString())
          .emit("check-new-lead", { unreadNewLead });


        return apiResponse.OK({ res, message: "Erfolg" });
      }

    } catch (error) {
      console.error(error, "------- catch error -------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },



  //* Changes new drack and drop functionality
  // getConformLead: async (req, res) => {
  //   try {
  //     let { user } = req;
  //     console.log(">>>>>>>>>>>>>>>>.")
  //     let {
  //       page,
  //       limit,
  //       sortBy,
  //       sortOrder,
  //       search,
  //       leadStatus,
  //       startDate,
  //       endDate,
  //       ...query
  //     } = req.query;

  //     let filterQuery = {};
  //     sortBy = sortBy || "leadId.status";
  //     sortOrder = sortOrder || -1;

  //     // if (search) {
  //     //   filterQuery.$or = [
  //     //     { "leadId.status": { $regex: search, $options: "i" } },
  //     //   ];
  //     // }
  //     if (search) {
  //       filterQuery.$or = [
  //         { "leadId.name": { $regex: search, $options: "i" } },
  //         { "leadId.nachname": { $regex: search, $options: "i" } },
  //         { "leadId.location": { $regex: search, $options: "i" } },
  //         { "leadId.telephon": { $regex: search, $options: "i" } },
  //         { "leadId.email": { $regex: search, $options: "i" } },
  //         { "leadId.strabe": { $regex: search, $options: "i" } },
  //         { "leadId.firma": { $regex: search, $options: "i" } },
  //         { "leadId.pLZ": { $regex: search, $options: "i" } },
  //         { "leadId.leadNotes": { $regex: search, $options: "i" } },

  //       ];
  //     }
  //     if (leadStatus) {
  //       filterQuery["leadId.status"] = leadStatus;
  //     }
  //     filterQuery.uid = user._id;
  //     filterQuery.status = "conform";
  //     filterQuery.conform = true;

  //     Object.assign(query, filterQuery);

  //     let option = [
  //       {
  //         $lookup: {
  //           from: "vattenfall",
  //           localField: "leadId",
  //           foreignField: "_id",
  //           as: "leadId",
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$leadId",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       { $match: query },
  //       // {
  //       //   $match: {
  //       //     $nor: [
  //       //       { "leadId.status": "STORNO" },
  //       //       { "leadId.status": "VERKAUFT" },
  //       //       { "leadId.status": "ABSAGE" },
  //       //     ],
  //       //   },
  //       // },
  //       {
  //         $group: {
  //           _id: "$leadId.status", // Group by 'status' in leadId
  //           count: { $sum: 1 }, // Count the number of documents per status
  //           data: { $push: "$$ROOT" }, // Include the grouped documents in the result
  //         },
  //       },
  //       { $sort: { [sortBy]: sortOrder } },
  //       { $skip: (page - 1) * limit },
  //       { $limit: limit },
  //     ];

  //     let count = [
  //       {
  //         $lookup: {
  //           from: "vattenfall",
  //           localField: "leadId",
  //           foreignField: "_id",
  //           as: "leadId",
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$leadId",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       { $match: query },
  //       // {
  //       //   $match: {
  //       //     $nor: [
  //       //       { "leadId.status": "STORNO" },
  //       //       { "leadId.status": "VERKAUFT" },
  //       //       { "leadId.status": "ABSAGE" },
  //       //     ],
  //       //   },
  //       // },
  //       {
  //         $group: {
  //           _id: "$leadId.status", // Group by 'status' in leadId
  //           count: { $sum: 1 }, // Count the number of documents per status
  //           data: { $push: "$$ROOT" }, // Include the grouped documents in the result
  //         },
  //       },
  //       { $sort: { [sortBy]: sortOrder } },
  //     ];

  //     const findConform = await DB.ASSIGNLEAD.aggregate(option);
  //     console.log(findConform[0], "--------- findConform --------");
  //     const findConformLength = await DB.ASSIGNLEAD.aggregate(count);
  //     if (!findConform) {
  //       return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
  //     }

  //     const ERSTTERMIN = [];

  //     // Iterate over each entry in `findConform`
  //     findConform.map((group) => {
  //       // Check if the status ID contains "ERSTTERMIN"
  //       if (group._id && group._id.includes("ERSTTERMIN")) {
  //         // Add each entry in the group's data array to the ERSTTERMIN array in result
  //         group.data.forEach((entry) => {
  //           ERSTTERMIN.push(entry);
  //         });
  //       }
  //       return group;
  //     });
  //     const DATAAA = findConform.filter((item) => {
  //       console.log('item', item)
  //       return item._id != null && !item._id.includes("ERSTTERMIN");
  //     });
  //     console.log('findConform', findConform)
  //     // console.log('DATAAA', DATAAA)
  //     DATAAA.push({
  //       _id: "ERSTTERMIN",
  //       count: ERSTTERMIN.length,
  //       data: ERSTTERMIN,
  //     });
  //     // console.log(DATAAA, "--------- DATAAA --------");
  //     console.log(findConformLength.length, "-------- findConformLength.length ----------")
  //     return apiResponse.OK({
  //       res,
  //       message: messages.SUCCESS,
  //       data: { findConform: DATAAA, count: findConformLength.length },
  //     });
  //   } catch (error) {
  //     console.log(error, "--------- catch error --------");
  //     return apiResponse.CATCH_ERROR({
  //       res,
  //       message: messages.INTERNAL_SERVER_ERROR,
  //     });
  //   }
  // },

  getConformLead: async (req, res) => {
    try {
      let { user } = req;
      let {
        page = 1,
        limit = 10,
        sortBy,
        sortOrder,
        search,
        leadStatus,
        startDate,
        endDate,
        statusType,
        statusPage = 1,
        statusLimit = 10,
        ...query
      } = req.query;

      let filterQuery = {};
      sortBy = sortBy || "leadId.status";
      sortOrder = sortOrder || -1;

      if (search) {
        filterQuery.$or = [
          { "leadId.name": { $regex: search, $options: "i" } },
          { "leadId.nachname": { $regex: search, $options: "i" } },
          { "leadId.location": { $regex: search, $options: "i" } },
          { "leadId.telephon": { $regex: search, $options: "i" } },
          { "leadId.email": { $regex: search, $options: "i" } },
          { "leadId.strabe": { $regex: search, $options: "i" } },
          { "leadId.firma": { $regex: search, $options: "i" } },
          { "leadId.pLZ": { $regex: search, $options: "i" } },
          { "leadId.leadNotes": { $regex: search, $options: "i" } },
        ];
      }

      if (leadStatus) {
        filterQuery["leadId.status"] = leadStatus;
      }

      filterQuery.uid = user._id;
      filterQuery.status = "conform";
      filterQuery.conform = true;

      Object.assign(query, filterQuery);

      const aggregationPipeline = [
        {
          $lookup: {
            from: "vattenfall",
            localField: "leadId",
            foreignField: "_id",
            as: "leadId",
          },
        },
        {
          $unwind: {
            path: "$leadId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            wiedervorlage: {
              $ifNull: ["$leadId.wiedervorlage", null],
            },
          },
        },
        { $match: query },
        {
          $group: {
            _id: "$leadId.status",
            count: { $sum: 1 },
            data: { $push: "$$ROOT" },
          },
        },
        { $sort: { [sortBy]: sortOrder } },
      ];

      const findConformRaw = await DB.ASSIGNLEAD.aggregate(aggregationPipeline);

      console.log(findConformRaw, "findConformRawfindConformRaw")
      if (!findConformRaw) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      const ERSTTERMIN = [];
      const filteredGroups = [];

      findConformRaw.forEach((group) => {
        if (group._id && group._id.includes("ERSTTERMIN")) {
          ERSTTERMIN.push(...group.data);
          return;
        }

        let paginatedData = group.data;

        // Apply pagination for the requested group
        if (statusType && group._id === statusType) {
          paginatedData = group.data.slice((statusPage - 1) * statusLimit, statusPage * statusLimit);
        }
        // Or default pagination for all groups
        else if (!statusType) {
          paginatedData = group.data.slice((page - 1) * limit, page * limit);
        }

        filteredGroups.push({
          _id: group._id,
          count: group.count,
          data: paginatedData,
        });
      });

      // Append ERSTTERMIN group
      filteredGroups.push({
        _id: "ERSTTERMIN",
        count: ERSTTERMIN.length,
        data: ERSTTERMIN,
      });

      const findConformLength = findConformRaw.length;

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: { findConform: filteredGroups, count: findConformLength },
      });
    } catch (error) {
      console.log(error, "--------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },



  getIdUserConformLead: async (req, res) => {
    try {
      let {
        page = 1,
        limit = 10,
        sortBy = "leadId.status",
        sortOrder = -1,
        search,
        leadStatus,
        startDate,
        endDate,
        id,
        statusType,
        statusPage = 1,
        statusLimit = 30,
        ...query
      } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);
      statusPage = parseInt(statusPage);
      statusLimit = parseInt(statusLimit);

      let filterQuery = {
        status: "conform",
        conform: true,
      };

      if (id) {
        try {
          filterQuery.uid = new ObjectId(id);
        } catch (err) {
          return apiResponse.BAD_REQUEST({
            res,
            message: "Invalid ID format",
          });
        }
      }

      if (search) {
        filterQuery.$or = [
          { "leadId.name": { $regex: search, $options: "i" } },
          { "leadId.nachname": { $regex: search, $options: "i" } },
        ];
      }

      if (leadStatus) {
        filterQuery["leadId.status"] = leadStatus;
      }

      Object.assign(query, filterQuery);

      const pipeline = [
        {
          $lookup: {
            from: "vattenfall",
            localField: "leadId",
            foreignField: "_id",
            as: "leadId",
          },
        },
        { $unwind: "$leadId" },
        {
          $addFields: {
            wiedervorlage: {
              $ifNull: ["$leadId.wiedervorlage", null],
            },
          },
        },
        { $match: query },
        {
          $group: {
            _id: "$leadId.status",
            count: { $sum: 1 },
            data: { $push: "$$ROOT" },
          },
        },
        { $sort: { [sortBy]: sortOrder } },
      ];

      const groupedResults = await DB.ASSIGNLEAD.aggregate(pipeline);

      const TERMINIERT = [];
      const findConform = [];

      groupedResults.forEach(group => {
        if (!group._id) return;

        if (group._id.includes("TERMINIERT")) {
          TERMINIERT.push(...group.data);
          return;
        }

        const start = (statusType ? statusPage : page) - 1;
        const end = (statusType ? statusLimit : limit);

        // If statusType is set, only paginate that specific group
        if (statusType && group._id === statusType) {
          findConform.push({
            _id: group._id,
            count: group.count,
            data: group.data.slice(start * end, start * end + end),
          });
        }

        // If no statusType, paginate all groups individually
        if (!statusType) {
          findConform.push({
            _id: group._id,
            count: group.count,
            data: group.data.slice((page - 1) * limit, (page - 1) * limit + limit),
          });
        }

        // If statusType is provided but doesn't match this group, skip pagination
        if (statusType && group._id !== statusType) {
          findConform.push({
            _id: group._id,
            count: group.count,
            data: group.data,
          });
        }
      });

      if (TERMINIERT.length) {
        if (!statusType || statusType === "TERMINIERT") {
          const startIndex = (statusType ? statusPage : page) - 1;
          const countPerPage = statusType ? statusLimit : limit;
          findConform.push({
            _id: "TERMINIERT",
            count: TERMINIERT.length,
            data: TERMINIERT.slice(startIndex * countPerPage, startIndex * countPerPage + countPerPage),
          });
        } else {
          findConform.push({
            _id: "TERMINIERT",
            count: TERMINIERT.length,
            data: TERMINIERT,
          });
        }
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: {
          findConform,
          count: groupedResults.length,
        },
      });
    } catch (error) {
      console.log(error, "--------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  getLeadStatus: async (req, res) => {
    try {
      let { user } = req;
      let {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        leadStatus,
        startDate,
        endDate,
        ...query
      } = req.query;

      let filterQuery = {};

      filterQuery["leadId.status"] = { $in: ["VERKAUFT", "STORNO", "ABSAGE", "GEWONNEN", 'E-MAIL VERSENDET'] };
      filterQuery.uid = user._id;
      filterQuery.status = "conform";
      filterQuery.conform = true;

      Object.assign(query, filterQuery);

      let option = [
        {
          $lookup: {
            from: "vattenfall",
            localField: "leadId",
            foreignField: "_id",
            as: "leadId",
          },
        },
        {
          $unwind: {
            path: "$leadId",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: query },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      const findConform = await DB.ASSIGNLEAD.aggregate(option);
      if (!findConform) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: { findConform, count: findConform.length },
      });
    } catch (error) {
      console.log(error, "--------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getLead: async (req, res) => {
    try {
      let id = req.query.id;

      const getLead = await DB.VATTENFALL.findOne({ _id: id });

      if (!getLead) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      return apiResponse.OK({ res, message: messages.SUCCESS, data: getLead });
    } catch (error) {
      console.log(error, "----------- error ---------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  updateLeadVatten: async (req, res) => {
    try {
      let { id } = req.query;

      // Check if the lead exists
      const findLead = await DB.VATTENFALL.findOne({ _id: id });
      if (!findLead) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      // Extract and validate `wiedervorlage` from the request body
      let { wiedervorlage, notification } = req.body;

      if (wiedervorlage) {

        // // Validate the format of wiedervorlage (DD.MM.YYYY hh:mm)
        // if (!/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(wiedervorlage)) {
        //   return apiResponse.BAD_REQUEST({
        //     res,
        //     message: "Invalid wiedervorlage format. Expected DD.MM.YYYY hh:mm",
        //   });
        // }

        // Convert `wiedervorlage` to ISO format for storage
        const parsedDate = moment(wiedervorlage, "DD.MM.YYYY HH:mm");
        if (!parsedDate.isValid()) {
          return apiResponse.BAD_REQUEST({
            res,
            message: "Invalid wiedervorlage date or time.",
          });
        }

        // Save the ISO format for further processing and database storage
        req.body.wiedervorlage = parsedDate.toISOString();
      }

      // Remove undefined or null fields from req.body
      const updateData = {};
      for (const key in req.body) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          updateData[key] = req.body[key];
        }
      }

      console.log(updateData, "---------- sanitized updateData ---------");

      // Update the lead
      const updatedLead = await DB.VATTENFALL.findOneAndUpdate(
        { _id: findLead._id },
        updateData,
        { new: true }
      );

      // Schedule notification if enabled and `wiedervorlage` is set
      if (notification && updatedLead.wiedervorlage) {
        const notificationTime = new Date(updatedLead.wiedervorlage).getTime() - 15 * 60 * 1000;

        if (notificationTime > Date.now()) {
          const notificationDate = new Date(notificationTime);

          // We don't schedule individual jobs now, as this is handled by a global cron job
          console.log(`Notification for lead ${updatedLead._id} is set to ${notificationDate}`);
        } else {
          console.log(`Notification time for lead ${updatedLead._id} is in the past. Skipping.`);
        }
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: updatedLead,
      });
    } catch (error) {
      console.log(error, "---------- catch error ---------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  getPostalcode: async (req, res) => {
    try {

      const findPostalcode = await DB.POSTALCODE.find();
      if (findPostalcode.length === 0) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: findPostalcode,
      });
    } catch (error) {
      console.log(error, "---------- catch error ---------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getSelectDateLead: async (req, res) => {
    try {
      let {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        startDate,
        endDate,
        ...query
      } = req.query;
      let { user } = req;

      let filterQuery = {};
      if (startDate && endDate) {
        const endDateObject = new Date(endDate);
        endDateObject.setDate(endDateObject.getDate() + 1);

        filterQuery.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDateObject),
        };
      }
      filterQuery.uid = user._id;
      Object.assign(query, filterQuery);

      const data = await DB.APPOINTMENT.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .populate("leadId")
        .lean();

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: { data, count: data.length },
      });
    } catch (error) {
      console.log(error, "--------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getPLZUser: async (req, res) => {
    try {

      //* Without user lead status limit
      let PLZ = req.query.PLZ;
      const findUsers = await DB.USER.aggregate([
        {
          $lookup: {
            from: "postalCode",
            localField: "PLZ",
            foreignField: "_id",
            pipeline: [
              {
                $match: { PLZ: PLZ },
              },
            ],
            as: "PLZ",
          },
        },
        {
          $match: { PLZ: { $ne: [] } },
        },
        {
          $sort: { createdAt: 1 },
        },
      ]);
      if (!findUsers) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }
      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: findUsers,
      });
    } catch (error) {
      console.log(error, "-------- catch error --------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  assignLead: async (req, res) => {
    try {
      let id = req.query.id.split(","); // Array of lead IDs
      let assignUid = req.body.assignUid; // Array of user IDs to assign

      // Find all leads by IDs
      const findLeads = await DB.VATTENFALL.find({ _id: { $in: id } });

      if (!findLeads.length) {
        return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
      }

      let updateLead = [];

      // If assignUid is empty, remove all assignments
      if (Array.isArray(assignUid) && assignUid.length === 0) {
        await DB.ASSIGNLEAD.deleteMany({ leadId: { $in: id } });
        await DB.VATTENFALL.updateMany(
          { _id: { $in: id } },
          { $set: { assignUid: [], status: null } }
        );

        console.log(`All assignments removed for leads: ${id.join(", ")}`);
        return apiResponse.OK({
          res,
          message: "All assignments removed successfully.",
          data: [],
        });
      }

      if (assignUid && Array.isArray(assignUid)) {
        await Promise.all(findLeads.map(async (lead) => {
          // Get all current assignments for this lead
          const existingAssignments = await DB.ASSIGNLEAD.find({ leadId: lead._id });

          const acceptedUser = new Set(existingAssignments.map(a => a.uid));

          // Check if a user has already accepted the lead
          // const acceptedUser = existingAssignments.find(a => a.status === "offen");

          if (acceptedUser) {
            // If admin is reassigning, remove the current user
            if (!assignUid.includes(acceptedUser.uid)) {
              await DB.ASSIGNLEAD.deleteOne({ _id: acceptedUser._id });

              console.log(`Lead ${lead._id} removed from accepted user ${acceptedUser.uid}`);
            } else {
              console.log(`Lead ${lead._id} is already accepted by user ${acceptedUser.uid}. Skipping assignment.`);
              return;
            }
          }

          // Assign lead to new users
          const newAssignments = assignUid.filter(uid => !existingAssignments.some(a => a.uid === uid));

          if (newAssignments.length > 0) {
            await Promise.all(newAssignments.map(async (user) => {
              await DB.ASSIGNLEAD.create({
                leadId: lead._id,
                uid: user,
                status: "pending",
              });

              console.log(`Lead ${lead._id} assigned to user ${user}`);

              // Notify user about new lead
              global?.io?.to(user).emit("check-new-lead", { unreadNewLead: 1 });
            }));

            // Update lead assignment
            const updatedLead = await DB.VATTENFALL.findOneAndUpdate(
              { _id: lead._id },
              { $set: { assignUid: newAssignments, status: null } },
              { new: true }
            );

            updateLead.push(updatedLead);
          }
        }));
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: updateLead,
      });

    } catch (error) {
      console.log(error, "----------- catch error -----------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },
  uniqueFirma: async (req, res) => {
    try {
      // Aggregate query to get all unique 'firma' names
      const uniqueFirma = await DB.VATTENFALL.aggregate([
        {
          $group: {
            _id: "$firma", // Group by 'firma' to get unique values
          },
        },
        {
          $project: {
            _id: 0,        // Exclude the '_id' field
            firma: "$_id", // Rename '_id' to 'firma'
          },
        },
        {
          $sort: { firma: 1 }, // Optional: Sort the 'firma' names alphabetically
        },
      ]);

      // Return response with all unique 'firma' names
      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: uniqueFirma,
      });

    } catch (error) {
      console.error(error, "----------- catch error -----------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  wiedervorlagedata: async (req, res) => {
    try {

      const { wiedervorlage, status, sort, wsort, fsort, page = 1, limit = 10, search } = req.query;

      const userId = req.user._id;

      // Step 1: Get all assignlead entries for this user
      const assignedLeads = await DB.ASSIGNLEAD.find({ uid: userId }).select("leadId");

      // Extract lead IDs
      const leadIds = assignedLeads.map(item => item.leadId);

      if (!leadIds.length) {
        return apiResponse.OK({
          res,
          message: "No leads assigned to this user.",
          data: {
            leads: [],
            pagination: {
              totalItems: 0,
              currentPage: parseInt(page),
              totalPages: 0,
            },
          },
        });
      }

      // Step 2: Build query for VATTENFALL
      const query = { _id: { $in: leadIds } };
      query.status = { $nin: ["offen", "STORNO"] };

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { firma: { $regex: searchRegex } },
          { strabe: { $regex: searchRegex } },
          { telephon: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { notizen: { $regex: searchRegex } },
          { leadNotes: { $regex: searchRegex } },
          { nachname: { $regex: searchRegex } },
          { reason: { $regex: searchRegex } }
        ];
      }

      if (wiedervorlage) {
        const startOfDay = new Date(new Date(wiedervorlage).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(wiedervorlage).setHours(23, 59, 59, 999));
        query.wiedervorlage = { $gte: startOfDay, $lte: endOfDay };
      }

      if (status) {
        const statusArray = status.split(',');
        query.status = { $in: statusArray };
      }

      // New logic for `sort`
      if (sort === "wiedervorlagedata") {
        query.wiedervorlage = { $exists: true };
      }

      // Initialize dynamic sort object
      const sortOptions = {};

      // Handle wiedervorlage sort
      if (wsort) {
        sortOptions.wiedervorlage = wsort === 'desc' ? -1 : 1;
      }

      // Handle firma sort
      if (fsort) {
        sortOptions.firma = fsort === 'desc' ? -1 : 1;
      }

      // Fallback to previous logic if no wsort/fsort and `sort` is set
      if (Object.keys(sortOptions).length === 0) {
        sortOptions.wiedervorlage = sort === 'desc' ? -1 : 1;
      }

      // Step 3: Get filtered and paginated leads from VATTENFALL
      console.log('sortOptions', sortOptions)

      const leads = await DB.VATTENFALL.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalItems = await DB.VATTENFALL.countDocuments(query);

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: {
          leads,
          pagination: {
            totalItems,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / parseInt(limit)),
          },
        }
      });

    } catch (error) {
      console.error("Error:", error);
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },


  uploadExcel: async (req, res) => {
    try {

      console.log("Request file:", req.file);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const validMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Please upload an Excel file" });
      }
      // Read the uploaded Excel file
      const workbook = XLSX.readFile(req.file.path);

      // Parse the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Extract headers from the sheet
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
      //console.log('headers', headers)

      // Define allowed headers
      const allowedHeaders = [
        "name",
        "strabe",
        "ort",
        "telephon",
        "email",
        "pLZ",
        "nachname",
        "firma",
        "status",
        "benutzername",
        "leadNotes",

        // "Name",
        // "Phone",
        // "Address",
        // "Zip",


      ];

      // Validate headers
      const hasOnlyAllowedHeaders = headers.every((header) =>
        allowedHeaders.includes(header)
      );

      if (!hasOnlyAllowedHeaders) {
        // Clean up the uploaded file
        const fs = require("fs");
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });

        return res.status(400).json({
          error: `Invalid file headers. Only these headers are allowed: ${allowedHeaders.join(", ")}`,
        });
      }



      // Convert the sheet to JSON
      const data = XLSX.utils.sheet_to_json(sheet);

      // // Validate and transform data (optional, depends on your requirements)
      // const formattedData = data.map((row) => ({
      //   name: row.name,
      //   strabe: row.strabe,
      //   location: row.ort,
      //   telephon: row.telephon,
      //   email: row.email,
      //   pLZ: row.pLZ,
      //   nachname: row.nachname,
      //   // contractions: row.contractions,
      //   // notizen: row.notizen,
      //   firma: row.firma,
      //   status: row.status || null,
      //   benutzername: row.benutzername,
      //   // comment: row.comment,
      //   // reason: row.reason,
      //   leadNotes: row.leadNotes || null,
      // }));


      // .filter((value, index, self) =>
      //     index === self.findIndex((t) => (
      //       t.Address === value.Address
      //     ))
      //   )

      const formattedData = data.map((row) => {
        const result = {};

        // Only add fields to the result if they exist (i.e., if they have data)
        if (row.name) result.name = row.name;
        // if (row.strabe) result.strabe = row.strabe;
        if (row.ort) result.location = row.ort;
        if (row.telephon) result.telephon = row.telephon;
        if (row.email) result.email = row.email;
        if (row.pLZ) result.pLZ = row.pLZ;
        if (row.nachname) result.nachname = row.nachname;
        if (row.firma) result.firma = row.firma;
        if (row.status) result.status = row.status;
        if (row.benutzername) result.benutzername = row.benutzername;
        if (row.leadNotes) result.leadNotes = row.leadNotes;

        // if (row.Name) result.firma = row.Name;
        // if (row.Phone) result.telephon = row.Phone;

        //  if(row.strabe) {
        //   let formatAddress = row.strabe.split(',');
        //   formatAddress.shift();
        //   result.strabe = formatAddress.join();
        // };

        if (row.strabe) {
          let formatAddress = row.strabe.split(",");
          result.strabe = formatAddress.pop().trim(); // Get only the last part
        }

        // if(row.Zip) result.pLZ = row.Zip;

        return result;
      }).filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.strabe === value.strabe) // Remove duplicates based on `strabe`
      );

      // 
      // Validate formattedData before saving
      // if (!formattedData.every((row) => row.name && row.email)) {
      //   return res.status(400).json({ error: "Invalid data in Excel file" });
      // }

      // Insert data into MongoDB
      const savedData = await DB.VATTENFALL.insertMany(formattedData);

      // Clean up the uploaded file
      const fs = require("fs");
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });

      res.status(200).json({
        message: "Excel data uploaded successfully",
        savedRecords: savedData.length,
      });
    } catch (error) {
      console.error("Error uploading Excel:", error);
      res.status(500).json({ error: "Failed to process the Excel file" });
    }
  },






};



// Schedule a single cron job to run every minute
cron.schedule('* * * * *', async () => {
  try {
    const currentTime = new Date();


    currentTime.setSeconds(0);
    currentTime.setMilliseconds(0);

    // console.log('dateObj', currentTime);

    // console.log('new Date(currentTime.getTime() + 15 * 60 * 1000),', new Date(currentTime.getTime() + 1 * 60 * 1000),)
    // Find all leads whose `wiedervorlage` is within the next 15 minutes
    const leadsToNotify = await DB.VATTENFALL.find({
      wiedervorlage: new Date(currentTime.getTime() + 15 * 60 * 1000), // within next 15 minutes
      notification: true
    });


    // Loop through each lead and send a notification
    leadsToNotify.map(async (lead) => {
      // console.log('lead', lead)

      let data = {
        title: "Follow-up",
        description: "Lead Follow-up",
        receiver: [lead.benutzerId],
        leadId: lead._id,
      };
      const create = await DB.NOTIFICATION.create(data);
      let unreadNotification = await DB.NOTIFICATION.countDocuments({
        receiver: { $in: lead.benutzerId },
        view: { $ne: lead.benutzerId },
      });
      global?.io
        ?.to(lead.benutzerId.toString())
        .emit("check-notification", { unreadNotification });


      console.log(`Notification sent for lead ${lead.benutzerId}: Reminder to follow up.`);
    });
  } catch (err) {
    console.error("Error while processing notifications:", err);
  }
})