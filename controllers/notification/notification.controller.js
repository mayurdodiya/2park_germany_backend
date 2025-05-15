const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const moment = require("moment");
const { count } = require("../../models/otp.model");


module.exports = exports = {

    createNotification: async (req, res) => {
        try {
            let { user } = req;

            const create = await DB.NOTIFICATION.create(req.body);

            for (const receiverId of req.body.receiver) {
                let unreadNotification = await DB.NOTIFICATION.countDocuments({ receiver: { $in: receiverId }, view: { $ne: receiverId } });
                global?.io?.to(receiverId.toString()).emit("check-notification", { unreadNotification });
            }

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: create
            });
        } catch (error) {
            console.log(error, "-------------catch error---------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getAllNotification: async (req, res) => {
        try {
            let { page, limit, sortBy, sortOrder, search, ...query } = req.query;
            if(search) {
                query.$or = [{ title: { $regex: search, $options: "i" } }]
            }
            const find = await DB.NOTIFICATION
                .find(query)
                .populate({ path: "receiver", select: "name" })
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 });
            if (!find) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }

            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: find
            });
        } catch (error) {
            console.log(error, "----------catch error------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    pinNotification: async (req, res) => {
        try {
            let { user } = req;

            const findNotification = await DB.NOTIFICATION.findOne({ _id: req.query.id, receiver: { $in: user._id } });
            if (!findNotification) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }
            const updateNoti = await DB.NOTIFICATION.findOneAndUpdate({ _id: req.query.id, receiver: { $in: user._id } }, { $push: { pin: user._id } }, { new: true });
            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: updateNoti
            });
        } catch (error) {
            console.log(error, "--------------catch error----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    unPinNotification: async (req, res) => {
        try {
            let { user } = req;

            const findNotification = await DB.NOTIFICATION.findOne({ _id: req.query.id, receiver: { $in: user._id }, pin: { $in: user._id } });
            if (!findNotification) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }
            const updateNoti = await DB.NOTIFICATION.findOneAndUpdate({ _id: req.query.id, receiver: { $in: user._id }, pin: { $in: user._id } }, { $pull: { pin: user._id } }, { new: true });
            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: updateNoti
            });
        } catch (error) {
            console.log(error, "--------------catch error----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getUserNotification: async (req, res) => {
        try {
            let { user } = req;
            let { page, limit, sortBy, sortOrder, search, ...query } = req.query;
            if(search) {
                query.$or = [{ title: { $regex: search, $options: "i" } }]
            }
            if(query) query = { ...query, receiver: user._id }
            
            const findUserNoti = await DB.NOTIFICATION.aggregate([
                {
                    $match: query
                },
                {
                    $addFields: {
                        isRead: { $cond: { if: { $in: [user._id, "$read"] }, then: true, else: false } },
                        isViewed: { $cond: { if: { $in: [user._id, "$view"] }, then: true, else: false } },
                        isPinned: { $cond: { if: { $in: [user._id, "$pin"] }, then: true, else: false } }
                    }
                },
                {
                    $facet: {
                        pinned: [
                            { $match: { isPinned: true } },
                            { $sort: { updatedAt: -1 } }
                        ],
                        nonPinned: [
                            { $match: { isPinned: false } },
                            { $sort: { createdAt: -1 } }
                        ]
                    }
                },
                {
                    $project: {
                        notifications: { $concatArrays: ["$pinned", "$nonPinned"] }
                    }
                },
                { $unwind: "$notifications" },
                { $replaceRoot: { newRoot: "$notifications" } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ])
            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: findUserNoti
            });
        } catch (error) {
            console.log(error, "-------------catch error---------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            let id = req.query.id

            const findNoti = await DB.NOTIFICATION.findOne({ _id: id });
            if (!findNoti) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
            }

            await DB.NOTIFICATION.findOneAndDelete({ _id: findNoti?._id });

            return apiResponse.OK({ res, message: "Notification delete succssecssfully" })
            
        } catch (error) {
            console.log(error,"------------catch error-------------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    }
};
