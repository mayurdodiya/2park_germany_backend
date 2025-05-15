const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");


module.exports = exports = {


    addStraper: async (req, res) => {
        let { user } = req;
        let data = req?.files

        const newsLater = await DB.STAPER2.findOne({ email: req.body.email })
        if (newsLater) {
            return apiResponse.DUPLICATE_VALUE({
                res,
                message: messages.DUPLICATE_KEY
            })
        }

        let photoArray = [];
        if (data && data.length > 0) {
            data.forEach(file => {
                photoArray.push(file.location);
            });
        }
        req.body.photo = photoArray

        const create = await DB.STAPER2.create(req.body)
        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: create
        })
    },

    getStraper: async (req, res) => {
        let { page, limit, sortBy, sortOrder, search, ...query } = req.query;

        // query = req.user.roleId.name === ADMIN ? { ...query } : { _id: req.user._id };
        search ? query.$or = [{ email: { $regex: search, $options: "i" } }, { Vor_und_Nachname: { $regex: search, $options: "i" } }] : "";

        const data = await DB.STAPER2
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.STAPER2.countDocuments(query), data } });
    },

    deleteStraper: async (req, res) => {
        let { id } = req.query;

        const straper = await DB.STAPER2.findOne({ _id: id })
        if (!straper) {
            return apiResponse.NOT_FOUND({
                res,
                message: messages.NOT_FOUND
            })
        }

        await DB.STAPER2.findOneAndDelete({ _id: id })

        return apiResponse.OK({
            res,
            message: messages.SUCCESS
        })
    }
};
