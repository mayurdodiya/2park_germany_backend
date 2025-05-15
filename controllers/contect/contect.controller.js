const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");


module.exports = exports = {


    addContect: async (req, res) => {
        let { user } = req;

        const newsLater = await DB.CONTECT.findOne({ email: req.body.email })
        if (newsLater) {
            return apiResponse.DUPLICATE_VALUE({
                res,
                message: messages.DUPLICATE_KEY
            })
        }

        const create = await DB.CONTECT.create(req.body)
        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: create
        })
    },

    getContect: async (req, res) => {
        let { page, limit, sortBy, sortOrder, search, ...query } = req.query;

        // query = req.user.roleId.name === ADMIN ? { ...query } : { _id: req.user._id };
        search ? query.$or = [{ email: { $regex: search, $options: "i" } }] : "";

        const data = await DB.CONTECT
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.CONTECT.countDocuments(query), data } });
    },

    deleteContect: async (req, res) => {
        let { id } = req.query;

        const contact = await DB.CONTECT.findOne({ _id: id })
        if (!contact) {
            return apiResponse.NOT_FOUND({
                res,
                message: messages.NOT_FOUND
            })
        }

        await DB.CONTECT.findOneAndDelete({ _id: id })

        return apiResponse.OK({
            res,
            message: messages.SUCCESS
        })
    }
};
