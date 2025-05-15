const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;
const mongoose = require("mongoose");


module.exports = exports = {


    addStraper: async (req, res) => {
        let { user } = req;
        let data = req.file

        // const newsLater = await DB.STAPER.findOne({ email: req.body.email })
        // if (newsLater) {
        //     return apiResponse.DUPLICATE_VALUE({
        //         res,
        //         message: messages.DUPLICATE_KEY
        //     })
        // }
        req.body.photo = data.location

        const create = await DB.STAPER.create(req.body)
        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: create
        })
    },


    vattenfall: async (req, res) => {
        try {
            let { user } = req;

            const newsLater = await DB.STAPER.findOne({ email: req.body.email });
            if (newsLater) {
                return apiResponse.DUPLICATE_VALUE({
                    res,
                    message: messages.DUPLICATE_KEY
                });
            }

            console.log(req.body, "------------ req.body ------------");

            const create = await DB.VATTENFALL.create(req.body);

            if (create) {
                for (const userToAssign of create.assignUid) {
                    const existingAssignment = await DB.ASSIGNLEAD.findOne({
                        leadId: create?._id,
                        uid: userToAssign?._id,
                        status: "pending"
                    });

                    let currentDate = new Date();
                    let futureDate = new Date(currentDate);
                    futureDate.setDate(currentDate.getDate() + 7);

                    const findLeadCount = await DB.APPOINTMENT.countDocuments({ uid: userToAssign?._id, appointmentDate: { $lte: futureDate } });

                    if (!existingAssignment && findLeadCount < 15) {
                        await DB.ASSIGNLEAD.findOneAndUpdate(
                            { _id: userToAssign?._id, status: "pending" },
                            { status: "reject", reject: true },
                            { new: true }
                        );

                        const createAssign = await DB.ASSIGNLEAD.create({
                            leadId: create?._id,
                            uid: userToAssign?._id,
                            status: "pending"
                        });

                        await DB.VATTENFALL.findOneAndUpdate({ _id: create?._id }, { $set: { assignUid: userToAssign?._id } }, { new: true });

                        console.log(
                            `Lead ${createAssign?.leadId} assigned successfully to user ${userToAssign?._id}:`,
                            createAssign
                        );

                        let unreadNewLead = await DB.ASSIGNLEAD.countDocuments({
                            leadId: createAssign?.leadId,
                            uid: createAssign?.uid,
                            status: "pending"
                        });
                        global?.io?.to(createAssign?.uid.toString()).emit("check-new-lead", { unreadNewLead });

                        return apiResponse.OK({ res, message: "Lead reassigned successfully" });
                    }
                }
            } else {
                await EMAIL.leadEmail({
                    name: create?.name,
                    subject: "Not assign lead",
                    location: create?.location,
                    postalcode: create?.pLZ,
                    benutzername: create?.benutzername,
                    userId: create?.userId
                });
                console.log("No users available to assign leads.");
            }

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: create
            });
        } catch (error) {
            console.log(error, "------------ error ------------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getStraper: async (req, res) => {
        let { page, limit, sortBy, sortOrder, search, projectName, userName, userId, startDate, endDate, status, ...query } = req.query;
        let filterQuery = {};

        if (search) {
            filterQuery.$or = [{ email: { $regex: search, $options: "i" } }, { name: { $regex: search, $options: "i" } }, { pLZ: { $regex: search, $options: "i" } }];
        }
        if (projectName) {
            // function escapeRegex(string) {
            //     let cleanedProjectName = string.replace(/\(.*?\)/g, '');
            //     return cleanedProjectName.replace(/[^\w\s]/gi, '').trim();
            // }

            filterQuery.projectName = projectName;
        }
        if (status) {
            filterQuery.status = status
            if (filterQuery.status == 'null') {
                filterQuery.status = null
            }
        }

        if (userName) {
            filterQuery.benutzername = { $regex: userName, $options: "i" };
        }
        if (userId) {
            filterQuery.userId = { $in: userId }
        }
        if (startDate && endDate) {
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            filterQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDateObject) };
        }
        Object.assign(query, filterQuery);

        const data = await DB.STAPER
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate("patners", "name")
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.STAPER.countDocuments(query), data } });
    },


    //     getVattenfall: async (req, res) => {
    //         let {
    //             page = 1,
    //             limit = 10,
    //             sortBy = "createdAt",
    //             sortOrder = -1,
    //             sortFirma,  // Retrieve sortFirma from query
    //             search,
    //             projectName,
    //             userName,
    //             userId,
    //             isAssign,
    //             email,
    //             name,
    //             startDate,
    //             endDate,
    //             ...query
    //         } = req.query;

    //         let { firma } = req.body;

    //         let filterQuery = {};

    //         console.log("Constructed filterQuery:", JSON.stringify(filterQuery, null, 2));


    //         // Text search filters
    //         if (search) {
    //             filterQuery.$or = [
    //                 { email: { $regex: search, $options: "i" } },
    //                 { name: { $regex: search, $options: "i" } },
    //                 { pLZ: { $regex: search, $options: "i" } },
    //                 { "assignUid.name": { $regex: search, $options: "i" } }
    //             ];
    //         }

    //         // Additional filters
    //         if (projectName) {
    //             filterQuery.projectName = projectName;
    //         }

    //         if (userName) {
    //             filterQuery.benutzername = { $regex: userName, $options: "i" };
    //         }

    //         if (userId) {
    //             filterQuery.userId = { $in: Array.isArray(userId) ? userId : [userId] };
    //         }

    //         // if (isAssign === "false") {
    //         //     filterQuery.$or = [
    //         //         { assignUid: { $eq: [] } },
    //         //         { assignUid: { $exists: false } }
    //         //     ];
    //         // }

    //         // if (isAssign === "true") {
    //         //     filterQuery.assignUid = { $exists: true, $ne: [] };
    //         // }

    //         if (isAssign) {
    //             if (isAssign === "false") {
    //                 filterQuery.$or = [
    //                     { assignUid: { $eq: [] } },
    //                     { assignUid: { $exists: false } }
    //                 ];
    //             } else if (isAssign === "true") {
    //                 filterQuery.assignUid = { $exists: true, $ne: [] };
    //             }
    //         }

    //     //     if (startDate && endDate) {
    //     //         const endDateObject = new Date(endDate);
    //     //         endDateObject.setDate(endDateObject.getDate() + 1);

    //     //         filterQuery.createdAt = {
    //     //             $gte: new Date(startDate),
    //     //             $lte: endDateObject
    //     //         };
    //     //     }

    //     //     if (firma) {
    //     //         firma = firma.split(',');
    //     //         filterQuery.firma = { $in: firma.map(name => new RegExp(`^${name}$`, "i")) };
    //     //     }

    //     //     Object.assign(query, filterQuery);

    //     //     console.log("query", query);
    //     //     console.log("filterQuery", filterQuery);
    //     //     try {
    //     //         // Build the $sort object dynamically based on the sort parameters
    //     //         let sortCriteria = {};
    //     //         if (sortFirma) {
    //     //             sortCriteria.firma = sortFirma.toLowerCase() === 'asc' ? 1 : -1;
    //     //         } else {
    //     //             sortCriteria[sortBy] = sortOrder;
    //     //         }

    //     //         const data = await DB.VATTENFALL.aggregate([
    //     //             {
    //     //                 $lookup: {
    //     //                     from: "user",
    //     //                     localField: "patners",
    //     //                     foreignField: "_id",
    //     //                     pipeline: [{ $project: { name: 1 } }],
    //     //                     as: "patners"
    //     //                 }
    //     //             },
    //     //             {
    //     //                 $lookup: {
    //     //                     from: "user",
    //     //                     localField: "assignUid",
    //     //                     foreignField: "_id",
    //     //                     pipeline: [{ $project: { name: 1 } }],
    //     //                     as: "assignUid"
    //     //                 }
    //     //             },
    //     //             { $match: filterQuery },
    //     //             { $sort: sortCriteria }, 
    //     //             { $skip: (page - 1) * limit },
    //     //             { $limit: parseInt(limit, 10) }
    //     //         ]);

    //     //         // Count total documents (without pagination)
    //     //         const totalCount = await DB.VATTENFALL.countDocuments(filterQuery);

    //     //         return apiResponse.OK({
    //     //             res,
    //     //             message: messages.SUCCESS,
    //     //             data: { count: totalCount, data }
    //     //         });
    //     //     } catch (error) {
    //     //         console.error("Error in getVattenfall:", error);
    //     //         return apiResponse.INTERNAL_SERVER_ERROR({
    //     //             res,
    //     //             message: messages.ERROR
    //     //         });
    //     //     }
    //     // },
    //     if (startDate && endDate) {
    //         const endDateObject = new Date(endDate);
    //         endDateObject.setDate(endDateObject.getDate() + 1);

    //         filterQuery.createdAt = {
    //             $gte: new Date(startDate),
    //             $lte: endDateObject
    //         };
    //     }

    //     if (firma) {
    //         firma = firma.split(',');
    //         filterQuery.firma = { $in: firma.map(name => new RegExp(`^${name}$`, "i")) };
    //     }

    //     Object.assign(query, filterQuery);

    //     console.log("query", query);
    //     console.log("filterQuery", filterQuery);

    //     try {
    //         // Build the $sort object dynamically based on the sort parameters
    //         let sortCriteria = {};
    //         if (sortFirma) {
    //             sortCriteria.firma = sortFirma.toLowerCase() === 'asc' ? 1 : -1;
    //         } else {
    //             sortCriteria[sortBy] = sortOrder;
    //         }

    //         const data = await DB.VATTENFALL.aggregate([
    //             {
    //                 $lookup: {
    //                     from: "user",
    //                     localField: "patners",
    //                     foreignField: "_id",
    //                     pipeline: [{ $project: { name: 1 } }],
    //                     as: "patners"
    //                 }
    //             },
    //             {
    //                 $lookup: {
    //                     from: "user",
    //                     localField: "assignUid",
    //                     foreignField: "_id",
    //                     pipeline: [{ $project: { name: 1 } }],
    //                     as: "assignUid"
    //                 }
    //             },
    //             { $match: filterQuery },
    //             { $sort: sortCriteria },
    //             { $skip: (page - 1) * limit },
    //             { $limit: parseInt(limit, 10) }
    //         ]);

    //         // Count total documents (without pagination)
    //         const totalCount = await DB.VATTENFALL.countDocuments(filterQuery);

    //         return apiResponse.OK({
    //             res,
    //             message: messages.SUCCESS,
    //             data: { count: totalCount, data }
    //         });
    //     } catch (error) {
    //         console.error("Error in getVattenfall:", error);
    //         return apiResponse.INTERNAL_SERVER_ERROR({
    //             res,
    //             message: messages.ERROR
    //         });
    //     }
    // },
    getVattenfall: async (req, res) => {
        let {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = -1,
            sortFirma,
            sortStrabe,
            sortPLZ,
            search,
            projectName,
            userName,
            userId,
            isAssign,
            email,
            name,
            strabe,
            startDate,
            endDate,
            addSearch,
            pLZSearch,
            ...query
        } = req.query;

        let { firma } = req.body;

        let filterQuery = {};

        // Text search filters
        if (search) {
            filterQuery.$or = [
                { email: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { pLZ: { $regex: search, $options: "i" } },
                { strabe: { $regex: search, $options: "i" } },
                { firma: { $regex: search, $options: "i" } },
                { "assignUid.name": { $regex: search, $options: "i" } }
            ];
        }

        if (addSearch) {
            filterQuery.$or = [

                { strabe: { $regex: addSearch, $options: "i" } },

            ];
        }
        if (pLZSearch) {
            filterQuery.$or = [

                { pLZ: { $regex: pLZSearch, $options: "i" } },

            ];
        }

        if (addSearch && pLZSearch) {
            filterQuery.$and = [

                { strabe: { $regex: addSearch, $options: "i" } },
                { pLZ: { $regex: pLZSearch, $options: "i" } },];

        }

        // Additional filters
        if (projectName) {
            filterQuery.projectName = projectName;
        }

        if (userName) {
            filterQuery.benutzername = { $regex: userName, $options: "i" };
        }

        // if (userId) {
        //     filterQuery.userId = { $in: Array.isArray(userId) ? userId : [userId] };
        // }

        if (userId) {
            filterQuery.assignUid = { $in: userId.map(id => new mongoose.Types.ObjectId(id)) };
        }
        
        console.log("isAssign", isAssign);
        
        console.log('filterQuery', filterQuery)
        // if (isAssign === false) {
        //     filterQuery.$or = [
        //         { assignUid: { $eq: [] } },
        //         { assignUid: { $exists: false } }
        //     ];
        // }

        if (isAssign === false) {
            const isAssignFilter = [
                { assignUid: { $eq: [] } },
                { assignUid: { $exists: false } }
            ];

            if (filterQuery.$or) {
                filterQuery.$and = [
                    { $or: filterQuery.$or },
                    { $or: isAssignFilter }
                ];
                delete filterQuery.$or;
            } else {
                filterQuery.$or = isAssignFilter;
            }
        }

        if (isAssign === true) {
            filterQuery.assignUid = { $exists: true, $ne: [] };
            // filterQuery.status = "conform"; // Ensure the lead is confirmed
            // filterQuery.conform = true;
        }

        if (startDate && endDate) {
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            filterQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: endDateObject
            };
        }

        if (firma) {
            firma = firma.split(',');
            filterQuery.firma = { $in: firma.map(name => new RegExp(`^${name}$`, "i")) };
        }

        Object.assign(query, filterQuery);

        console.log("query", query);
        console.log("filterQuery", filterQuery);

        try {
            // Build the $sort object dynamically based on the sort parameters
            let sortCriteria = {};
            // Apply individual sorting if provided
            if (sortFirma) {
                sortCriteria.firma = sortFirma.toLowerCase() === "asc" ? 1 : -1;
            }
            if (sortStrabe) {
                sortCriteria.strabe = sortStrabe.toLowerCase() === "asc" ? 1 : -1;
            }
            if (sortPLZ) {
                sortCriteria.pLZ = sortPLZ.toLowerCase() === "asc" ? 1 : -1;
            }

            // Apply default sorting only if no other sorting is specified
            if (Object.keys(sortCriteria).length === 0) {
                sortCriteria[sortBy] = sortOrder;
            }

            const data = await DB.VATTENFALL.aggregate([
                { $match: filterQuery },
                {
                    $lookup: {
                        from: "user",
                        localField: "patners",
                        foreignField: "_id",
                        pipeline: [{ $project: { name: 1 } }],
                        as: "patners"
                    }
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "assignUid",
                        foreignField: "_id",
                        pipeline: [{ $project: { name: 1 } }],
                        as: "assignUid"
                    }
                },
                
                { $sort: sortCriteria },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit, 10) }
            ]);

            // Count total documents (without pagination)
            const totalCount = await DB.VATTENFALL.countDocuments(filterQuery);

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: { count: totalCount, data }
            });
        } catch (error) {
            console.error("Error in getVattenfall:", error);
            return apiResponse.INTERNAL_SERVER_ERROR({
                res,
                message: messages.ERROR
            });
        }
    },





    getTeamReport: async (req, res) => {
        let { user } = req
        const findUser = await DB.USER.find({ patners: user._id });

        let data = [];
        for (let i = 0; i < findUser.length; i++) {
            const element = findUser[i];

            let obj = {
                name: element.name,
                _id: element._id,
                userLead: element.userLead
            };
            data.push(obj)

        }
        let obj2 = {
            name: user.name,
            _id: user._id,
            userIds: user.userLead
        }
        data.push(obj2)

        const userIds = data.map(user => user._id);

        let { page, limit, sortBy, sortOrder, search, status, userId, startDate, endDate, ...query } = req.query;
        let filterQuery = {};

        if (status) {
            filterQuery.status = { $in: status };
        }
        if (startDate && endDate) {
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            filterQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDateObject) };
        }
        if (userIds) {
            filterQuery.benutzerId = { $in: userIds }
        }
        if (userId) {
            filterQuery.benutzerId = { $in: userId }
        }
        Object.assign(query, filterQuery);

        let allStatus = []
        const findStraper = await DB.STAPER
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .select("createdAt status benutzername")
            .lean();

        // const findStraper = find.filter(item => item.status !== null);

        findStraper.forEach(item => {
            if (!allStatus.includes(item.status)) {
                allStatus.push(item.status);
            }
        });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.STAPER.countDocuments(query), findStraper, data, allStatus } });
    },

    getTeamVattenReport: async (req, res) => {
        let { user } = req
        const findUser = await DB.USER.find({ patners: user._id });

        let data = [];
        for (let i = 0; i < findUser.length; i++) {
            const element = findUser[i];

            let obj = {
                name: element.name,
                _id: element._id,
                userLead: element.userLead
            };
            data.push(obj)

        }
        let obj2 = {
            name: user.name,
            _id: user._id,
            userIds: user.userLead
        }
        data.push(obj2)

        const userIds = data.map(user => user._id);

        let { page, limit, sortBy, sortOrder, search, status, userId, startDate, endDate, ...query } = req.query;
        let filterQuery = {};

        // if (status) {
        //     filterQuery.status = { $in: status };
        // }
        if (startDate && endDate) {
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            filterQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDateObject) };
        }
        if (userIds) {
            filterQuery.benutzerId = { $in: userIds }
        }
        if (userId) {
            filterQuery.benutzerId = { $in: userId }
        }
        Object.assign(query, filterQuery);

        let allStatus = []
        const findStraper = await DB.VATTENFALL
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .select("createdAt status benutzername")
            .lean();

        // const findStraper = find.filter(item => item.status !== null);

        findStraper.forEach(item => {
            if (!allStatus.includes(item.status)) {
                allStatus.push(item.status);
            }
        });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.VATTENFALL.countDocuments(query), findStraper, data, allStatus } });
    },

    deleteStraper: async (req, res) => {
        let { id } = req.query;

        const straper = await DB.STAPER.findOne({ _id: id })
        if (!straper) {
            return apiResponse.NOT_FOUND({
                res,
                message: messages.NOT_FOUND
            })
        }

        await DB.STAPER.findOneAndDelete({ _id: id })

        return apiResponse.OK({
            res,
            message: messages.SUCCESS
        })
    },

    // deleteVattenfall: async (req, res) => {
    //     let { id } = req.query;

    //     const straper = await DB.VATTENFALL.findOne({ _id: id })
    //     if (!straper) {
    //         return apiResponse.NOT_FOUND({
    //             res,
    //             message: messages.NOT_FOUND
    //         })
    //     }

    //     await DB.ASSIGNLEAD.deleteMany({ leadId: id })
    //     await DB.VATTENFALL.findOneAndDelete({ _id: id })

    //     return apiResponse.OK({
    //         res,
    //         message: messages.SUCCESS
    //     })
    // },

    deleteVattenfall: async (req, res) => {
        try {
            let { id } = req.query;
            console.log('id', id)

            if (!id) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "ID is required"
                });
            }

            // Convert id to an array if it's a single string
            const ids = Array.isArray(id) ? id : [id];

            // Find all matching records
            const records = await DB.VATTENFALL.find({ _id: { $in: ids } });

            if (records.length === 0) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: messages.NOT_FOUND
                });
            }

            // Delete related leads
            await DB.ASSIGNLEAD.deleteMany({ leadId: { $in: ids } });

            // Delete records
            await DB.VATTENFALL.deleteMany({ _id: { $in: ids } });

            return apiResponse.OK({
                res,
                message: `${records.length} record(s) deleted successfully`
            });

        } catch (error) {
            console.error("Error deleting VATTENFALL record(s):", error);
            return apiResponse.INTERNAL_SERVER_ERROR({
                res,
                message: "Failed to delete record(s)"
            });
        }
    },

    updateStraper: async (req, res) => {

        let straper = req.body.straper
        if (!straper) {
            return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
        }

        await DB.STAPER.updateMany({ _id: straper }, { apiAdded: true }, { new: true });
        return apiResponse.OK({ res, message: messages.SUCCESS })
    },

    statusupdate: async (req, res) => {
        try {
            let id = req.query.param1
            let status = req.query.param2
            let notes = req?.query?.param3
            console.log(id, "---------- id param1 -----------------")
            console.log(status, '-------------- status ---------')
            console.log(notes, "------ notes -------")

            await DB.STAPER.updateMany({ wf_leadid: id }, { $set: { status: status, notes: notes } }, { new: true });
            const find = await DB.STAPER.find({ wf_leadid: id, status: status })
            if (!find) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
            }
            console.log(find, "------------ find ----------")
            return apiResponse.OK({ res, message: messages.SUCCESS, data: find });
        } catch (error) {
            console.log(error, "---------- catch error ------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    updateStraperStatus: async (req, res) => {
        try {

            const find = await DB.STAPER.findOne({ _id: req.query.id });
            if (!find) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }

            const updateStraper = await DB.STAPER.findOneAndUpdate({ _id: find._id }, { $set: { wf_leadid: req.body.wf_leadid, status: req.body.status } }, { new: true })
            return apiResponse.OK({ res, message: messages.SUCCESS, data: updateStraper });
        } catch (error) {
            console.log(error, "-------- catch error --------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getStraperStatus: async (req, res) => {
        try {
            let { user } = req;

            let { startDate, endDate, _id, ...query } = req.query;

            let filterQuery = {};

            if (startDate) {
                const startDateObject = new Date(startDate);
                const endDateObject = new Date(endDate);
                endDateObject.setDate(endDateObject.getDate() + 1);
                filterQuery.createdAt = {
                    $gte: startDateObject,
                    $lt: endDateObject,
                };
            }
            if (_id) {
                filterQuery.benutzerId = _id;
            }

            Object.assign(query, filterQuery);

            console.log("========", query);
            const getStraper = await DB.STAPER.find(query);
            const statusCounts = getStraper.reduce((acc, straper) => {
                const status = straper.status || "null";
                if (!acc[status]) {
                    acc[status] = 0;
                }
                acc[status]++;
                return acc;
            }, {});

            const getStraperVatt = await DB.VATTENFALL.find(query);
            const statusCountsVatt = getStraperVatt.reduce((acc, straper) => {
                const status = straper.status || "null";
                if (!acc[status]) {
                    acc[status] = 0;
                }
                acc[status]++;
                return acc;
            }, {});

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    statusCounts: statusCounts,
                    statusCountsVatt: statusCountsVatt,
                },
            });
        } catch (error) {
            console.log(error, "-----------error----------");
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getStrVattUserStatus: async (req, res) => {
        try {
            let { user } = req;

            let { startDate, endDate, _id, ...query } = req.query;

            let filterQuery = {};

            if (startDate) {
                const startDateObject = new Date(startDate);
                const endDateObject = new Date(endDate);
                endDateObject.setDate(endDateObject.getDate() + 1);
                filterQuery.createdAt = {
                    $gte: startDateObject,
                    $lt: endDateObject
                };
            }
            if (_id) {
                filterQuery.benutzerId = _id;
            }

            Object.assign(query, filterQuery);

            console.log("========", query)
            const getStraper = await DB.VATTENFALL.find(query);
            const statusCounts = getStraper.reduce((acc, straper) => {
                const status = straper.status || 'null';
                if (!acc[status]) {
                    acc[status] = 0;
                }
                acc[status]++;
                return acc;
            }, {});


            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    statusCounts: statusCounts
                }
            });
        } catch (error) {
            console.log(error, "-----------error----------")
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getStraReport: async (req, res) => {
        try {
            let { user } = req;

            let { startDate, endDate } = req.query

            const startDateObject = new Date(startDate);
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            // Get today "straper" data
            const todayStraper = await DB.STAPER.find({
                benutzerId: user._id,
                createdAt: { $gte: moment().startOf('day').toDate() }
            });

            const todayStraperVatt = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: { $gte: moment().startOf('day').toDate() }
            });

            // Get yesterday's "straper" data
            const yesterdayStraper = await DB.STAPER.find({
                benutzerId: user._id,
                createdAt: {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lt: moment().startOf('day').toDate()
                }
            });

            const yesterdayStraperVatt = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lt: moment().startOf('day').toDate()
                }
            });

            // Get current week's "straper" data
            const startOfWeek = moment().startOf('week');
            const endOfWeek = moment().endOf('week');

            const currentWeekStraper = await DB.STAPER.find({
                benutzerId: user._id,
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            });

            const currentWeekStraperVatt = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            });

            // Get current month's "straper" data
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');

            const currentMonthStraper = await DB.STAPER.find({
                benutzerId: user._id,
                status: "Confirmed",
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            });

            const currentMonthStraperVatt = await DB.VATTENFALL.find({
                benutzerId: user._id,
                $or: [
                    { status: "VERKAUFT" },
                    { status: "AUFMAß" },
                    { status: "ANGEBOTSBESPRECHUNG" },
                    { status: "ANGEBOTSBESPRECHUNG 2" },
                    { status: { $regex: /^TERMINIERT/, $options: 'i' } }
                ],
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            });

            // Get top 4 user create straper
            const getTop = await DB.STAPER.aggregate([
                {
                    $match: {
                        status: "Confirmed",
                        createdAt: { $gte: startDateObject, $lt: endDateObject }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                    }
                }
            ]);

            const getTopVatt = await DB.VATTENFALL.aggregate([
                {
                    $match: {
                        $or: [
                            { status: "VERKAUFT" },
                            { status: "AUFMAß" },
                            { status: "ANGEBOTSBESPRECHUNG" },
                            { status: "ANGEBOTSBESPRECHUNG 2" },
                            { status: { $regex: /^TERMINIERT/, $options: 'i' } }
                        ],
                        createdAt: { $gte: startDateObject, $lt: endDateObject }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                    }
                }
            ]);
            const twoArray = []
            twoArray.push(getTop, getTopVatt)
            const finaleArray = [].concat(...twoArray);
            const sortedFinaleArray = finaleArray.sort((a, b) => b.count - a.count);
            const top4Users = sortedFinaleArray.slice(0, 4);

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    today: todayStraper.length,
                    yesterday: yesterdayStraper.length,
                    currentWeek: currentWeekStraper.length,
                    currentMonth: { monthly: currentMonthStraper.length, lead: user.userLead },
                    // topFor: getTop,
                    topFor: top4Users,
                    todayVatt: todayStraperVatt.length,
                    yesterdayVatt: yesterdayStraperVatt.length,
                    currentWeekVatt: currentWeekStraperVatt.length,
                    currentMonthVatt: { monthly: currentMonthStraperVatt.length, lead: user.userLead },
                    // topForVatt: getTopVatt
                }
            });
        } catch (error) {
            console.log(error, "-----------error----------")
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getStraVattUserReport: async (req, res) => {
        try {
            let { user } = req;

            let { startDate, endDate } = req.query

            const startDateObject = new Date(startDate);
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            // Get today "straper" data
            const todayStraper = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: { $gte: moment().startOf('day').toDate() }
            });

            // Get yesterday's "straper" data
            const yesterdayStraper = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lt: moment().startOf('day').toDate()
                }
            });

            // Get current week's "straper" data
            const startOfWeek = moment().startOf('week');
            const endOfWeek = moment().endOf('week');

            const currentWeekStraper = await DB.VATTENFALL.find({
                benutzerId: user._id,
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            });

            // Get current month's "straper" data
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');

            const currentMonthStraper = await DB.VATTENFALL.find({
                benutzerId: user._id,
                // status: "Confirmed",
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            });

            // Get top 4 user create straper
            const getTop = await DB.VATTENFALL.aggregate([
                {
                    $match: {
                        // status: "Confirmed",
                        createdAt: { $gte: startDateObject, $lt: endDateObject }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                    }
                }
            ]);

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    today: todayStraper.length,
                    yesterday: yesterdayStraper.length,
                    currentWeek: currentWeekStraper.length,
                    currentMonth: { monthly: currentMonthStraper.length, lead: user.userLead },
                    topFor: getTop
                }
            });
        } catch (error) {
            console.log(error, "-----------error----------")
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },
    getStraReportById: async (req, res) => {
        try {

            let { startDate, endDate } = req.query

            const startDateObject = new Date(startDate);
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            const userData = await DB.USER.findOne({ _id: req.query.id })
            if (!userData) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
            }

            // Get today "straper" data
            const todayStraper = await DB.STAPER.find({
                benutzerId: userData._id,
                createdAt: { $gte: moment().startOf('day').toDate() }
            });

            // Get yesterday's "straper" data
            const yesterdayStraper = await DB.STAPER.find({
                benutzerId: userData._id,
                createdAt: {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lt: moment().startOf('day').toDate()
                }
            });

            // Get current week's "straper" data
            const startOfWeek = moment().startOf('week');
            const endOfWeek = moment().endOf('week');

            const currentWeekStraper = await DB.STAPER.find({
                benutzerId: userData._id,
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            });

            // Get current month's "straper" data
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');

            const currentMonthStraper = await DB.STAPER.find({
                benutzerId: userData._id,
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            });

            // Get top 4 user create straper
            const getTop = await DB.STAPER.aggregate([
                {
                    $match: {
                        status: "Confirmed",
                        createdAt: { $gte: startDateObject, $lt: endDateObject }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                        "benutzername.vorname": 1
                    }
                }
            ]);

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    today: todayStraper.length,
                    yesterday: yesterdayStraper.length,
                    currentWeek: currentWeekStraper.length,
                    currentMonth: { monthly: currentMonthStraper.length, lead: userData.userLead },
                    topFor: getTop
                }
            });
        } catch (error) {
            console.log(error, "-----------error----------")
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getUsersStrRepo: async (req, res) => {
        try {
            let { user } = req;
            const findUser = await DB.USER.find({ patners: user._id });

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id,
                    userLead: element.userLead
                };
                data.push(obj)

            }

            const userIds = data.map(user => user._id);

            //* Get today "straper" data
            const todayStraper = await DB.STAPER.find({
                benutzerId: { $in: userIds },
                createdAt: { $gte: moment().startOf('day').toDate() }
            });

            const todayBenutzername = todayStraper.reduce((acc, entry) => {
                const { benutzername } = entry;
                if (acc[benutzername]) {
                    acc[benutzername]++;
                } else {
                    acc[benutzername] = 1;
                }
                return acc;
            }, {});

            const todayresult = Object.keys(todayBenutzername).map(benutzername => ({
                benutzername: benutzername,
                count: todayBenutzername[benutzername]
            }));

            //* Get yesterday's "straper" data
            const yesterdayStraper = await DB.STAPER.find({
                benutzerId: { $in: userIds },
                createdAt: {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lt: moment().startOf('day').toDate()
                }
            });

            const yesterdayBenutzername = yesterdayStraper.reduce((acc, entry) => {
                const { benutzername } = entry;
                if (acc[benutzername]) {
                    acc[benutzername]++;
                } else {
                    acc[benutzername] = 1;
                }
                return acc;
            }, {});

            const yesterdayresult = Object.keys(yesterdayBenutzername).map(benutzername => ({
                benutzername: benutzername,
                count: yesterdayBenutzername[benutzername]
            }));

            //* Get current week's "straper" data
            const startOfWeek = moment().startOf('week');
            const endOfWeek = moment().endOf('week');

            const currentWeekStraper = await DB.STAPER.find({
                benutzerId: { $in: userIds },
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            });

            const countByBenutzername = currentWeekStraper.reduce((acc, entry) => {
                const { benutzername } = entry;
                if (acc[benutzername]) {
                    acc[benutzername]++;
                } else {
                    acc[benutzername] = 1;
                }
                return acc;
            }, {});

            const result = Object.keys(countByBenutzername).map(benutzername => ({
                benutzername: benutzername,
                count: countByBenutzername[benutzername]
            }));

            //* Get current month's "straper" data
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');

            const currentMonthStraper = await DB.STAPER.find({
                benutzerId: { $in: userIds },
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            });

            const currMonBenutzername = currentMonthStraper.reduce((acc, entry) => {
                const { benutzername } = entry;
                if (acc[benutzername]) {
                    acc[benutzername]++;
                } else {
                    acc[benutzername] = 1;
                }
                return acc;
            }, {});

            const currMonresult = Object.keys(currMonBenutzername).map(benutzername => ({
                benutzername: benutzername,
                count: currMonBenutzername[benutzername]
            }));

            //* Get top 4 user create straper
            const getTop = await DB.STAPER.aggregate([
                {
                    $match: {
                        benutzerId: { $in: userIds }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                    }
                }
            ]);

            const usersLead = data.map(user => user.userLead);
            const totalUsersLead = usersLead.reduce((accumulator, currentValue) => accumulator + currentValue, 0);


            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: {
                    today: { data: todayresult, length: todayStraper.length },
                    yesterday: { data: yesterdayresult, length: yesterdayStraper.length },
                    currentWeek: { data: result, length: currentWeekStraper.length },
                    currentMonth: { monthly: { data: currMonresult, length: currentMonthStraper.length }, lead: totalUsersLead },
                    topFor: getTop,
                    totalUser: data
                }
            });
        } catch (error) {
            console.log(error, "--------------- error --------------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getUserStatusCount: async (req, res) => {
        try {
            let { user } = req;

            let { startDate, endDate } = req.query

            const startDateObject = new Date(startDate);
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);


            const findUser = await DB.USER.find({ patners: user._id });

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id,
                    userLead: element.userLead
                };
                data.push(obj)

            }

            const userIds = data.map(user => user._id);
            const userLeads = data.map(user => user.userLead);
            const formattedResponse = [];

            const allStapers = await Promise.all(userIds.map(userId =>
                DB.STAPER.find({ benutzerId: userId, createdAt: { $gte: startDateObject, $lt: endDateObject } })
            ));

            for (let index = 0; index < allStapers.length; index++) {
                const stapers = allStapers[index];
                const userId = userIds[index];
                const userLead = userLeads[index]

                let confirmedCount = 0;
                let rejectedCount = 0;
                let openCount = 0;

                stapers.forEach(staper => {
                    switch (staper.status) {
                        case "Confirmed":
                            confirmedCount++;
                            break;
                        case "Rejected":
                            rejectedCount++;
                            break;
                        case "Open":
                            openCount++;
                            break;
                        default:
                            break;
                    }
                });

                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                const monthlyPromises = months.map(monthName => {
                    const startOfMonth = moment().month(monthName).startOf('month');
                    const endOfMonth = moment().month(monthName).endOf('month');

                    return DB.STAPER.find({
                        benutzerId: userId,
                        createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
                        status: "Confirmed"
                    }).then(stapers => ({
                        monthName: monthName.slice(0, 3),
                        data: stapers.length
                    }));
                });

                const monthlyResults = await Promise.all(monthlyPromises);

                formattedResponse.push({
                    uid: userId,
                    userLead: userLead,
                    total: stapers.length,
                    counts: [
                        { status: "Confirmed", count: confirmedCount },
                        { status: "Rejected", count: rejectedCount },
                        { status: "Open", count: openCount }
                    ],
                    month: monthlyResults
                });
            }

            return apiResponse.OK({ res, message: messages.SUCCESS, data: formattedResponse })
        } catch (error) {
            console.log(error, "---------- catch error --------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getStraperRepoMonth: async (req, res) => {
        try {
            let { user } = req;

            const userId = user._id;
            const startOfYear = moment().startOf("year").toDate();
            const currentYear = moment().year();

            const allMonths = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                year: currentYear,
                count: 0,
            }));

            const monthlyCounts = await DB.STAPER.aggregate([
                {
                    $match: {
                        status: "Confirmed",
                        benutzerId: userId,
                        createdAt: { $gte: startOfYear },
                    },
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                    },
                },
                {
                    $sort: {
                        month: 1,
                    },
                },
            ]);

            const mergedCounts = allMonths.map((monthObj) => {
                const found = monthlyCounts.find(
                    (countObj) => countObj.month === monthObj.month
                );
                return found ? found : monthObj;
            });

            const monthlyCountsVatt = await DB.VATTENFALL.aggregate([
                {
                    $match: {
                        benutzerId: userId,
                        $or: [
                            { status: "VERKAUFT" },
                            { status: "AUFMAß" },
                            { status: "ANGEBOTSBESPRECHUNG" },
                            { status: "ANGEBOTSBESPRECHUNG 2" },
                            { status: { $regex: /^TERMINIERT/, $options: "i" } },
                        ],
                        createdAt: { $gte: startOfYear },
                    },
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                    },
                },
                {
                    $sort: {
                        month: 1,
                    },
                },
            ]);

            const mergedCountsVatt = allMonths.map((monthObj) => {
                const found = monthlyCountsVatt.find(
                    (countObj) => countObj.month === monthObj.month
                );
                return found ? found : monthObj;
            });

            const mixData = allMonths.map((monthObj) => {
                const mergedCount = mergedCounts.find(
                    (countObj) => countObj.month === monthObj.month
                );
                const mergedCountVatt = mergedCountsVatt.find(
                    (countObj) => countObj.month === monthObj.month
                );
                return {
                    month: monthObj.month,
                    year: monthObj.year,
                    count:
                        (mergedCount ? mergedCount.count : 0) +
                        (mergedCountVatt ? mergedCountVatt.count : 0),
                };
            });
            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: { mergedCounts, mergedCountsVatt, mixData },
            });
        } catch (error) {
            console.error("----------error--------", error);
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getStrRepoVattUserMonth: async (req, res) => {
        try {
            let { user } = req;

            const userId = user._id;
            const startOfYear = moment().startOf('year').toDate();
            const currentYear = moment().year();

            const allMonths = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                year: currentYear,
                count: 0
            }));

            const monthlyCounts = await DB.VATTENFALL.aggregate([
                {
                    $match: {
                        // status: "Confirmed",
                        benutzerId: userId,
                        createdAt: { $gte: startOfYear }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                    }
                },
                {
                    $sort: {
                        month: 1
                    }
                }
            ]);

            const mergedCounts = allMonths.map(monthObj => {
                const found = monthlyCounts.find(countObj => countObj.month === monthObj.month);
                return found ? found : monthObj;
            });

            return apiResponse.OK({ res, message: messages.SUCCESS, data: mergedCounts })
        } catch (error) {
            console.error('----------error--------', error);
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getUsersStrRepoMon: async (req, res) => {
        try {
            let { user } = req;

            const findUser = await DB.USER.find({ patners: user._id });

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id
                };
                data.push(obj)

            }

            const userIds = data.map(user => user._id);

            const startOfYear = moment().startOf('year').toDate();
            const currentYear = moment().year();

            const allMonths = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                year: currentYear,
                count: 0
            }));

            const monthlyCounts = await DB.STAPER.aggregate([
                {
                    $match: {
                        benutzerId: { $in: userIds },
                        createdAt: { $gte: startOfYear }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                    }
                },
                {
                    $sort: {
                        month: 1
                    }
                }
            ]);

            const mergedCounts = allMonths.map(monthObj => {
                const found = monthlyCounts.find(countObj => countObj.month === monthObj.month);
                return found ? found : monthObj;
            });

            return apiResponse.OK({ res, message: messages.SUCCESS, data: mergedCounts })
        } catch (error) {
            console.error('----------error--------', error);
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getStrapRepoMonById: async (req, res) => {
        try {
            const user = await DB.USER.findOne({ _id: req.query.id })
            if (!user) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
            }

            const userId = user._id;
            const startOfYear = moment().startOf('year').toDate();
            const currentYear = moment().year();

            const allMonths = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                year: currentYear,
                count: 0
            }));

            const monthlyCounts = await DB.STAPER.aggregate([
                {
                    $match: {
                        status: "Confirmed",
                        benutzerId: userId,
                        createdAt: { $gte: startOfYear }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        count: 1,
                    }
                },
                {
                    $sort: {
                        month: 1
                    }
                }
            ]);

            const mergedCounts = allMonths.map(monthObj => {
                const found = monthlyCounts.find(countObj => countObj.month === monthObj.month);
                return found ? found : monthObj;
            });

            return apiResponse.OK({ res, message: messages.SUCCESS, data: mergedCounts })
        } catch (error) {
            console.error('----------error--------', error);
            return apiResponse.CATCH_ERROR({
                res,
                message: messages.INTERNAL_SERVER_ERROR
            })
        }
    },

    getAllUserPatners: async (req, res) => {
        try {
            let { user } = req;
            let { startDate, endDate } = req.query

            const findUser = await DB.USER.find({ patners: user._id });

            const startDateObject = new Date(startDate);
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id,
                    userLead: element.userLead
                };
                data.push(obj)
            }
            const userIds = data.map(user => user._id);

            //* Get all user patners create straper
            const getTop = await DB.STAPER.aggregate([
                {
                    $match: {
                        benutzerId: { $in: userIds },
                        status: "Confirmed",
                        createdAt: { $gte: startDateObject, $lt: endDateObject }
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        count: { $sum: 1 },
                        benutzername: { $first: "$benutzername" },
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "benutzername",
                        foreignField: "name",
                        as: "benutzername"
                    }
                },
                {
                    $unwind: {
                        path: "$benutzername",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        "benutzername.name": 1,
                        "benutzername.profileImage": 1,
                    }
                }
            ]);
            if (!getTop) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }

            return apiResponse.OK({ res, message: messages.SUCCESS, data: getTop });
        } catch (error) {
            console.log(error, "--------- catch error ----------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    }
};
