const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;


module.exports = exports = {

    addSelectDate: async (req, res) => {
        try {
            let { user } = req;
            // let inputDate = new Date(req.body.date);

            let inputDates = [];
            if (typeof req.body.date === 'string') {
                inputDates = req.body.date.split(',');
            } else {
                inputDates = req.body.date;
            }
            const findDate = await DB.DATESELECT.findOne({ uid: user._id, date: { $in: inputDates } });

            if (findDate) {
                const setDate = await DB.DATESELECT.findOneAndUpdate(
                    // { uid: user._id, date: { $ne: inputDates }, _id: { $ne: updateDate } },
                    { uid: user._id, isAvailable: req.body.isAvailable ? true : false, isAvailableTravel: req.body.isAvailableTravel ? true : false, isNotAvailable: req.body.isNotAvailable ? true : false },
                    { $addToSet: { date: { $each: inputDates } } },
                    { upsert: true, new: true }
                );

                await DB.DATESELECT.updateMany(
                    { uid: user._id, date: { $in: inputDates }, _id: { $ne: setDate._id } },
                    { $pull: { date: { $in: inputDates } } },
                    { new: true }
                );
                return apiResponse.OK({ res, message: messages.SUCCESS, data: setDate });
            } else {
                if (req.body.isAvailable == true) {
                    const findAvailable = await DB.DATESELECT.findOneAndUpdate({ uid: user._id, isAvailable: true }, { $push: { date: inputDates } }, { upsert: true, new: true });
                    return apiResponse.OK({ res, message: messages.SUCCESS, data: findAvailable });
                }
                if (req.body.isAvailableTravel == true) {
                    const findAvailableTravel = await DB.DATESELECT.findOneAndUpdate({ uid: user._id, isAvailableTravel: true }, { $push: { date: inputDates } }, { upsert: true, new: true });
                    return apiResponse.OK({ res, message: messages.SUCCESS, data: findAvailableTravel });
                }
                if (req.body.isNotAvailable == true) {
                    const findNotAvailable = await DB.DATESELECT.findOneAndUpdate({ uid: user._id, isNotAvailable: true }, { $push: { date: inputDates } }, { upsert: true, new: true });
                    return apiResponse.OK({ res, message: messages.SUCCESS, data: findNotAvailable });
                }
            }
            // if (req.body.isAvailable == true) {
            //     const findAvailable = await DB.DATESELECT.findOneAndUpdate({ uid: user._id, isAvailable: true }, { $push: { date: new Date(req?.body?.date) } }, { new: true, upsert: true });
            //     return apiResponse.OK({ res, message: messages.SUCCESS, data: findAvailable });
            // }
            // if (req.body.isAvailableTravel == true) {
            //     const findAvailableTravel = await DB.DATESELECT.findOneAndUpdate({ uid: user._id, isAvailableTravel: true }, { $push: { date: new Date(req?.body?.date) } }, { new: true, upsert: true });
            //     return apiResponse.OK({ res, message: messages.SUCCESS, data: findAvailableTravel });
            // }
            // req.body.uid = user._id

            // const create = await DB.DATESELECT.create(req.body)
            // return apiResponse.OK({ res, message: messages.SUCCESS, data: create })
        } catch (error) {
            console.log(error, "----------error--------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }
    },

    getSelectDate: async (req, res) => {
        let { user } = req;
        const { startDate, endDate, _id } = req.query;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        const findAvailable = await DB.DATESELECT.aggregate([
            {
                $match: {
                    uid: ObjectId(_id),
                    date: {
                        $exists: true,
                        $not: { $size: 0 },
                        $elemMatch: {
                            $gte: startDateObj,
                            $lte: endDateObj
                        }
                    }
                }
            },
            {
                $addFields: {
                    date: {
                        $filter: {
                            input: "$date",
                            as: "d",
                            cond: {
                                $and: [
                                    { $gte: ["$$d", startDateObj] },
                                    { $lte: ["$$d", endDateObj] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "uid",
                    foreignField: "_id",
                    as: "uid"
                }
            },
            {
                $unwind: "$uid"
            },
            {
                $project: {
                    _id: 1,
                    isAvailable: 1,
                    uid: { _id: "$uid._id", name: "$uid.name" },
                    createdAt: 1,
                    date: 1,
                    isActive: 1,
                    isAvailableTravel: 1,
                    isNotAvailable: 1,
                    updatedAt: 1
                }
            }
        ]);
        if (!findAvailable) {
            return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
        }

        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: findAvailable
        });
    },

};
